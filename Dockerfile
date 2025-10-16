# Multi-stage build for WiHy UI - Serverless Container Optimized
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci && \
    cd client && npm ci

# Copy source code
COPY . .

# Build the client application with explicit permissions
RUN cd client && \
    chmod +x node_modules/.bin/* && \
    npm run build

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
EXPOSE 80

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]