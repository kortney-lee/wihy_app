# Product Highlighting Feature - Implementation Guide

## Overview
This feature displays detected products with bounding boxes and corner highlights, similar to Appediet's scanning experience.

## How It Works

### 1. **Backend Implementation Required**

Your backend needs to return object detection data from Google Vision API:

```typescript
// Add to your /api/scan/photo or /api/scan/barcode endpoint
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

// In your scan handler:
const [result] = await client.objectLocalization(imageBuffer);
const objects = result.localizedObjectAnnotations;

// Transform to our format
const detectedObjects = objects?.map(obj => ({
  name: obj.name,
  confidence: obj.score,
  boundingBox: {
    x: obj.boundingPoly.normalizedVertices[0].x * imageWidth,
    y: obj.boundingPoly.normalizedVertices[0].y * imageHeight,
    width: (obj.boundingPoly.normalizedVertices[2].x - obj.boundingPoly.normalizedVertices[0].x) * imageWidth,
    height: (obj.boundingPoly.normalizedVertices[2].y - obj.boundingPoly.normalizedVertices[0].y) * imageHeight,
  }
})) || [];

// Return in response
return {
  success: true,
  product_name: "Red Bull Energy Drink",
  detectedObjects, // <-- Add this
  // ... rest of response
};
```

### 2. **Frontend Usage**

#### **Option A: During Analysis (Like Appediet)**

Update `CameraScreen.tsx` to show highlighted image during processing:

```tsx
import ProductHighlight from '../components/ProductHighlight';

// In your camera capture flow:
const handleCapture = async () => {
  const photo = await cameraRef.current.takePictureAsync();
  
  // Show processing modal with highlighted image
  setProcessingImage(photo.uri);
  setShowProcessingModal(true);
  
  // Start scan
  const result = await scanService.scanImage(photo.uri);
  
  if (result.detectedObjects) {
    setDetectedObjects(result.detectedObjects);
  }
  
  // After analysis completes, navigate to results
  navigation.navigate('NutritionFacts', { foodItem: result });
};

// In your render:
<Modal visible={showProcessingModal}>
  <ProductHighlight
    imageUri={processingImage}
    detectedObjects={detectedObjects}
    highlightColor="#00ff00"
  />
  <Text>Analyzing... {progress}%</Text>
</Modal>
```

#### **Option B: In NutritionFacts Screen**

Show highlighted product image at the top of results:

```tsx
// In NutritionFacts.tsx:
import ProductHighlight from '../components/ProductHighlight';

// In render:
{isBarcodeScanResponse(foodItem) && foodItem.detectedObjects && (
  <ProductHighlight
    imageUri={foodItem.image_url || capturedImage}
    detectedObjects={foodItem.detectedObjects}
    imageWidth={screenWidth}
    imageHeight={screenWidth * 1.2}
    highlightColor="#3b82f6"
  />
)}
```

## Component API

### `ProductHighlight`

**Props:**
- `imageUri` (string, required): URI of captured image
- `detectedObjects` (DetectedObject[], optional): Array of detected objects with bounding boxes
- `imageWidth` (number, optional): Display width (default: screen width)
- `imageHeight` (number, optional): Display height (default: screen width * 1.5)
- `highlightColor` (string, optional): Color of bounding boxes (default: '#00ff00')
- `showCorners` (boolean, optional): Show corner accents (default: true)

**Example:**
```tsx
<ProductHighlight
  imageUri="file:///path/to/image.jpg"
  detectedObjects={[
    {
      name: "Beverage can",
      confidence: 0.94,
      boundingBox: { x: 120, y: 80, width: 400, height: 840 }
    }
  ]}
  highlightColor="#00ff00"
  showCorners={true}
/>
```

## Google Vision API Setup

### 1. **Enable Object Localization**

In your Google Cloud Console:
1. Enable Vision API
2. Object Localization is included in Vision API

### 2. **API Call Example**

```bash
curl -X POST \
  https://vision.googleapis.com/v1/images:annotate \
  -H 'Content-Type: application/json' \
  -d '{
    "requests": [
      {
        "image": {
          "content": "BASE64_IMAGE_DATA"
        },
        "features": [
          {
            "type": "OBJECT_LOCALIZATION",
            "maxResults": 10
          }
        ]
      }
    ]
  }'
```

### 3. **Response Format**

```json
{
  "localizedObjectAnnotations": [
    {
      "name": "Bottle",
      "score": 0.942,
      "boundingPoly": {
        "normalizedVertices": [
          { "x": 0.18, "y": 0.12 },
          { "x": 0.82, "y": 0.12 },
          { "x": 0.82, "y": 0.88 },
          { "x": 0.18, "y": 0.88 }
        ]
      }
    }
  ]
}
```

## Styling Variations

### Glowing Effect
```tsx
<ProductHighlight
  highlightColor="#00ff00"
  // Add animated glow in the component
/>
```

### Pulsing Animation
```tsx
// Animate the highlight color
const pulseAnim = useRef(new Animated.Value(0)).current;

Animated.loop(
  Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1, duration: 1000 }),
    Animated.timing(pulseAnim, { toValue: 0, duration: 1000 }),
  ])
).start();

const animatedColor = pulseAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['#00ff00', '#00ff0080']
});
```

## Alternative: On-Device Detection

If you want to avoid backend processing:

```typescript
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// Use expo-image-manipulator for simple detection
// or react-native-vision-camera with ML Kit for advanced detection
```

## Performance Tips

1. **Compress images** before sending to API
2. **Cache detection results** to avoid re-processing
3. **Use progressive loading** - show image first, add highlights when ready
4. **Limit detection** to primary object only (maxResults: 1)

## Testing

Mock data for testing without backend:

```typescript
const mockDetection: DetectedObject[] = [
  {
    name: "Energy Drink Can",
    confidence: 0.94,
    boundingBox: {
      x: 100,
      y: 150,
      width: 350,
      height: 700
    }
  }
];

<ProductHighlight
  imageUri={testImage}
  detectedObjects={mockDetection}
/>
```
