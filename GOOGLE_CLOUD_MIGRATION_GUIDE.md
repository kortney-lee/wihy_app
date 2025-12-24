# Google Cloud Migration Guide for WIHY Health Application

## Overview

This document outlines the complete migration strategy for moving the WIHY health and nutrition application from its current infrastructure to Google Cloud Platform (GCP). The migration covers frontend, backend services, databases, AI/ML components, and operational infrastructure.

## Current Architecture Analysis

### Application Components Identified
- **Frontend**: React/TypeScript web application with dashboard components
- **Backend APIs**: Nutrition analysis, research services, chat functionality  
- **AI/ML Services**: Food image recognition, nutrition analysis, chat AI
- **Database**: User profiles, nutrition data, meal plans, health metrics
- **File Storage**: Food images, user uploads, reports
- **Authentication**: User management and security

## Google Cloud Migration Architecture

### 1. Frontend Hosting & Distribution

#### **Firebase Hosting** (Recommended for Web Apps)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase in your project
firebase init hosting

# Deploy configuration
firebase deploy --only hosting
```

**Configuration**: `firebase.json`
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

**Alternative**: **Cloud Storage + Cloud CDN**
```bash
# Create storage bucket for static assets
gsutil mb gs://wihy-frontend-assets

# Enable CDN
gcloud compute backend-buckets create wihy-frontend-bucket \
    --gcs-bucket-name=wihy-frontend-assets
```

### 2. Backend Services Migration

#### **Cloud Run** (Recommended for Containerized Services)

**Nutrition Analysis Service**
```dockerfile
# Dockerfile for nutrition service
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 8080

CMD ["npm", "start"]
```

**Deployment Commands**
```bash
# Build and deploy nutrition service
gcloud run deploy nutrition-service \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2

# Research API service
gcloud run deploy research-service \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

#### **Cloud Functions** (For Lightweight APIs)
```javascript
// functions/nutrition-analysis.js
const functions = require('@google-cloud/functions-framework');
const {Storage} = require('@google-cloud/storage');

functions.http('analyzeNutrition', async (req, res) => {
  // Handle nutrition analysis logic
  res.json({ success: true, data: analysisResult });
});
```

### 3. Database Migration

#### **Cloud Firestore** (Recommended for User Data)
```javascript
// firestore-migration.js
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// User profiles structure
const userProfile = {
  userId: 'user123',
  healthGoals: ['weight-loss', 'muscle-building'],
  dietaryRestrictions: ['gluten-free'],
  nutritionPreferences: {
    calories: 2000,
    protein: 150,
    carbs: 200
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

await db.collection('users').doc('user123').set(userProfile);
```

#### **Cloud SQL** (For Structured Nutrition Data)
```sql
-- Create nutrition database
CREATE DATABASE wihy_nutrition;

-- Nutrition facts table
CREATE TABLE nutrition_facts (
  id SERIAL PRIMARY KEY,
  food_name VARCHAR(255) NOT NULL,
  serving_size VARCHAR(100),
  calories INTEGER,
  protein DECIMAL(5,2),
  carbohydrates DECIMAL(5,2),
  fat DECIMAL(5,2),
  vitamins JSONB,
  minerals JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User meals tracking
CREATE TABLE user_meals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  food_id INTEGER REFERENCES nutrition_facts(id),
  meal_type VARCHAR(50),
  consumed_at TIMESTAMP,
  serving_multiplier DECIMAL(3,2) DEFAULT 1.0
);
```

**Connection Configuration**
```javascript
// config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '/cloudsql/PROJECT_ID:REGION:INSTANCE_ID',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 5432
});
```

### 4. AI/ML Services Integration

#### **Vertex AI** (For Nutrition Analysis & Chat)
```javascript
// ai-services/nutrition-ai.js
const {PredictionServiceClient} = require('@google-cloud/aiplatform');

class NutritionAI {
  constructor() {
    this.client = new PredictionServiceClient();
    this.endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${ENDPOINT_ID}`;
  }

  async analyzeFood(imageBase64) {
    const instance = {
      content: imageBase64
    };

    const request = {
      endpoint: this.endpoint,
      instances: [instance]
    };

    const [response] = await this.client.predict(request);
    return response.predictions[0];
  }

  async getChatResponse(message, context) {
    // Use Vertex AI PaLM API for contextual nutrition chat
    const prompt = `
      Context: User is asking about nutrition for ${context.foodName}
      Nutrition Data: ${JSON.stringify(context.nutritionData)}
      User Question: ${message}
      
      Provide helpful, accurate nutrition advice:
    `;

    const prediction = await this.predictText(prompt);
    return prediction;
  }
}
```

#### **Cloud Vision API** (For Food Image Recognition)
```javascript
// services/image-recognition.js
const vision = require('@google-cloud/vision');

class FoodImageAnalysis {
  constructor() {
    this.client = new vision.ImageAnnotatorClient();
  }

  async analyzeFoodImage(imageBuffer) {
    const [result] = await this.client.labelDetection({
      image: { content: imageBuffer }
    });

    const foodLabels = result.labelAnnotations
      .filter(label => this.isFoodRelated(label.description))
      .map(label => ({
        food: label.description,
        confidence: label.score
      }));

    return foodLabels;
  }

  isFoodRelated(label) {
    const foodKeywords = ['food', 'fruit', 'vegetable', 'meat', 'dairy', 'grain'];
    return foodKeywords.some(keyword => 
      label.toLowerCase().includes(keyword)
    );
  }
}
```

### 5. File Storage Migration

#### **Cloud Storage** (For Images & Documents)
```javascript
// services/storage.js
const {Storage} = require('@google-cloud/storage');

class FileStorageService {
  constructor() {
    this.storage = new Storage();
    this.bucket = this.storage.bucket('wihy-user-uploads');
  }

  async uploadFoodImage(file, userId) {
    const fileName = `food-images/${userId}/${Date.now()}-${file.originalname}`;
    const blob = this.bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          userId: userId,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', reject);
      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${blob.name}`;
        resolve({ fileName, publicUrl });
      });
      blobStream.end(file.buffer);
    });
  }

  async generateSignedUrl(fileName, action = 'read') {
    const options = {
      version: 'v4',
      action: action,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    const [url] = await this.bucket.file(fileName).getSignedUrl(options);
    return url;
  }
}
```

### 6. Authentication & Security

#### **Firebase Authentication**
```javascript
// auth/firebase-auth.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Authentication service
class AuthService {
  async signIn(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  async signUp(email, password) {
    return await createUserWithEmailAndPassword(auth, email, password);
  }

  async signInWithGoogle() {
    return await signInWithPopup(auth, googleProvider);
  }

  async signOut() {
    return await auth.signOut();
  }
}
```

#### **Cloud Identity & Access Management**
```yaml
# iam-policy.yaml
bindings:
- members:
  - serviceAccount:nutrition-service@PROJECT_ID.iam.gserviceaccount.com
  role: roles/cloudsql.client
- members:
  - serviceAccount:nutrition-service@PROJECT_ID.iam.gserviceaccount.com
  role: roles/storage.objectViewer
- members:
  - serviceAccount:ai-service@PROJECT_ID.iam.gserviceaccount.com
  role: roles/aiplatform.user
```

### 7. Monitoring & Logging

#### **Cloud Monitoring Setup**
```javascript
// monitoring/health-check.js
const monitoring = require('@google-cloud/monitoring');

class HealthMonitoring {
  constructor() {
    this.client = new monitoring.MetricServiceClient();
  }

  async createCustomMetric(metricName, description) {
    const request = {
      name: this.client.projectPath(PROJECT_ID),
      metricDescriptor: {
        type: `custom.googleapis.com/${metricName}`,
        metricKind: 'GAUGE',
        valueType: 'DOUBLE',
        description: description
      }
    };

    await this.client.createMetricDescriptor(request);
  }

  async recordNutritionAnalysisTime(duration) {
    const timeSeriesData = {
      metric: {
        type: 'custom.googleapis.com/nutrition_analysis_duration'
      },
      resource: {
        type: 'global'
      },
      points: [{
        interval: {
          endTime: {
            seconds: Date.now() / 1000
          }
        },
        value: {
          doubleValue: duration
        }
      }]
    };

    await this.client.createTimeSeries({
      name: this.client.projectPath(PROJECT_ID),
      timeSeries: [timeSeriesData]
    });
  }
}
```

#### **Error Reporting & Logging**
```javascript
// logging/error-handler.js
const { Logging } = require('@google-cloud/logging');
const { ErrorReporting } = require('@google-cloud/error-reporting');

const logging = new Logging();
const errors = new ErrorReporting();

class Logger {
  constructor(serviceName) {
    this.log = logging.log(serviceName);
    this.serviceName = serviceName;
  }

  info(message, metadata = {}) {
    const entry = this.log.entry({
      severity: 'INFO',
      resource: { type: 'global' }
    }, {
      message,
      service: this.serviceName,
      ...metadata
    });

    this.log.write(entry);
  }

  error(error, metadata = {}) {
    errors.report(error);
    
    const entry = this.log.entry({
      severity: 'ERROR',
      resource: { type: 'global' }
    }, {
      message: error.message,
      stack: error.stack,
      service: this.serviceName,
      ...metadata
    });

    this.log.write(entry);
  }
}
```

### 8. CI/CD Pipeline

#### **Cloud Build Configuration**
```yaml
# cloudbuild.yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: npm
    args: ['ci']

  # Run tests
  - name: 'node:18'
    entrypoint: npm
    args: ['test']

  # Build application
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'build']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
    - 'run'
    - 'deploy'
    - 'wihy-frontend'
    - '--image'
    - 'gcr.io/$PROJECT_ID/wihy-app:$COMMIT_SHA'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'

  # Deploy to Firebase Hosting
  - name: 'gcr.io/$PROJECT_ID/firebase'
    args: ['deploy', '--only', 'hosting']

# Build Docker image
images:
- 'gcr.io/$PROJECT_ID/wihy-app:$COMMIT_SHA'

# Trigger configuration
substitutions:
  _ENVIRONMENT: 'production'

options:
  logging: CLOUD_LOGGING_ONLY
```

### 9. Environment Configuration

#### **Environment Variables Setup**
```bash
# Set environment variables for Cloud Run
gcloud run services update nutrition-service \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/PROJECT_ID:us-central1:wihy-db,GOOGLE_CLOUD_PROJECT=PROJECT_ID"

# For local development
cp .env.example .env.local
```

`.env.production`
```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=wihy-health-app
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Database
DB_HOST=/cloudsql/wihy-health-app:us-central1:wihy-nutrition-db
DB_NAME=wihy_nutrition
DB_USER=nutrition_user
DB_PASS=${SECRET_DB_PASSWORD}

# Firebase
REACT_APP_FIREBASE_API_KEY=${FIREBASE_API_KEY}
REACT_APP_FIREBASE_AUTH_DOMAIN=wihy-health-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=wihy-health-app

# AI Services
VERTEX_AI_ENDPOINT=projects/wihy-health-app/locations/us-central1/endpoints/nutrition-ai
VISION_API_KEY=${VISION_API_KEY}

# Storage
STORAGE_BUCKET=wihy-user-uploads
CDN_BASE_URL=https://cdn.wihy.ai
```

### 10. Migration Steps & Timeline

#### **Phase 1: Foundation (Week 1)**
1. **Set up GCP Project**
   ```bash
   gcloud projects create wihy-health-app
   gcloud config set project wihy-health-app
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

2. **Create Service Accounts**
   ```bash
   gcloud iam service-accounts create nutrition-service
   gcloud iam service-accounts create ai-service
   gcloud iam service-accounts create storage-service
   ```

#### **Phase 2: Backend Migration (Week 2)**
1. **Database Migration**
   - Set up Cloud SQL instance
   - Migrate existing data
   - Test database connections

2. **API Services Migration**
   - Containerize backend services
   - Deploy to Cloud Run
   - Configure load balancing

#### **Phase 3: Frontend & AI (Week 3)**
1. **Frontend Deployment**
   - Set up Firebase Hosting
   - Configure CDN
   - Update API endpoints

2. **AI Services Integration**
   - Set up Vertex AI endpoints
   - Migrate ML models
   - Test nutrition analysis

#### **Phase 4: Testing & Optimization (Week 4)**
1. **End-to-End Testing**
2. **Performance Optimization**
3. **Security Audit**
4. **Go-Live Preparation**

### 11. Cost Optimization

#### **Resource Sizing Guidelines**
```yaml
# Cloud Run Configuration
resources:
  cpu: "2"
  memory: "2Gi"
  concurrency: 100
  timeout: 300s

scaling:
  minInstances: 0
  maxInstances: 10

# Cloud SQL Configuration
tier: db-f1-micro  # Start small, scale up
storage:
  size: 20GB
  type: SSD
```

#### **Cost Monitoring**
```javascript
// cost-monitoring/budget-alerts.js
const monitoring = require('@google-cloud/monitoring');

async function createBudgetAlert() {
  // Set up budget alerts for cost control
  const budget = {
    amount: {
      specifiedAmount: {
        currencyCode: 'USD',
        units: 500 // $500/month budget
      }
    },
    thresholdRules: [
      {
        thresholdPercent: 0.8, // Alert at 80%
        spendBasis: 'CURRENT_SPEND'
      }
    ]
  };

  // Configure alerting
}
```

### 12. Security & Compliance

#### **Security Configuration**
```javascript
// security/cors-config.js
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://wihy.ai',
    'https://app.wihy.ai',
    'https://wihy-health-app.web.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### **Data Privacy Configuration**
```javascript
// privacy/data-retention.js
class DataRetentionService {
  async cleanupExpiredData() {
    // Remove user data older than retention period
    const retentionPeriod = 365; // days
    
    await db.collection('user_sessions')
      .where('createdAt', '<', new Date(Date.now() - retentionPeriod * 24 * 60 * 60 * 1000))
      .get()
      .then(snapshot => {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        return batch.commit();
      });
  }
}
```

### 13. Migration Checklist

#### **Pre-Migration**
- [ ] GCP project setup and billing
- [ ] Service account creation
- [ ] Database schema export
- [ ] Environment variables documented
- [ ] Dependencies audit completed

#### **Migration Execution**
- [ ] Database migrated and tested
- [ ] Backend services deployed
- [ ] Frontend deployed to Firebase Hosting
- [ ] AI services configured
- [ ] DNS updated
- [ ] SSL certificates configured

#### **Post-Migration Validation**
- [ ] All features functional
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Backup procedures tested
- [ ] Monitoring alerts configured

#### **Go-Live**
- [ ] Production deployment
- [ ] User notification sent
- [ ] Support team briefed
- [ ] Rollback plan ready

This comprehensive guide covers all aspects of migrating your nutrition/health application to Google Cloud Platform, ensuring scalability, security, and optimal performance.