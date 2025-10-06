const axios = require('axios');
const xml2js = require('xml2js');

async function fetchAndParseRSSFeed(feedUrl) {
  try {
    const response = await axios.get(feedUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'RSS Polling Service',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.data) {
      throw new Error('No data received from RSS feed');
    }

    const parser = new xml2js.Parser({
      explicitArray: false,
      trim: true,
      normalize: true,
      explicitRoot: false
    });

    const result = await parser.parseStringPromise(response.data);
    
    if (!result.rss || !result.rss.channel) {
      throw new Error('Invalid RSS format - missing rss/channel structure');
    }

    const channel = result.rss.channel;
    const items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);
    
    const articles = items.map(item => ({
      title: item.title || '',
      description: item.description || '',
      link: item.link || '',
      pubDate: item.pubDate || '',
      guid: item.guid || ''
    }));

    return {
      success: true,
      feedTitle: channel.title || '',
      feedDescription: channel.description || '',
      feedLink: channel.link || '',
      articles: articles
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  fetchAndParseRSSFeed
};