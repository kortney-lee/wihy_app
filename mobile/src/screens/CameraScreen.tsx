import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
  Animated,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { Camera, CameraView, type BarcodeScanningResult } from 'expo-camera';
import { ensureCameraPermission, ensureMediaLibraryPermission } from '../utils/permissions';
import { compressImageForUpload } from '../utils/imageCompression';
import { scanService } from '../services';
import { AuthContext } from '../context/AuthContext';
import PlansModal from '../components/PlansModal';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type CameraRouteProp = RouteProp<RootStackParamList, 'Camera'>;

interface ScanMode {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CameraRouteProp>();
  const { user } = useContext(AuthContext);
  const autoScanEnabled = user?.preferences?.autoScan ?? false;
  const insets = useSafeAreaInsets();
  const topOffset = Math.max(insets.top, 16);
  // Use route param for initial mode, default to 'barcode'
  const initialMode = route.params?.mode || 'barcode';
  const [selectedMode, setSelectedMode] = useState<string>(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [barcodeProcessing, setBarcodeProcessing] = useState(false);
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<any>(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const scanModes: ScanMode[] = [
    {
      id: 'barcode',
      title: 'Barcode Scan',
      subtitle: autoScanEnabled 
        ? 'Point camera at barcode - scanning automatically' 
        : 'Point camera at barcode then tap scan button',
      icon: 'barcode',
      color: '#3b82f6',
    },
    {
      id: 'food',
      title: 'Food Photo',
      subtitle: 'Tap button to capture and analyze food',
      icon: 'restaurant',
      color: '#10b981',
    },
    {
      id: 'pill',
      title: 'Pill ID',
      subtitle: 'Tap button to identify medication',
      icon: 'medical',
      color: '#f59e0b',
    },
    {
      id: 'label',
      title: 'Label Reader',
      subtitle: 'Tap button to scan product label claims',
      icon: 'document-text',
      color: '#ef4444',
    },
  ];

  useEffect(() => {
    const checkPermissions = async () => {
      const cameraPermission = await ensureCameraPermission();
      setHasPermission(cameraPermission.granted);

      if (!cameraPermission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'WiHY needs camera access to scan barcodes and analyze food. Please grant permission in Settings.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'OK', onPress: () => navigation.goBack() },
          ]
        );
      }
    };

    checkPermissions();
  }, [navigation]);

  // Reset scanning state when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setBarcodeProcessing(false);
      setIsScanning(false);
      setLastScannedBarcode(null);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Run scan animation when actively scanning OR when barcode auto-scan is enabled
    const shouldAnimate = isScanning || (selectedMode === 'barcode' && autoScanEnabled);
    
    if (shouldAnimate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnimation.setValue(0);
    }
  }, [isScanning, selectedMode, autoScanEnabled, scanAnimation]);

  const handleModeSelect = (modeId: string) => {
    // Close any active scan session
    setIsScanning(false);
    setBarcodeProcessing(false);
    setLastScannedBarcode(null);
    
    // Switch to new mode
    setSelectedMode(modeId);
  };

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    // Only auto-scan if the feature is enabled
    if (!autoScanEnabled) {
      // Store the barcode for manual capture
      setLastScannedBarcode(data);
      return;
    }

    // Fast validation - check length only
    if (!data || data.length < 8 || data.length > 14) {
      return;
    }

    // Prevent duplicate scans (no cooldown for faster scanning)
    if (barcodeProcessing || lastScannedBarcode === data) {
      return;
    }

    setLastScannedBarcode(data);
    setBarcodeProcessing(true);
    setIsScanning(true);

    // Reset barcode after 2 seconds to allow re-scanning
    setTimeout(() => {
      setLastScannedBarcode(null);
    }, 2000);

    try {
      // Capture user's photo of the product for display
      let capturedPhotoUri: string | null = null;
      let uploadedImageUrl: string | null = null;
      
      if (cameraRef.current) {
        try {
          console.log('[CameraScreen] Capturing user photo for barcode scan...');
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
          if (photo?.uri) {
            capturedPhotoUri = photo.uri;
            console.log('[CameraScreen] User photo captured:', capturedPhotoUri);
            
            // Upload photo to backend storage (non-blocking)
            scanService.uploadScanImage(photo.uri, {
              barcode: data,
              scanType: 'barcode',
              userId: user?.email,
            }).then(uploadResult => {
              if (uploadResult.success && uploadResult.imageUrl) {
                console.log('[CameraScreen] Photo uploaded to:', uploadResult.imageUrl);
                uploadedImageUrl = uploadResult.imageUrl;
              } else {
                console.log('[CameraScreen] Photo upload skipped:', uploadResult.error);
              }
            }).catch(err => {
              console.warn('[CameraScreen] Photo upload failed:', err);
            });
          }
        } catch (photoErr) {
          console.warn('[CameraScreen] Could not capture photo:', photoErr);
        }
      }

      // Call API to get product info
      console.log('[CameraScreen] Calling API for barcode:', data);
      const result = await scanService.scanBarcode(data);
      console.log('[CameraScreen] API Response:', result);
      
      if (result.success) {
        // Handle both new flat API structure (v3.0) and legacy nested structure
        const isNewFormat = result.product_name !== undefined;
        
        let foodItemData;
        
        if (isNewFormat) {
          // New flat API response structure (v3.0 - January 2026)
          foodItemData = {
            // Product Information
            name: result.product_name || 'Unknown Product',
            brand: result.brand,
            barcode: result.barcode || data,
            categories: result.categories || [],
            
            // Image Display - prioritize user's captured photo
            capturedImage: capturedPhotoUri,
            image_url: result.image_url || result.image_front_url,
            imageUrl: result.image_url || result.image_front_url,
            
            // Nutrition Facts (per 100g)
            calories: result.calories || 0,
            calories_per_serving: result.calories_per_serving,
            servingSize: result.serving_size 
              ? { amount: parseFloat(result.serving_size.match(/\d+\.?\d*/)?.[0] || '100'), unit: 'g' }
              : { amount: 100, unit: 'g' },
            servings_per_container: result.servings_per_container,
            macros: {
              protein: result.protein_g || 0,
              carbs: result.carbs_g || 0,
              fat: result.fat_g || 0,
              fiber: result.fiber_g || 0,
              sugar: result.sugar_g || 0,
              saturated_fat: result.saturated_fat_g || 0,
              sodium: result.sodium_mg || 0,
              cholesterol: result.cholesterol_mg || 0,
              trans_fat: result.trans_fat_g || 0,
              potassium: result.potassium_mg || 0,
            },
            
            // Health Scoring
            health_score: result.health_score || 0,
            nutrition_score: result.nutrition_score || 0,
            grade: result.nutrition_grade || 'N/A',
            confidence: result.confidence_score || 1,
            
            // Processing Level
            nova_group: result.nova_group || 1,
            processing_level: result.processing_level || '',
            total_additives: result.total_additives || 0,
            
            // Health Insights
            health_summary: result.summary || '',
            health_alerts: result.health_alerts || [],
            health_positive: result.positive_aspects || [],
            health_concerns: result.areas_of_concern || [],
            
            // Ingredients & Allergens
            ingredientsText: result.ingredients_text || '',
            ingredients: result.ingredients_text 
              ? result.ingredients_text.split(',').map((i: string) => i.trim()) 
              : [],
            allergens: result.allergens || [],
            additives: result.additives || [],
            total_ingredients: result.total_ingredients || 0,
            
            // Chart Data
            charts: {
              protein: result.chart_protein,
              carbs: result.chart_carbs,
              fat: result.chart_fat,
              health_score: result.chart_health_score,
              nova_group: result.chart_nova_group,
            },
            
            // Boolean flags
            is_healthy: result.is_healthy,
            is_processed: result.is_processed,
            has_health_alerts: result.health_alerts?.length > 0,
            
            // Additional images
            image_nutrition_url: result.image_nutrition_url,
            image_ingredients_url: result.image_ingredients_url,
            
            // Chat Integration
            askWihy: result.ask_wihy || `Tell me about ${result.product_name}`,
            
            // Full API response
            analysis: result,
            analyzed: true,
          };
        }
        
        // Navigate to NutritionFacts with complete scan data
        navigation.navigate('NutritionFacts', {
          foodItem: foodItemData,
          context: {
            sessionId: `barcode_${data}_${Date.now()}`,
            timestamp: result.timestamp || new Date().toISOString(),
            scanType: 'barcode',
            processing_time: result.processing_time_ms || 0,
          },
        });
        // Reset states immediately to allow next scan
        setBarcodeProcessing(false);
        setIsScanning(false);
        // lastScannedBarcode will auto-reset after 2 seconds
      } else {
        console.log('[CameraScreen] Product not found');
        setBarcodeProcessing(false);
        setIsScanning(false);
        Alert.alert(
          'Product Not Found',
          'Could not find this barcode in our database. Try taking a photo of the nutrition label instead.',
          [
            { text: 'OK', onPress: () => {
              setLastScannedBarcode(null);
            }},
            { 
              text: 'Take Photo', 
              onPress: () => {
                setSelectedMode('food');
                setLastScannedBarcode(null);
              }
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('[CameraScreen] Scan error:', error);
      setBarcodeProcessing(false);
      setIsScanning(false);
      setLastScannedBarcode(null);
      
      Alert.alert(
        'Scan Error',
        error.message || 'Failed to process barcode. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStartScan = async () => {
    const mode = scanModes.find(m => m.id === selectedMode);
    if (!mode) return;

    setIsScanning(true);

    try {
      if (selectedMode === 'barcode') {
        // Use the last detected barcode for manual scanning
        if (!lastScannedBarcode) {
          setIsScanning(false);
          Alert.alert('No Barcode Detected', 'Point camera at a barcode first');
          return;
        }

        setBarcodeProcessing(true);
        setIsProcessing(true);
        setProcessingMessage('Scanning barcode...');
        
        // Capture user's photo of the product for display
        let capturedPhotoUri: string | null = null;
        if (cameraRef.current) {
          try {
            console.log('[CameraScreen] Capturing user photo for manual barcode scan...');
            setProcessingMessage('Capturing photo...');
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            if (photo?.uri) {
              capturedPhotoUri = photo.uri;
              console.log('[CameraScreen] User photo captured:', capturedPhotoUri);
              
              // Upload photo to backend storage (non-blocking)
              setProcessingMessage('Uploading photo...');
              scanService.uploadScanImage(photo.uri, {
                barcode: lastScannedBarcode,
                scanType: 'barcode',
                userId: user?.email,
              }).then(uploadResult => {
                if (uploadResult.success && uploadResult.imageUrl) {
                  console.log('[CameraScreen] Photo uploaded to:', uploadResult.imageUrl);
                } else {
                  console.log('[CameraScreen] Photo upload skipped:', uploadResult.error);
                }
              }).catch(err => {
                console.warn('[CameraScreen] Photo upload failed:', err);
              });
            }
          } catch (photoErr) {
            console.warn('[CameraScreen] Could not capture photo:', photoErr);
          }
        }
        
        setProcessingMessage('Looking up product...');
        
        // Call the same handler as auto-scan
        const result = await scanService.scanBarcode(lastScannedBarcode);
        
        if (result.success) {
          // Handle both new flat API structure (v3.0) and legacy nested structure
          const isNewFormat = result.product_name !== undefined;
          
          let foodItemData;
          
          if (isNewFormat) {
            // New flat API response structure (v3.0 - January 2026)
            foodItemData = {
              // Product Information
              name: result.product_name || 'Unknown Product',
              brand: result.brand,
              barcode: result.barcode || lastScannedBarcode,
              categories: result.categories || [],
              
              // Image Display - prioritize user's captured photo
              capturedImage: capturedPhotoUri,
              image_url: result.image_url || result.image_front_url,
              imageUrl: result.image_url || result.image_front_url,
              
              // Nutrition Facts (per 100g)
              calories: result.calories || 0,
              calories_per_serving: result.calories_per_serving,
              servingSize: result.serving_size 
                ? { amount: parseFloat(result.serving_size.match(/\d+\.?\d*/)?.[0] || '100'), unit: 'g' }
                : { amount: 100, unit: 'g' },
              servings_per_container: result.servings_per_container,
              macros: {
                protein: result.protein_g || 0,
                carbs: result.carbs_g || 0,
                fat: result.fat_g || 0,
                fiber: result.fiber_g || 0,
                sugar: result.sugar_g || 0,
                saturated_fat: result.saturated_fat_g || 0,
                sodium: result.sodium_mg || 0,
                cholesterol: result.cholesterol_mg || 0,
                trans_fat: result.trans_fat_g || 0,
                potassium: result.potassium_mg || 0,
              },
              
              // Health Scoring
              health_score: result.health_score || 0,
              nutrition_score: result.nutrition_score || 0,
              grade: result.nutrition_grade || 'N/A',
              confidence: result.confidence_score || 1,
              
              // Processing Level
              nova_group: result.nova_group || 1,
              processing_level: result.processing_level || '',
              total_additives: result.total_additives || 0,
              
              // Health Insights
              health_summary: result.summary || '',
              health_alerts: result.health_alerts || [],
              health_positive: result.positive_aspects || [],
              health_concerns: result.areas_of_concern || [],
              
              // Ingredients & Allergens
              ingredientsText: result.ingredients_text || '',
              ingredients: result.ingredients_text 
                ? result.ingredients_text.split(',').map((i: string) => i.trim()) 
                : [],
              allergens: result.allergens || [],
              additives: result.additives || [],
              total_ingredients: result.total_ingredients || 0,
              
              // Chart Data
              charts: {
                protein: result.chart_protein,
                carbs: result.chart_carbs,
                fat: result.chart_fat,
                health_score: result.chart_health_score,
                nova_group: result.chart_nova_group,
              },
              
              // Chat Integration
              askWihy: result.ask_wihy || `Tell me about ${result.product_name}`,
              
              // Full API response
              analysis: result,
              analyzed: true,
            };
          }
          
          navigation.navigate('NutritionFacts', {
            foodItem: foodItemData,
            context: {
              sessionId: `barcode_${lastScannedBarcode}_${Date.now()}`,
              timestamp: result.timestamp || new Date().toISOString(),
              scanType: 'barcode',
              processing_time: result.processing_time_ms || 0,
            },
          });
          setBarcodeProcessing(false);
          setIsScanning(false);
          setIsProcessing(false);
        } else {
          setBarcodeProcessing(false);
          setIsScanning(false);
          setIsProcessing(false);
          Alert.alert(
            'Product Not Found',
            'Could not find this barcode in our database. Try taking a photo of the nutrition label instead.',
            [
              { text: 'OK', onPress: () => setLastScannedBarcode(null) },
              { 
                text: 'Take Photo', 
                onPress: () => {
                  setSelectedMode('food');
                  setLastScannedBarcode(null);
                }
              },
            ]
          );
        }
      } else if (selectedMode === 'food') {
        // Capture photo and analyze food
        if (!cameraRef.current) {
          setIsScanning(false);
          Alert.alert('Error', 'Camera not ready');
          return;
        }

        setIsProcessing(true);
        setProcessingMessage('Capturing photo...');
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo && photo.uri) {
          console.log('[CameraScreen] Compressing food photo...');
          setProcessingMessage('Compressing image...');
          const imageData = await compressImageForUpload(photo.uri, { maxSizeKB: 500 });
          console.log('[CameraScreen] Photo compressed, sending to API...');
          setProcessingMessage('Analyzing food...');
          const result = await scanService.scanFoodPhoto(imageData, {
            userId: user?.email || 'mobile-user',
          });

          setIsScanning(false);
          setIsProcessing(false);

          if (result.success && result.analysis) {
            const analysis = result.analysis;
            const metadata = result.metadata as any || {};
            const nutritionFacts = metadata.nutrition_facts || {};
            const nutritionAnalysis = metadata.nutrition_analysis || {};
            // NOTE: Jan 13, 2026 breaking change - detected_foods moved to analysis, not metadata
            const detectedFoods = analysis.detected_foods || [];
            const detectedText = (analysis as any).detected_text || [];
            
            navigation.navigate('NutritionFacts', {
              foodItem: {
                // Product Information
                name: detectedFoods[0] || metadata.product_name || 'Food Item',
                brand: metadata.brand,
                categories: ['Food Photo Analysis'],
                
                // Image Display Container - captured photo
                image_url: result.image_url || photo.uri,
                imageUrl: result.image_url || photo.uri,
                capturedImage: photo.uri, // Local photo URI for display
                
                // Food Photo specific data
                foodPhotoData: {
                  // Summary & Detection
                  summary: analysis.summary || '',
                  detectedFoods: detectedFoods,
                  detectedText: detectedText,
                  confidenceScore: (metadata as any).vision_confidence || analysis.confidence_score || 0,
                  
                  // Health & Nutrition
                  healthScore: metadata.health_score || 0,
                  nutritionGrade: (metadata as any).nutrition_grade || {},
                  novaGroup: metadata.nova_group || 1,
                  
                  // Nutrition Analysis
                  nutritionAnalysis: nutritionAnalysis,
                  healthAlerts: nutritionAnalysis.health_alerts || [],
                  positiveAspects: nutritionAnalysis.positive_aspects || [],
                  areasOfConcern: nutritionAnalysis.areas_of_concern || [],
                  servingRecommendations: nutritionAnalysis.serving_recommendations || {},
                  
                  // Charts
                  charts: {},
                  
                  // Full metadata
                  metadata: metadata,
                },
                
                // Nutrition Facts from AI analysis
                nutrition_facts: nutritionFacts,
                calories: nutritionFacts.calories || 0,
                servingSize: { 
                  amount: 100, 
                  unit: 'g' 
                },
                macros: {
                  protein: nutritionFacts.proteins || 0,
                  carbs: nutritionFacts.carbohydrates || 0,
                  fat: nutritionFacts.fat || 0,
                  fiber: nutritionFacts.fiber || 0,
                  sugar: nutritionFacts.sugars || 0,
                  saturated_fat: nutritionFacts.saturated_fat || 0,
                  sodium: nutritionFacts.sodium || 0,
                },
                
                // Health Scoring
                health_score: metadata.health_score || 0,
                grade: (metadata as any).nutrition_grade?.grade || 'N/A',
                nova_group: metadata.nova_group || 1,
                
                // Chat Integration
                askWihy: `Tell me about the nutritional value of this ${detectedFoods[0] || 'food'}`,
                
                // Full analysis data
                analysis: analysis,
                analyzed: true,
              },
              context: {
                sessionId: result.scan_id || 
                          (metadata as any).scan_id ||
                          `photo_${Date.now()}`,
                timestamp: result.timestamp || new Date().toISOString(),
                scanType: 'photo',
                scan_id: (metadata as any).scan_id,
                detectedFoods: detectedFoods,
                confidence_score: (metadata as any).vision_confidence || 0,
                data_sources: ['ai_vision_analysis'],
              },
            });
          } else {
            setIsProcessing(false);
            Alert.alert(
              'Analysis Failed',
              'Could not analyze the food photo. Please try again.',
              [{ text: 'OK' }]
            );
          }
        } else {
          setIsScanning(false);
          setIsProcessing(false);
          Alert.alert('Capture Failed', 'Could not capture photo. Please try again.', [{ text: 'OK' }]);
        }
      } else if (selectedMode === 'pill') {
        // Capture photo and identify pill
        if (!cameraRef.current) {
          setIsScanning(false);
          Alert.alert('Error', 'Camera not ready');
          return;
        }

        setIsProcessing(true);
        setProcessingMessage('Capturing photo...');
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo && photo.uri) {
          console.log('[CameraScreen] Compressing pill photo...');
          setProcessingMessage('Compressing image...');
          const imageData = await compressImageForUpload(photo.uri, { maxSizeKB: 500 });
          console.log('[CameraScreen] Photo compressed, sending to API...');
          setProcessingMessage('Identifying pill...');
          const result = await scanService.scanPill(imageData, {
            userId: user?.email || 'mobile-user',
          });

          setIsScanning(false);
          setIsProcessing(false);

          if (result.success && result.matches && result.matches.length > 0) {
            // Navigate to a results screen to display all matches
            const topMatch = result.matches[0];
            navigation.navigate('NutritionFacts', {
              foodItem: {
                name: topMatch.name || 'Unknown Medication',
                brand: topMatch.brandName || '',
                image_url: (result as any).image_url || photo.uri,
                imageUrl: (result as any).image_url || photo.uri,
                capturedImage: photo.uri,
                
                // Pill-specific data
                pillData: {
                  scanId: result.scanId,
                  matches: result.matches,
                  topMatch: {
                    name: topMatch.name,
                    brandName: topMatch.brandName,
                    genericName: (topMatch as any).genericName || '',
                    imprint: topMatch.imprint || 'N/A',
                    color: topMatch.color || 'N/A',
                    shape: topMatch.shape || 'N/A',
                    rxcui: topMatch.rxcui,
                    confidence: topMatch.confidence || 0,
                    dosage: (topMatch as any).dosage || '',
                    manufacturer: (topMatch as any).manufacturer || '',
                  },
                },
                
                // Display data
                calories: 0,
                servingSize: { amount: 1, unit: 'pill' },
                macros: {
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  fiber: 0,
                  sugar: 0,
                },
                
                // Metadata
                health_score: 0,
                grade: 'N/A',
                analyzed: true,
                askWihy: `Tell me about ${topMatch.name || 'this medication'}`,
              },
              context: {
                sessionId: `pill_${result.scanId || Date.now()}`,
                timestamp: (result as any).timestamp || new Date().toISOString(),
                scanType: 'pill',
                scan_id: result.scanId,
                confidence_score: topMatch.confidence || 0,
              },
            });
          } else if ((result as any).analysis) {
            // Handle image analysis fallback
            setIsProcessing(false);
            const analysis = (result as any).analysis;
            const detectedText = analysis.metadata?.detected_text || [];
            
            Alert.alert(
              'Pill Analysis',
              `No exact match found.\n\nDetected text: ${detectedText.join(', ') || 'None'}\n\nTry adjusting lighting or angle for better results.`,
              [{ text: 'OK' }]
            );
          } else {
            setIsProcessing(false);
            Alert.alert(
              'No Match Found',
              result.error || 'Could not identify this pill. Try adjusting lighting or angle.',
              [{ text: 'OK' }]
            );
          }
        } else {
          setIsScanning(false);
          setIsProcessing(false);
          Alert.alert('Capture Failed', 'Could not capture photo. Please try again.', [{ text: 'OK' }]);
        }
      } else if (selectedMode === 'label') {
        // Capture photo and scan label for claims/greenwashing
        if (!cameraRef.current) {
          setIsScanning(false);
          Alert.alert('Error', 'Camera not ready');
          return;
        }

        setIsProcessing(true);
        setProcessingMessage('Capturing photo...');
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo && photo.uri) {
          console.log('[CameraScreen] Compressing label photo...');
          setProcessingMessage('Compressing image...');
          const imageData = await compressImageForUpload(photo.uri, { maxSizeKB: 500 });
          console.log('[CameraScreen] Photo compressed, sending to API...');
          setProcessingMessage('Analyzing label...');
          const result = await scanService.scanLabel(imageData, {
            userId: user?.email || 'mobile-user',
          });

          setIsScanning(false);
          setIsProcessing(false);

          if (result.success && result.analysis) {
            const { analysis } = result;
            // NOTE: Jan 13, 2026 breaking change - greenwashing data is in analysis (not nested in metadata)
            const greenwashingScore = analysis.greenwashing_score || 0;
            const greenwashingFlags = analysis.greenwashing_flags || [];
            const detectedClaims = analysis.detected_claims || [];
            const detectedText = analysis.full_text || '';
            const productName = analysis.product_name || 'Product Label';
            const charts = (result as any).charts || {};
            const recommendations = analysis.recommendations || [];
            
            // Navigate to results screen with full data
            navigation.navigate('NutritionFacts', {
              foodItem: {
                name: productName,
                brand: analysis.brand || '',
                image_url: result.image_url || photo.uri,
                imageUrl: result.image_url || photo.uri,
                capturedImage: photo.uri,
                
                // Label-specific data - pass the full analysis
                // Jan 13, 2026: All greenwashing data is in analysis, not metadata
                labelData: {
                  // Basic info
                  productName,
                  summary: (analysis as any).summary || '',
                  
                  // Detected content
                  detectedText: detectedText,
                  detectedClaims: detectedClaims,
                  greenwashingFlags: greenwashingFlags,
                  
                  // Greenwashing scoring
                  greenwashingScore: greenwashingScore,
                  sustainabilityScore: analysis.sustainability_score || 0,
                  detectedCertifications: analysis.certifications || [],
                  healthClaims: analysis.health_claims || [],
                  ingredientsList: analysis.ingredients_list || [],
                  
                  // Charts
                  charts: charts,
                  
                  // Recommendations
                  recommendations: recommendations,
                  
                  // Full analysis object
                  analysis: analysis,
                },
                
                // Display data (greenwashing scoring)
                health_score: greenwashingScore, // Use greenwashing score as proxy
                grade: greenwashingScore > 50 ? 'C' : greenwashingScore > 25 ? 'B' : 'A',
                sustainability: analysis.sustainability_score || 0,
                servingSize: { amount: 100, unit: 'g' },
                macros: {
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  fiber: 0,
                  sugar: 0,
                },
                
                // Health info
                analyzed: true,
                askWihy: `Analyze the health claims and sustainability of ${productName}`,
                
                // Full result object
                scan_result: result,
              },
              context: {
                sessionId: `label_${Date.now()}`,
                timestamp: (result as any).timestamp || new Date().toISOString(),
                scanType: 'label',
                scan_id: result.scan_id,
              },
            });
          } else {
            Alert.alert(
              'Scan Failed',
              result.error || 'Could not read product label. Ensure text is visible and clear.',
              [{ text: 'OK' }]
            );
          }
        } else {
          setIsScanning(false);
          setIsProcessing(false);
          Alert.alert('Capture Failed', 'Could not capture photo. Please try again.', [{ text: 'OK' }]);
        }
      }
    } catch (error: any) {
      setIsScanning(false);
      setBarcodeProcessing(false);
      setIsProcessing(false);
      Alert.alert(
        'Scan Error',
        error.message || 'Failed to scan. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGallerySelect = async () => {
    const mediaPermission = await ensureMediaLibraryPermission();

    if (!mediaPermission.granted) {
      Alert.alert(
        'Media Library Permission Required',
        'WiHY needs access to your photos to analyze images. Please grant permission in Settings.'
      );
      return;
    }

    try {
      // TODO: Open image picker and get image URI
      // const result = await ImagePicker.launchImageLibraryAsync(...);
      // if (result.assets && result.assets[0]) {
      //   const imageResult = await scanService.scanImage(result.assets[0].uri);
      //   if (imageResult.success) {
      //     navigation.navigate('FullChat', { ... });
      //   }
      // }
      
      Alert.alert(
        'Gallery Selection',
        'Image picker integration coming soon. Will analyze selected photos with AI.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to select image',
        [{ text: 'OK' }]
      );
    }
  };

  const selectedModeData = scanModes.find(mode => mode.id === selectedMode);

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.permissionDeniedContainer}>
          <Ionicons name="videocam-off" size={64} color="#6b7280" />
          <Text style={styles.permissionDeniedTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDeniedText}>
            WiHY needs camera permission to scan barcodes and analyze food.
          </Text>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Camera View Area */}
      <View style={styles.cameraContainer}>
        {/* Real Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.cameraView}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'qr',
            ],
          }}
          onBarcodeScanned={selectedMode === 'barcode' && !barcodeProcessing ? handleBarcodeScanned : undefined}
        />
        
        {/* Camera Overlay - positioned absolutely on top */}
        <View style={styles.cameraOverlay}>
          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
              {/* Show scan line only when:
                  - Barcode mode with auto-scan enabled (continuous scanning indicator)
                  - OR actively processing a scan (isScanning) for any mode */}
              {((selectedMode === 'barcode' && autoScanEnabled) || isScanning) && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
                          }),
                        },
                      ],
                      opacity: scanAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1, 0.8],
                      }),
                    },
                  ]}
                />
              )}
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.frameCornerTR]} />
              <View style={[styles.frameCorner, styles.frameCornerBL]} />
              <View style={[styles.frameCorner, styles.frameCornerBR]} />
            </View>

            {/* Instructions */}
            {!isScanning && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>
                  {selectedModeData?.title}
                </Text>
                <Text style={styles.instructionsText}>
                  {selectedModeData?.subtitle}
                </Text>
                {selectedMode === 'barcode' && !autoScanEnabled && lastScannedBarcode && (
                  <View style={styles.barcodeDetectedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.barcodeDetectedText}>Barcode Detected</Text>
                  </View>
                )}
              </View>
            )}

            {isScanning && (
              <View style={styles.scanningContainer}>
                <View style={styles.scanningIndicator}>
                  <Image
                    source={require('../../assets/whatishealthyspinner.gif')}
                    style={styles.scanningSpinner}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.scanningText}>Analyzing...</Text>
              </View>
            )}
        </View>

        {/* Top Controls */}
        <View style={[styles.topControls, { top: topOffset + 24 }]}>
          <Pressable
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.controlButton}
            onPress={() => Alert.alert('Flash', 'Flash toggle')}
          >
            <Ionicons name="flash" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 20, marginBottom: -(insets.bottom + 10) }]}>
        {/* Scan Modes */}
        <View style={styles.modesContainer}>
          <Text style={styles.modesTitle}>Scan Mode</Text>
          <View style={styles.modesList}>
            {scanModes.map((mode) => (
              <Pressable
                key={mode.id}
                style={[
                  styles.modeButton,
                  selectedMode === mode.id && [
                    styles.modeButtonSelected,
                    { borderColor: mode.color },
                  ],
                ]}
                onPress={() => handleModeSelect(mode.id)}
              >
                <View
                  style={[
                    styles.modeIcon,
                    { backgroundColor: mode.color + '20' },
                    selectedMode === mode.id && { backgroundColor: mode.color },
                  ]}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={20}
                    color={selectedMode === mode.id ? '#ffffff' : mode.color}
                  />
                </View>
                <Text
                  style={[
                    styles.modeTitle,
                    selectedMode === mode.id && styles.modeTitleSelected,
                  ]}
                >
                  {mode.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Pressable
            style={styles.galleryButton}
            onPress={handleGallerySelect}
            disabled={isScanning}
          >
            <Ionicons name="images" size={24} color="#6b7280" />
          </Pressable>

          {selectedMode === 'barcode' && autoScanEnabled ? (
            /* Auto-scanning indicator for barcode mode when enabled */
            <View style={styles.autoScanIndicator}>
              <Ionicons name="scan" size={24} color={barcodeProcessing ? '#3b82f6' : '#6b7280'} />
              <Text style={styles.autoScanText}>
                {barcodeProcessing ? 'Processing...' : 'Auto-Scanning'}
              </Text>
            </View>
          ) : (
            /* Manual capture button */
            <Pressable
              style={[
                styles.captureButton,
                (isScanning || isProcessing) && styles.captureButtonScanning,
                selectedModeData && { borderColor: selectedModeData.color },
              ]}
              onPress={handleStartScan}
              disabled={isScanning || isProcessing}
            >
              <View
                style={[
                  styles.captureButtonInner,
                  selectedModeData && { backgroundColor: selectedModeData.color },
                  isScanning && styles.captureButtonInnerScanning,
                ]}
              >
                {isScanning ? (
                  <Ionicons name="stop" size={32} color="#ffffff" />
                ) : (
                  <Ionicons
                    name={selectedModeData?.icon as any || 'camera'}
                    size={32}
                    color="#ffffff"
                  />
                )}
              </View>
            </Pressable>
          )}

          <Pressable
            style={styles.historyButton}
            onPress={() => {
              if (user?.plan === 'free') {
                setShowPlansModal(true);
              } else {
                navigation.navigate('ScanHistory');
              }
            }}
            disabled={isScanning}
          >
            <Ionicons name="time" size={24} color="#6b7280" />
          </Pressable>
        </View>
      </View>

      {/* Processing Modal */}
      <Modal
        visible={isProcessing}
        transparent
        animationType="fade"
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.processingTitle}>{processingMessage}</Text>
            <Text style={styles.processingSubtitle}>Please wait...</Text>
          </View>
        </View>
      </Modal>

      {/* Plans Modal for Free Users */}
      <PlansModal
        visible={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        title="Upgrade to Access Scan History"
        subtitle="View all your past scans with Premium"
        onSelectPlan={(planId) => {
          console.log('Selected plan:', planId);
          // TODO: Integrate with actual subscription flow
          alert(`Plan selected: ${planId}\n\nSubscription integration coming soon!`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraView: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  frameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#ffffff',
    top: 0,
    left: 0,
  },
  frameCornerTR: {
    transform: [{ rotate: '90deg' }],
    top: 0,
    right: 0,
    left: undefined,
  },
  frameCornerBL: {
    transform: [{ rotate: '-90deg' }],
    bottom: 0,
    top: undefined,
  },
  frameCornerBR: {
    transform: [{ rotate: '180deg' }],
    bottom: 0,
    right: 0,
    top: undefined,
    left: undefined,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: -80,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    maxWidth: 250,
  },
  scanningContainer: {
    position: 'absolute',
    bottom: -100,
    alignItems: 'center',
  },
  scanningIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanningSpinner: {
    width: 40,
    height: 40,
    tintColor: '#ffffff',
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  bottomPanel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  modesContainer: {
    marginBottom: 24,
  },
  modesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  modesList: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonSelected: {
    backgroundColor: '#f8fafc',
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  modeTitleSelected: {
    color: '#1f2937',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  captureButtonScanning: {
    borderColor: '#ef4444',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInnerScanning: {
    backgroundColor: '#ef4444',
  },
  autoScanIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  autoScanText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  historyButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  permissionDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  permissionDeniedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionDeniedText: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  barcodeDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
  },
  barcodeDetectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});
