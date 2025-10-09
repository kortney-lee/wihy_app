# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 5000

# Define environment variable
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
  const options = { hostname: 'localhost', port: 5000, path: '/api/health', timeout: 2000 }; \
  const req = http.request(options, (res) => { \
    if (res.statusCode === 200) process.exit(0); \
    else process.exit(1); \
  }); \
  req.on('error', () => process.exit(1)); \
  req.end();"

# Start the application
CMD ["npm", "start"]