# Backend Implementation - Object Detection API

## Add to your services.wihy.ai backend

### 1. Install Google Vision SDK

```bash
npm install @google-cloud/vision
```

### 2. Add Object Detection Function

Create `src/services/visionService.ts`:

```typescript
import vision from '@google-cloud/vision';
import type { ImageAnnotatorClient } from '@google-cloud/vision';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  category?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

export class VisionService {
  private client: ImageAnnotatorClient;

  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_VISION_KEY_PATH,
    });
  }

  /**
   * Detect objects in image and return bounding boxes
   * for product highlighting in mobile app
   */
  async detectObjects(
    imageBuffer: Buffer,
    dimensions?: ImageDimensions
  ): Promise<DetectedObject[]> {
    try {
      const [result] = await this.client.objectLocalization({
        image: { content: imageBuffer },
      });

      const objects = result.localizedObjectAnnotations || [];
      
      // Get image dimensions if not provided
      let imageWidth = dimensions?.width;
      let imageHeight = dimensions?.height;
      
      if (!imageWidth || !imageHeight) {
        const [imageProps] = await this.client.imageProperties({
          image: { content: imageBuffer },
        });
        imageWidth = imageProps.imagePropertiesAnnotation?.dominantColors?.colors?.[0]?.pixelFraction || 1000;
        imageHeight = imageWidth * 1.5; // Estimate aspect ratio
      }

      // Transform to mobile app format
      const detectedObjects: DetectedObject[] = objects.map(obj => {
        const vertices = obj.boundingPoly?.normalizedVertices || [];
        
        // Calculate bounding box from normalized coordinates (0-1)
        const x1 = vertices[0]?.x || 0;
        const y1 = vertices[0]?.y || 0;
        const x2 = vertices[2]?.x || 1;
        const y2 = vertices[2]?.y || 1;

        return {
          name: obj.name || 'Unknown object',
          confidence: obj.score || 0,
          boundingBox: {
            x: x1 * imageWidth,
            y: y1 * imageHeight,
            width: (x2 - x1) * imageWidth,
            height: (y2 - y1) * imageHeight,
          },
          category: this.categorizeObject(obj.name || ''),
        };
      });

      // Filter to most confident detections
      return detectedObjects
        .filter(obj => obj.confidence > 0.5)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Max 5 objects

    } catch (error) {
      console.error('Object detection error:', error);
      return [];
    }
  }

  /**
   * Categorize detected object
   */
  private categorizeObject(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('bottle') || nameLower.includes('can') || nameLower.includes('beverage')) {
      return 'beverage';
    }
    if (nameLower.includes('food') || nameLower.includes('snack') || nameLower.includes('meal')) {
      return 'food';
    }
    if (nameLower.includes('package') || nameLower.includes('box') || nameLower.includes('container')) {
      return 'packaging';
    }
    if (nameLower.includes('pill') || nameLower.includes('tablet') || nameLower.includes('capsule')) {
      return 'medication';
    }
    
    return 'product';
  }
}

export const visionService = new VisionService();
```

### 3. Update Photo Scan Endpoint

In `src/routes/scan.ts`:

```typescript
import { visionService } from '../services/visionService';

router.post('/api/scan/photo', async (req, res) => {
  try {
    const { image, user_context } = req.body;
    
    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Get image dimensions (optional, for accurate bounding boxes)
    const sharp = require('sharp');
    const metadata = await sharp(imageBuffer).metadata();
    const dimensions = {
      width: metadata.width || 1000,
      height: metadata.height || 1500,
    };

    // Run object detection in parallel with nutrition analysis
    const [detectedObjects, nutritionResult] = await Promise.all([
      visionService.detectObjects(imageBuffer, dimensions),
      analyzeNutrition(imageBuffer), // Your existing nutrition analysis
    ]);

    // Return response with detection data
    res.json({
      success: true,
      scan_id: `photo_${Date.now()}`,
      scan_type: 'food_photo',
      timestamp: new Date().toISOString(),
      processing_time: 1.2,
      
      // Add detected objects for mobile app highlighting
      detectedObjects,
      
      // Your existing analysis data
      analysis: {
        detected_foods: nutritionResult.foods,
        confidence_score: nutritionResult.confidence,
        meal_type: nutritionResult.mealType,
        summary: nutritionResult.summary,
      },
      
      metadata: {
        // ... rest of your metadata
      },
    });

  } catch (error) {
    console.error('Photo scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze photo',
    });
  }
});
```

### 4. Update Barcode Scan (Optional)

If you want highlighting for barcode scans too:

```typescript
router.post('/api/scan/barcode', async (req, res) => {
  const { barcode, image } = req.body;
  
  let detectedObjects = [];
  
  // If user provided a photo of the barcode (from camera)
  if (image) {
    const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    detectedObjects = await visionService.detectObjects(imageBuffer);
  }
  
  // Get product data from barcode
  const productData = await lookupBarcode(barcode);
  
  res.json({
    success: true,
    ...productData,
    detectedObjects, // Add detection data
  });
});
```

### 5. Environment Setup

Add to `.env`:

```bash
GOOGLE_VISION_KEY_PATH=/path/to/google-vision-credentials.json
```

### 6. Test the API

```bash
curl -X POST https://services.wihy.ai/api/scan/photo \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "user_context": {
      "userId": "test_user"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "scan_id": "photo_1736676930456",
  "scan_type": "food_photo",
  "detectedObjects": [
    {
      "name": "Bottle",
      "confidence": 0.94,
      "boundingBox": {
        "x": 180,
        "y": 120,
        "width": 640,
        "height": 1180
      },
      "category": "beverage"
    }
  ],
  "analysis": {
    "detected_foods": ["Energy Drink"],
    "confidence_score": 0.92,
    "meal_type": "beverage",
    "summary": "..."
  }
}
```

## Alternative: Client-Side Detection (No Backend Changes)

If you want to avoid backend work, you can use on-device ML:

```bash
npm install react-native-vision-camera
npm install vision-camera-object-detector
```

```tsx
// In mobile app
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { ObjectDetector } from 'vision-camera-object-detector';

const device = useCameraDevice('back');

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const objects = ObjectDetector.detect(frame);
  runOnJS(setDetectedObjects)(objects);
}, []);
```

## Cost Considerations

**Google Vision API Pricing:**
- Object Localization: $1.50 per 1,000 images
- First 1,000 images/month: FREE

**Optimization:**
- Cache detection results per product
- Only run detection on first scan of each product
- Use lower resolution images (max 800x1200px)

## Testing Without Real API

Use mock data in your scan endpoint:

```typescript
// Return mock detection for testing
if (process.env.NODE_ENV === 'development') {
  detectedObjects = [
    {
      name: "Beverage can",
      confidence: 0.94,
      boundingBox: { x: 200, y: 150, width: 600, height: 1000 },
      category: "beverage"
    }
  ];
}
```

Now your mobile app will receive detection data and show beautiful product highlighting just like Appediet! 🎯
