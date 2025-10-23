# Docker Deployment Guide for WiHy UI

## Quick Docker Deployment (Manual)

Since your VM is already set up, let's deploy using Docker instead of the traditional method:

### 1. On your VM, install Docker (if not already installed):
```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group changes (or logout/login)
newgrp docker

# Verify Docker installation
docker --version
```

### 2. Build and run the application:
```bash
cd /opt/wihy-ui

# Build the Docker image
docker build -t wihy-ui:latest .

# Stop any existing containers
docker stop wihy-ui-app 2>/dev/null || true
docker rm wihy-ui-app 2>/dev/null || true

# Run the new container
docker run -d \
  --name wihy-ui-app \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  wihy-ui:latest

# Check if container is running
docker ps

# Check logs if needed
docker logs wihy-ui-app

# Test the application
curl http://localhost/health
```

### 3. Verify deployment:
```bash
# Check container status
docker ps --filter name=wihy-ui-app

# View container logs
docker logs wihy-ui-app

# Check resource usage
docker stats wihy-ui-app --no-stream

# Test endpoints
curl -I http://localhost/
curl http://localhost/health
```

## Docker Compose Deployment (Alternative)

For easier management, you can use Docker Compose:

### 1. Use the production service:
```bash
cd /opt/wihy-ui

# Run production container
docker-compose up -d wihy-ui-prod

# Check status
docker-compose ps

# View logs
docker-compose logs wihy-ui-prod

# Stop when needed
docker-compose down
```

## GitHub Actions with Docker

The updated GitHub Actions workflow now:

1. **Builds** the Docker image in the CI environment
2. **Tests** the container locally
3. **Saves** the image as a compressed tar file
4. **Transfers** the image to your VM
5. **Deploys** by loading and running the new container
6. **Verifies** the deployment with health checks

### Benefits of Docker Deployment:

✅ **Consistency** - Same environment everywhere  
✅ **Isolation** - No dependency conflicts  
✅ **Rollback** - Easy to revert to previous images  
✅ **Resource Management** - Container resource limits  
✅ **Health Monitoring** - Built-in health checks  
✅ **Zero Downtime** - Replace containers without service interruption  

### Container Features:

- **Multi-stage build** for optimized production image
- **Nginx** with production configuration
- **Health check endpoint** at `/health`
- **Gzip compression** enabled
- **Security headers** configured
- **Static asset caching** optimized
- **Automatic restart** policy

## Monitoring and Management

### Container Management Commands:
```bash
# View running containers
docker ps

# Check container logs
docker logs wihy-ui-app

# Get container stats
docker stats

# Execute commands in container
docker exec -it wihy-ui-app /bin/sh

# Update application (redeploy)
cd /opt/wihy-ui
git pull origin main
docker build -t wihy-ui:latest .
docker stop wihy-ui-app
docker rm wihy-ui-app
docker run -d --name wihy-ui-app --restart unless-stopped -p 80:80 -p 443:443 wihy-ui:latest
```

### Cleanup Commands:
```bash
# Remove old/unused images
docker image prune -f

# Remove old containers
docker container prune -f

# View disk usage
docker system df

# Clean everything (careful!)
docker system prune -af
```

## Troubleshooting

### Common Issues:

1. **Port 80 already in use**: Stop nginx if it's running
   ```bash
   sudo systemctl stop nginx
   sudo systemctl disable nginx
   ```

2. **Permission denied**: Make sure user is in docker group
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Container won't start**: Check logs
   ```bash
   docker logs wihy-ui-app
   ```

4. **Health check failing**: Verify nginx configuration
   ```bash
   docker exec wihy-ui-app nginx -t
   ```

### Debug Commands:
```bash
# Test container locally
docker run --rm -p 8080:80 wihy-ui:latest

# Access container shell
docker exec -it wihy-ui-app /bin/sh

# Check container processes
docker exec wihy-ui-app ps aux

# Test from inside container
docker exec wihy-ui-app curl http://localhost/health
```

## Environment Variables

The Docker container supports these environment variables:

- `REACT_APP_WIHY_API_URL` - WiHy API endpoint
- `REACT_APP_ENVIRONMENT` - Environment (production/development)
- `REACT_APP_ENABLE_ANALYTICS` - Enable analytics
- `REACT_APP_ENABLE_CACHING` - Enable caching
- `REACT_APP_DEBUG_MODE` - Enable debug mode

You can set them when running the container:
```bash
docker run -d \
  --name wihy-ui-app \
  --restart unless-stopped \
  -p 80:80 \
  -e REACT_APP_WIHY_API_URL=http://wihymlapi.westus2.cloudapp.azure.com \
  -e REACT_APP_ENVIRONMENT=production \
  wihy-ui:latest
```

This Docker approach gives you much better control, consistency, and easier deployments! 🐳