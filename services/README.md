# vHealth Services API

A comprehensive Node.js/Express.js backend service providing health and nutrition analysis, RSS feed management, and caching capabilities.

## 🚀 Features

- **Health & Nutrition Analysis**: Food analysis endpoints with nutritional information
- **RSS Feed Management**: Health news aggregation and article management
- **Results Caching**: Intelligent caching system for improved performance
- **Database Integration**: Azure SQL Database support with fallback options
- **OpenAI Integration**: AI-powered analysis capabilities
- **Google Cloud Vision**: Image analysis support
- **RESTful API**: Well-structured REST endpoints
- **Modern JavaScript**: ES6+ features with Node.js

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Azure SQL Database (optional)
- OpenAI API key (optional)
- Google Cloud Vision API key (optional)

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kortney-lee/wihy_services.git
cd wihy_services
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# OpenAI API Configuration (Optional)
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_NODE_ENV=development

# Azure SQL Database Configuration (Optional)
DB_SERVER=your_database_server.database.windows.net
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
DB_CONNECTION_TIMEOUT=30000
```

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📡 API Endpoints

### Health & Status

- `GET /api/health` - Health check endpoint
- `GET /api/test` - Comprehensive system test

### Nutrition Analysis

- `POST /api/analyze` - Analyze food/nutrition query
- `GET /api/nutrition/:query` - Get nutrition information for a food item

### RSS & News

- `GET /api/news/feeds` - Get available RSS feeds
- `GET /api/news/articles` - Get health news articles
- `POST /api/news/articles/ingest` - Ingest new articles
- `POST /api/news/seed` - Seed sample feed data

### Caching System

- `POST /api/cache/save` - Save search results to cache
- `GET /api/cache/get?q=query` - Retrieve cached results
- `GET /api/cache/similar?q=query` - Find similar cached results
- `DELETE /api/cache/delete/:id` - Delete specific cache entry
- `POST /api/cache/cleanup` - Clean up expired cache entries
- `GET /api/cache/stats` - Get cache statistics

## 🔧 Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run watch` - Watch mode for development
- `npm run clean` - Clean build directory

### Project Structure

```
wihy_services/
├── dist/                # Compiled output (if needed)
├── routes/              # API route definitions
│   └── cacheRoutes.js   # Cache management routes
├── .env                 # Environment configuration
├── .env.example         # Environment template
├── index.js             # Simple server entry point
├── server.js            # Full-featured server entry point
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## 🐳 Docker Support

### Build Docker Image

```bash
docker build -t vhealth-services .
```

### Run with Docker

```bash
docker run -p 5000:5000 --env-file .env vhealth-services
```

### Docker Compose

```bash
docker-compose up -d
```

## 🌐 Deployment Options

### 1. Heroku

```bash
# Install Heroku CLI
heroku create your-app-name
git push heroku main
```

### 2. Azure App Service

```bash
# Install Azure CLI
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myUniqueAppName --runtime "NODE|16-lts"
az webapp deployment source config --name myUniqueAppName --resource-group myResourceGroup --repo-url https://github.com/kortney-lee/wihy_services --branch main
```

### 3. Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### 4. Vercel

```bash
# Install Vercel CLI
vercel --prod
```

## 🧪 Testing

### Test API Endpoints

```bash
# Health check
curl "http://localhost:5000/api/health"

# System test
curl "http://localhost:5000/api/test"

# Nutrition analysis
curl -X POST "http://localhost:5000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"query": "apple"}'

# Get news articles
curl "http://localhost:5000/api/news/articles"

# Cache test
curl -X POST "http://localhost:5000/api/cache/save" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "results": {"data": "sample"}, "source": "test"}'
```

## 🔒 Security Notes

- Keep your `.env` file secure and never commit it to version control
- Use environment variables for all sensitive configuration
- Implement rate limiting for production deployments
- Use HTTPS in production environments
- Validate and sanitize all user inputs

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `5000` |
| `CLIENT_URL` | Frontend URL for CORS | No | `http://localhost:3000` |
| `REACT_APP_OPENAI_API_KEY` | OpenAI API key | No | - |
| `DB_SERVER` | Database server | No | - |
| `DB_NAME` | Database name | No | - |
| `DB_USER` | Database username | No | - |
| `DB_PASSWORD` | Database password | No | - |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue on GitHub for bug reports
- Check existing issues before creating new ones
- Include detailed reproduction steps and environment information

## 📚 API Documentation

For detailed API documentation, visit `/api/docs` when the server is running (if Swagger is configured) or refer to the endpoint descriptions above.

---

**Made with ❤️ for better health and nutrition tracking**