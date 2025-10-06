const { getPool } = require('../config/database');
const RSSController = require('../controllers/rssController');

class PollingService {
  constructor() {
    this.rssController = new RSSController();
    this.pollingInterval = null;
  }

  async start() {
    try {
      await this.rssController.ensureInitialized();
      this.startPolling();
    } catch (error) {
      console.error('❌ Error starting Polling Service:', error);
    }
  }

  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    console.log('🕒 Starting RSS polling every 5 minutes...');

    this.pollingInterval = setInterval(async () => {
      try {
        console.log('🕒 Automatic RSS polling started...');
        await this.rssController.pollAllFeeds();
      } catch (error) {
        console.error('❌ Error in automatic polling:', error);
      }
    }, 5 * 60 * 1000);

    setTimeout(async () => {
      try {
        console.log('🚀 Initial RSS polling on startup...');
        await this.rssController.pollAllFeeds();
      } catch (error) {
        console.error('❌ Error in initial polling:', error);
      }
    }, 10000);
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🛑 RSS polling stopped');
    }
  }
}

module.exports = new PollingService();