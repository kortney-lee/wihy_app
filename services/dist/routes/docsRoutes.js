const express = require('express');
const swaggerUi = require('swagger-ui-express');
const router = express.Router();

console.log('📚 Loading API documentation routes with swagger-ui-express...');

let docsController = null;
try {
  const ApiDocsController = require('../controllers/apiDocsController');
  docsController = new ApiDocsController();
  console.log('✅ API Documentation controller loaded');
} catch (error) {
  console.error('❌ Failed to load documentation controller:', error.message);
}

if (docsController) {
  const swaggerDocument = docsController.getOpenAPISpec();
  
  // Custom styling
  const customCss = `
    .swagger-ui .topbar { 
      background-color: #2c3e50;
      border-bottom: 1px solid #34495e;
    }
    .swagger-ui .topbar .download-url-wrapper { 
      display: none; 
    }
    .swagger-ui .topbar .link {
      color: #fff;
      font-family: sans-serif;
      font-weight: bold;
    }
    .swagger-ui .info .title {
      color: #2c3e50;
      font-size: 36px;
    }
    .swagger-ui .scheme-container {
      background: #fff;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,.15);
      padding: 20px;
      margin: 20px 0;
    }
  `;

  const swaggerOptions = {
    customCss,
    customSiteTitle: "vHealth RSS API - Interactive Documentation",
    swaggerOptions: {
      tryItOutEnabled: true,
      displayRequestDuration: true,
      docExpansion: 'list', // 'list' | 'full' | 'none'
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      persistAuthorization: true
    }
  };

  // Serve Swagger UI
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(swaggerDocument, swaggerOptions));

} else {
  // Fallback route
  router.get('/', (req, res) => {
    res.json({ 
      error: 'Documentation controller not available',
      message: 'Install swagger-ui-express: npm install swagger-ui-express'
    });
  });
}

// OpenAPI spec JSON endpoint
router.get('/openapi.json', (req, res) => {
  if (!docsController) {
    return res.json({ error: 'Documentation controller not available' });
  }
  res.json(docsController.getOpenAPISpec());
});

// Endpoints list
router.get('/endpoints', (req, res) => {
  if (!docsController) {
    return res.json({ error: 'Documentation controller not available' });
  }
  
  const spec = docsController.getOpenAPISpec();
  const endpoints = Object.entries(spec.paths).map(([path, methods]) => {
    return Object.entries(methods).map(([method, details]) => ({
      method: method.toUpperCase(),
      path,
      summary: details.summary,
      tags: details.tags || []
    }));
  }).flat();

  res.json({
    success: true,
    total_endpoints: endpoints.length,
    base_url: spec.servers[0].url,
    endpoints
  });
});

module.exports = router;