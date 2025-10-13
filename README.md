# WiHy UI - Health Management Platform

## Overview
WiHy UI is a comprehensive React-based health management platform that provides:
- **Main Health App**: Nutrition analysis, food search, and health information
- **Health Dashboard**: Personal health metrics visualization and tracking
- **News Integration**: Health article analysis with AI-powered insights

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** (version 8 or higher)
- **Git** for version control

### 📥 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kortney-lee/wihy_ui.git
   cd wihy_ui
   ```

2. **Install dependencies for all applications:**
   ```bash
   # Install root dependencies
   npm install --legacy-peer-deps
   
   # Install client app dependencies
   cd client
   npm install --legacy-peer-deps
   cd ..
   
   # Install user dashboard dependencies
   cd user
   npm install --legacy-peer-deps
   cd ..
   ```

### 🏃‍♂️ Running the Applications

#### Start Main Health App (Port 3000)
```bash
cd client
npm start
```
Access at: **http://localhost:3000**

#### Start Health Dashboard (Port 3001)
```bash
# In a new terminal window
cd user
PORT=3001 npm start
```
Access at: **http://localhost:3001**

### 🎯 What Each Application Does

#### **Main Health App** (localhost:3000)
- 🍎 **Nutrition Analysis**: Search and analyze food items
- 🔍 **Health Search**: AI-powered health information lookup
- 📸 **Image Analysis**: Upload food images for nutritional breakdown
- 📰 **Health News**: Browse and analyze health articles with "Analyze with WiHy"
- 🎤 **Voice Search**: Voice-enabled search functionality

#### **Health Dashboard** (localhost:3001)
- 📊 **Health Metrics**: Personal health data visualization
- 📈 **Charts & Graphs**: Interactive health trend analysis
- 🎯 **Goal Tracking**: Health and fitness goal management
- 📅 **Timeline Views**: Historical health data tracking

## 🛠️ Development

### Project Structure
```
wihy_ui/
├── client/                 # Main health application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── styles/         # Modular CSS architecture
│   │   │   ├── base.css    # CSS variables & foundations
│   │   │   ├── buttons.css # Button component styles
│   │   │   ├── cards.css   # Card & layout styles
│   │   │   └── VHealthSearch.css # Main CSS import hub
│   │   └── types/          # TypeScript types
│   └── package.json
├── user/                   # Health dashboard
│   ├── src/
│   │   ├── components/     # Dashboard components
│   │   ├── services/       # Data services
│   │   ├── styles/         # Shared styling system
│   │   └── types/          # TypeScript types
│   └── package.json
└── package.json           # Root package file
```

### 🎨 CSS Architecture

This project uses a **modular CSS architecture** for consistent styling across both applications:

#### Core CSS Files:
- **`base.css`**: CSS custom properties (variables) and foundational styles
- **`buttons.css`**: All button component styles (.btn, .btn-tab, .badge-dot, etc.)
- **`cards.css`**: Card layouts, sections, and dashboard components
- **`modals.css`**: Modal dialog styling
- **`utilities.css`**: Utility classes and helper styles
- **`VHealthSearch.css`**: Main CSS import hub that imports all modular styles

#### Design System:
- **Color Variables**: `--ink-*`, `--slate-*`, `--blue-*`, `--green-*`, etc.
- **Layout Tokens**: `--radius-*`, `--shadow-*` for consistent spacing and effects
- **Component Classes**: Reusable components like `.card`, `.btn`, `.progress`, etc.

Both applications (client & user) share the same styling system for consistency.

### 🔧 Troubleshooting

#### Common Issues:

**TypeScript Version Conflicts:**
```bash
# Use legacy peer deps flag for installation
npm install --legacy-peer-deps
```

**Port Already in Use:**
```bash
# For custom ports
PORT=3002 npm start  # Use different port
```

**Dependencies Issues:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 🎨 Key Features

#### Recent Updates (October 2025):
- ✅ **Modular CSS Architecture**: Implemented unified styling system with modular CSS files (base.css, buttons.css, cards.css, etc.)
- ✅ **Dashboard Styling Consolidation**: Both client and user apps now share the same CSS architecture for consistent UI
- ✅ **Brand Asset Updates**: Updated to WIHY branding with new logo assets, removed old placeholder images
- ✅ **Design System**: Added comprehensive CSS variables for colors, spacing, and layout tokens
- ✅ **Component Library**: Standardized button, card, and modal components across applications
- ✅ **Fixed Header Layout**: Implemented responsive fixed header with proper modal positioning
- ✅ **"Analyze with WiHy" Bug Fix**: Resolved issue where news article analysis wasn't working properly

#### Main Features:
- 🎯 **Smart Search**: AI-powered health and nutrition search
- 📰 **News Analysis**: Click "Analyze with WiHy" on any health article for AI insights
- 📊 **Data Visualization**: Interactive charts and health metrics
- 🔄 **Real-time Updates**: Live data synchronization
- 📱 **Responsive Design**: Works on all device sizes

### 📦 Building for Production

#### Main App:
```bash
cd client
npm run build
```

#### Dashboard:
```bash
cd user  
npm run build
```

### 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes:**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### 📧 Support

For questions or issues:
- 🐛 **Report bugs**: Open an issue on GitHub
- 💡 **Feature requests**: Submit an enhancement request
- 📖 **Documentation**: Check the code comments and component docs

### 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for better health management**