# Example Integration: Product Highlighting in Camera Screen

## Add to CameraScreen.tsx

### 1. Import Components
```tsx
import ScanningModal from '../components/ScanningModal';
import type { DetectedObject } from '../services/types';
```

### 2. Add State Variables
```tsx
// Add to existing state
const [scanningImage, setScanningImage] = useState<string | null>(null);
const [scanProgress, setScanProgress] = useState(0);
const [scanMessage, setScanMessage] = useState('Analyzing...');
const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
const [showScanningModal, setShowScanningModal] = useState(false);
```

### 3. Update Photo Capture Handler

```tsx
const handlePhotoCapture = async () => {
  if (!cameraRef.current) return;

  try {
    setIsProcessing(true);
    
    // 1. Take picture
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    
    // 2. Show scanning modal with image
    setScanningImage(photo.uri);
    setScanProgress(0);
    setScanMessage('Preparing image...');
    setShowScanningModal(true);

    // 3. Simulate progress (or use real API progress)
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // 4. Compress image
    setScanMessage('Compressing image...');
    const compressed = await compressImageForUpload(photo.uri);
    setScanProgress(30);

    // 5. Call API
    setScanMessage('Analyzing product...');
    const result = await scanService.scanImage(compressed.uri);
    setScanProgress(70);

    // 6. If backend returns detection data, show highlights
    if (result.detectedObjects) {
      setDetectedObjects(result.detectedObjects);
      setScanMessage('Product detected!');
      setScanProgress(100);
      
      // Wait a moment to show the highlighted result
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      setScanProgress(100);
    }

    // 7. Close modal and navigate to results
    setShowScanningModal(false);
    clearInterval(progressInterval);
    
    navigation.navigate('NutritionFacts', {
      foodItem: result,
      context: {
        sessionId: `photo_${Date.now()}`,
        scanType: 'image',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Photo capture error:', error);
    setShowScanningModal(false);
    Alert.alert('Error', 'Failed to analyze photo. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

### 4. Add Modal to Render

```tsx
return (
  <SafeAreaView style={styles.container}>
    {/* ... existing camera view ... */}

    {/* Scanning Modal with Product Highlighting */}
    <ScanningModal
      visible={showScanningModal}
      imageUri={scanningImage}
      progress={scanProgress}
      message={scanMessage}
      detectedObjects={detectedObjects}
      highlightColor={selectedMode === 'food' ? '#10b981' : '#3b82f6'}
    />
  </SafeAreaView>
);
```

## Mock Data for Testing (No Backend Changes Needed)

If you want to test the UI before backend is ready:

```tsx
// After taking photo, simulate detection
const mockDetection: DetectedObject[] = [
  {
    name: "Beverage can",
    confidence: 0.94,
    boundingBox: {
      x: photo.width * 0.2,
      y: photo.height * 0.15,
      width: photo.width * 0.6,
      height: photo.height * 0.7,
    }
  }
];

setTimeout(() => {
  setDetectedObjects(mockDetection);
  setScanProgress(100);
}, 2000);
```

## Color Schemes by Scan Type

```tsx
const getHighlightColor = () => {
  switch (selectedMode) {
    case 'barcode': return '#3b82f6'; // Blue
    case 'food': return '#10b981';    // Green
    case 'pill': return '#f59e0b';    // Orange
    case 'label': return '#ef4444';   // Red
    default: return '#00ff00';
  }
};
```

## Result

When user takes a photo:
1. ✅ Image displays immediately
2. ✅ Progress shows 0% → 100%
3. ✅ Green bounding box appears when product detected
4. ✅ Corner highlights pulse gently
5. ✅ After 1 second, navigates to nutrition facts

This creates the same polished experience as Appediet!
