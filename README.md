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

3. **Configure WiHy API (Optional):**
   ```bash
   # Production API endpoint (ONLY ENDPOINT WE USE):
   export REACT_APP_WIHY_API_URL=https://ml.wihy.ai
   # No backup endpoints needed - ml.wihy.ai is the single production endpoint
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

### 🐳 Docker Deployment

#### Build and Run Locally
```bash
# Build the Docker image
docker build -t wihy-ui .

# Run the container
docker run -d -p 3030:80 --name wihy-ui-app wihy-ui

# Access at http://localhost:3030
```

#### Docker Image Features
- ✅ **Multi-stage build** for optimized image size
- ✅ **Production environment variables** baked into build
- ✅ **Tailwind CSS** and PostCSS configuration included
- ✅ **Nginx** web server with SPA routing support
- ✅ **Health check** endpoint at `/health`
- ✅ **Gzip compression** enabled for assets
- ✅ **Security headers** configured

#### Docker Management
```bash
# Stop container
docker stop wihy-ui-app

# Remove container
docker rm wihy-ui-app

# View logs
docker logs wihy-ui-app

# Check health
curl http://localhost:3030/health
```

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

### 🔌 API Architecture

#### **WiHy Enhanced Model API Integration**
The main health application integrates with the enhanced WiHy ML API trained on 2,325 health examples:

**Primary Endpoint**: `POST https://ml.wihy.ai/ask`

**All Environments**: Production uses only `https://ml.wihy.ai` - no backup endpoints needed.

**Key Features**:
- **Personalized Health Analysis**: User context-aware responses with risk factors and action items
- **Biblical Wisdom Integration**: Health advice grounded in biblical principles  
- **Research Foundation**: Evidence-based citations and study references
- **Progress Tracking**: Metrics and reassessment timelines
- **Comprehensive TypeScript Support**: Full type definitions in `wihyAPI.ts`

**Service Architecture**:
```typescript
// client/src/services/wihyAPI.ts
- UserContext interface for personalized queries
- WihyRequest/WihyResponse with complete type safety
- Structured response formatting for existing UI components
- Error handling and timeout management (30s)
- Response transformation for SearchResults display
```

**Response Structure**:
- **Risk Factors**: Identified health risks with prevalence and preventability scores  
- **Action Items**: Priority-based health recommendations with evidence levels
- **Biblical Wisdom**: Scripture-based health principles
- **Research Citations**: Scientific backing for recommendations
- **Progress Metrics**: Trackable health indicators

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

### 🛠️ Fixed Issues & Solutions

#### Authentication Modal & Header Layout Fixes (October 2025)

This section documents critical fixes for authentication modal positioning and header layout issues. **Reference these solutions if similar problems arise.**

##### ❌ **Problem**: Authentication Modal Not Displaying Properly
- Modal was showing only Google login instead of all 4 providers
- Login button appeared too small compared to notification bell
- Modal overlay was covering the entire header
- Notification badge was positioned over the bell icon

##### ✅ **Root Causes & Solutions**:

**1. CSS Positioning Conflicts**
```css
/* ISSUE: Global styles overriding component styles */
/* globals.css was setting header-icon-btn to 44px, Header.css to 36px */

/* SOLUTION: Increased CSS specificity in Header.css */
.vhealth-topbar-right .header-icon-btn {
  width: 36px !important;
  height: 36px !important;
  /* Higher specificity overrides global styles */
}
```

**2. Z-Index Layering Problems**
```css
/* ISSUE: Modal z-index (999, 1600) lower than header z-index (2000-2001) */

/* SOLUTION: Updated z-index hierarchy */
.auth-overlay { z-index: 2050; }           /* Above header */
.providers-popup { z-index: 2100; }       /* Above overlay */
.user-dropdown { z-index: 2100; }         /* Above overlay */
```

**3. Badge Positioning Conflicts**
```css
/* ISSUE: Badge positioned inside button (top: 6px) instead of outside */

/* SOLUTION: Negative positioning with high specificity */
.vhealth-topbar-right .header-icon-btn .badge-dot {
  top: -6px !important;    /* Outside button area */
  right: -6px !important;  /* Upper-right corner */
  z-index: 10 !important;  /* Above other elements */
}
```

**4. Inline Layout Implementation**
```tsx
// ISSUE: Login component using fixed positioning broke flex layout

// SOLUTION: Added position prop with inline variant
<MultiAuthLogin position="inline" />

// CSS variants for different contexts
.multi-auth-container.inline {
  position: static;          /* Participates in flex flow */
  display: inline-flex;      /* Inline with notification bell */
}

.multi-auth-container.top-right {
  position: fixed;           /* Modal overlay context */
}
```

##### 📋 **Files Modified**:
- `user/src/components/components/shared/components/MultiAuthLogin.tsx`
- `user/src/components/components/shared/components/MultiAuthLogin.css`
- `user/src/components/components/shared/components/Header.tsx`
- `user/src/components/components/shared/components/Header.css`

##### 🔍 **Key Lessons Learned**:

1. **CSS Specificity**: Use parent selectors (`.vhealth-topbar-right .header-icon-btn`) instead of `!important` when possible
2. **Z-Index Management**: Maintain clear z-index hierarchy (Header: 2000 → Overlay: 2050 → Modal: 2100)
3. **Component Variants**: Use position props for different rendering contexts (inline vs modal)
4. **Global Style Conflicts**: Check `globals.css` for conflicting rules when component styles don't apply
5. **Fixed Positioning**: Be careful with `position: fixed` - it removes elements from normal document flow

##### 🧪 **Testing Checklist**:
- [ ] Notification bell and login button are same size (36px x 36px)
- [ ] Badge appears in upper-right corner of notification button
- [ ] Login modal shows all 4 providers (Google, Microsoft, Apple, Facebook)
- [ ] Modal overlay appears above header but doesn't cover it inappropriately
- [ ] Both buttons display inline in header with proper spacing

### 🎨 Key Features

#### Recent Updates (October 2025):
- ✅ **WiHy API Integration**: Complete replacement of OpenAI endpoint with native WiHy API (`http://localhost:8000/wihy/ask-anything`)
- ✅ **Enhanced Health Analysis**: Integrated comprehensive WiHy response format with risk factors, action items, and biblical wisdom
- ✅ **TypeScript API Service**: Added robust `wihyAPI.ts` service with full type definitions and error handling
- ✅ **Modular CSS Architecture**: Implemented unified styling system with modular CSS files (base.css, buttons.css, cards.css, etc.)
- ✅ **Dashboard Styling Consolidation**: Both client and user apps now share the same CSS architecture for consistent UI
- ✅ **Brand Asset Updates**: Updated to WIHY branding with new logo assets, removed old placeholder images
- ✅ **Design System**: Added comprehensive CSS variables for colors, spacing, and layout tokens
- ✅ **Component Library**: Standardized button, card, and modal components across applications
- ✅ **Fixed Header Layout**: Implemented responsive fixed header with proper modal positioning
- ✅ **"Analyze with WiHy" Bug Fix**: Resolved issue where news article analysis wasn't working properly

#### Main Features:
- 🎯 **WiHy-Powered Search**: Native WiHy API integration for personalized health analysis
- 📰 **News Analysis**: Click "Analyze with WiHy" on any health article for AI insights
- 🔬 **Risk Assessment**: Detailed health risk factors with prevention strategies
- ✝️ **Biblical Health Wisdom**: Scripture-based health guidance and principles
- 📊 **Data Visualization**: Interactive charts and health metrics  
- 🔄 **Real-time Updates**: Live data synchronization
- 📱 **Responsive Design**: Works on all device sizes
- 📈 **Progress Tracking**: Measurable health goals with reassessment timelines

## 🌐 Production Deployment

### Live Application URLs
- **Primary Domain**: https://wihy.ai
- **Azure URL**: https://wihy-ui-prod.westus2.cloudapp.azure.com
- **Health Check**: https://wihy.ai/health

### Production Infrastructure
- **Server**: Azure VM (4.246.82.249)
- **Container**: Docker with Nginx reverse proxy
- **Ports**: External 80/443 → Internal 3000
- **SSL**: Let's Encrypt (auto-renewal)
- **API**: Enhanced WiHy ML API (ml.wihy.ai) - 2,325 training examples
- **Deployment**: Automated via GitHub Actions

### Deployment Process
1. **Push to main** triggers automatic deployment
2. **Docker build** creates optimized production image
3. **Health checks** verify container functionality
4. **Zero-downtime deployment** to production VM
5. **SSL verification** ensures HTTPS functionality

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md) and [DEPLOYMENT-QUICK-REFERENCE.md](DEPLOYMENT-QUICK-REFERENCE.md).

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