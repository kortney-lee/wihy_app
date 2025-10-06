const express = require('express');
const bodyParser = require('body-parser');
const { ensureInitialized } = require('./controllers/rssController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize RSS Controller and start polling
ensureInitialized().then(() => {
  console.log('RSS polling service started successfully.');
}).catch(error => {
  console.error('Failed to initialize RSS polling service:', error);
});

// Routes
app.use('/api', require('./routes/index'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});