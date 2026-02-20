CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL,
  driver_id UUID REFERENCES drivers(id), -- Nullable until a driver accepts it
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  pickup_location TEXT,
  dropoff_location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check
    CHECK (status IN ('PENDING', 'ASSIGNED', 'AT_RESTAURANT', 'PICKED_UP', 'DELIVERED'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
