const dotenv = require('dotenv');

dotenv.config();

const environment = {
  PORT: process.env.PORT || 3000,
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || 'your-default-connection-string',
  RSS_POLLING_INTERVAL: process.env.RSS_POLLING_INTERVAL || 300000, // Default to 5 minutes
};

module.exports = environment;