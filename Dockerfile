# Multi-stage build for WiHy UI - Optimized for React App
FROM node:18-alpine AS builder

# Set working directory to client
WORKDIR /app/client

# Copy only package files first for better layer caching
COPY client/package*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy client source code
COPY client/src ./src
COPY client/public ./public
COPY client/tsconfig.json ./tsconfig.json

# Build the application
RUN npm run build

# Production stage - Optimized for serverless
FROM nginx:alpine AS production

# Install additional tools for serverless compatibility
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/client/build /usr/share/nginx/html

# Copy nginx configuration for SPA
COPY nginx.conf /etc/nginx/nginx.conf

# Copy health check script
COPY healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Expose port
EXPOSE 80

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]