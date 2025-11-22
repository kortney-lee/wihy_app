# Multi-stage build for WiHy UI - Optimized for React App
FROM node:18-alpine AS builder

# Set working directory to client
WORKDIR /app/client

# Copy only package files first for better layer caching
COPY client/package*.json client/package-lock.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy client source code and configuration files
COPY client/src ./src
COPY client/public ./public
COPY client/tsconfig.json ./tsconfig.json
COPY client/.env.production ./.env.production
COPY client/tailwind.config.js ./tailwind.config.js
COPY client/postcss.config.js ./postcss.config.js

# Set environment variables for build
ENV NODE_ENV=production
ENV REACT_APP_API_BASE_URL=https://wihy-api.azurewebsites.net/api
ENV REACT_APP_WIHY_API_URL=https://ml.wihy.ai
ENV REACT_APP_OPENFOODFACTS_API_URL=https://world.openfoodfacts.org
ENV REACT_APP_ENVIRONMENT=production
ENV REACT_APP_DEPLOYMENT_TYPE=container
ENV REACT_APP_SERVERLESS=true
ENV REACT_APP_DEBUG_MODE=false
ENV REACT_APP_ENABLE_ANALYTICS=true
ENV REACT_APP_ENABLE_CACHING=true

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