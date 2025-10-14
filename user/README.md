# WiHy Health Dashboard

## Overview
The WiHy Health Dashboard is a comprehensive React TypeScript application that provides users with intelligent health insights and analytics. It features an AI-powered chat assistant, dynamic data visualizations, and personalized health tracking across multiple wellness domains.

## Features

### **Dashboard Views**
- **Overview Mode**: Compact widget layout with essential health metrics
- **Detailed Analytics**: Full-featured sections with comprehensive data analysis
- **Responsive Design**: Adapts to different screen sizes and chat widget states

### **Health Tracking Modules**
- **Weight & Body Metrics**: BMI tracking, body composition analysis
- **Activity & Movement**: Steps, distance, active minutes with progress visualization
- **Nutrition Analysis**: Macro breakdown, micronutrients, energy balance
- **Sleep & Recovery**: Duration, quality distribution, sleep vs activity correlation
- **Hydration Monitoring**: Daily intake tracking with goal visualization
- **Behavior & Dopamine**: Presence matrix with pie chart analytics, habit tracking
- **Health Outcomes**: Risk assessment and vital signs monitoring

### **AI-Powered Features**
- **WiHy Chat Assistant**: Context-aware health analysis and recommendations
- **Smart Insights**: Personalized health score and trend analysis
- **Dynamic Recommendations**: AI-driven suggestions based on user data

### **Data Visualization**
- **Interactive Charts**: Line charts, pie charts, progress bars, and custom visualizations
- **Real-time Updates**: Dynamic data refresh and responsive chart animations
- **Health Snapshot**: Quick overview cards with key metrics and progress indicators

## Technical Stack

### Frontend
- **React 18** with TypeScript
- **Custom CSS** with responsive design patterns
- **Chart.js/React-Chartjs-2** for data visualization
- **Custom component library** with modular architecture

### Architecture
- **Component-based design** with centralized exports
- **Modal system** for account management and notifications
- **Provider pattern** for state management
- **Responsive grid layouts** with chat widget integration

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm (version 8 or higher)
- Git for version control

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kortney-lee/wihy_ui.git
   cd wihy_ui/user
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3001`.

### Building for Production
```bash
npm run build
```
Build artifacts will be stored in the `build/` directory.

## Project Structure

```
user/src/
├── components/           # React components
│   ├── Charts/          # Data visualization components
│   ├── modals/          # Modal dialogs
│   └── components/      # Shared UI components
├── hooks/               # Custom React hooks
├── providers/           # Context providers
├── services/            # API and data services
├── styles/              # CSS stylesheets
└── types/               # TypeScript type definitions
```

## Key Components

### Dashboard Sections
- `HealthSnapshot`: Overview metrics display
- `WeightMetrics`: Body composition tracking
- `NutritionSection`: Diet and macro analysis
- `BehaviorDopamineSection`: Behavioral insights with pie chart matrix
- `ChatWidget`: AI assistant interface

### Chart Components
- `WeightTrendChart`: Historical weight tracking
- `NutritionMacroChart`: Macronutrient breakdown
- `SleepChart`: Sleep pattern analysis
- `ActivityChart`: Movement and exercise metrics

## Development Workflow

### Adding New Components
1. Create component in appropriate directory
2. Add to `components/index.ts` for centralized exports
3. Import using destructured syntax in Dashboard.tsx

### Styling Guidelines
- Use CSS custom properties for theming
- Follow responsive-first design principles
- Maintain consistent spacing and typography scales

## Contributing
Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature description'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Contact
For questions or support, please contact the development team or open an issue on GitHub.