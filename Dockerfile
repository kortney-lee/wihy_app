# Multi-stage build for WiHy UI
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci
RUN cd client && npm ci

# Copy source code
COPY . .

# Build the client application
RUN cd client && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built application
COPY --from=builder /app/client/build ./build

# Copy static web app config
COPY staticwebapp.config.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]