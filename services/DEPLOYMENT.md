# Deployment Configurations for vHealth Services

## Heroku

### Procfile
```
web: npm start
```

### Heroku Config
```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=\$PORT
heroku config:set REACT_APP_OPENAI_API_KEY=your_key_here
# Add other environment variables as needed
```

## Railway

### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

## Vercel

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Azure App Service

### web.config (for Windows)
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

## Google Cloud Platform

### app.yaml (App Engine)
```yaml
runtime: nodejs18

env_variables:
  NODE_ENV: production
  
automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6

handlers:
- url: /.*
  script: auto
  secure: always
  redirect_http_response_code: 301
```

## AWS Elastic Beanstalk

### .ebextensions/nodecommand.config
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
```

## DigitalOcean App Platform

### .do/app.yaml
```yaml
name: vhealth-services
services:
- name: api
  source_dir: /
  github:
    repo: kortney-lee/wihy_services
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  health_check:
    http_path: /api/health
  http_port: 8080
  routes:
  - path: /
```

## Environment Variables for Production

Essential environment variables for production deployment:

```bash
NODE_ENV=production
PORT=5000  # or process.env.PORT for dynamic port assignment
CLIENT_URL=https://your-frontend-domain.com

# Optional but recommended
REACT_APP_OPENAI_API_KEY=your_openai_key
DB_SERVER=your_db_server
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

## SSL/HTTPS Configuration

For production deployments, ensure HTTPS is enabled. Most cloud platforms handle this automatically, but for custom deployments:

1. Obtain SSL certificates
2. Configure your reverse proxy (nginx/Apache)
3. Update CORS settings for HTTPS origins
4. Set secure cookie flags if using sessions

## Monitoring and Health Checks

All platforms should monitor the health check endpoint:
- **Health Check URL**: `/api/health`
- **Expected Response**: 200 OK with JSON status
- **Timeout**: 30 seconds
- **Interval**: 30 seconds

## Performance Considerations

1. **Memory**: Minimum 512MB RAM recommended
2. **CPU**: Single core sufficient for basic usage
3. **Storage**: Minimal storage requirements
4. **Database**: External database recommended for production
5. **Caching**: Consider Redis for production caching