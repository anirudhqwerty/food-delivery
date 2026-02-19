# Build stage
FROM node:18 as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Runtime stage
FROM node:18-slim

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Copy node modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

EXPOSE 5002


# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "src/index.js"]
