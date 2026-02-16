CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  deleted_at TIMESTAMP NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns on existing databases
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- Constrain status/payment_status to known values
DO $$
BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN (
      'CREATED',
      'VENDOR_ACCEPTED',
      'VENDOR_REJECTED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    ));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN (
      'PENDING',
      'PAID',
      'FAILED',
      'REFUNDED'
    ));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id
ON orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created_at
ON orders(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id
ON orders(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_price NUMERIC(10,2) NOT NULL CHECK (item_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON order_items(order_id);

-- Outbox pattern for reliable event publishing
CREATE TABLE IF NOT EXISTS outbox_events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  routing_key VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  aggregate_type VARCHAR(50),
  aggregate_id UUID,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  dead_lettered_at TIMESTAMP NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
ON outbox_events(published_at, occurred_at);

-- Idempotent consumer support
CREATE TABLE IF NOT EXISTS processed_events (
  event_id UUID PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
