// Expo React Native adaptation of VHealthSearch component
// This shows how to convert the existing web component to React Native

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';

// Import shared services (these can be 100% reused)
import { WihyAPIService } from '../../shared/services/wihyAPI';
import { sessionManager } from '../../shared/services/sessionManager';

interface VHealthSearchRNProps {
  // Props interface remains the same
}

const rotatingPrompts = [
  "Scan food and explain it",
  "Analyze my meals", 
  "Create a nutrition plan for me",
  "Build me a workout plan",
  "Review this health claim",
  "Show me my habits over time",
  "Help me improve my health"
];

export const VHealthSearchRN: React.FC<VHealthSearchRNProps> = () => {
  const navigation = useNavigation();
  
  // State management - same as web version
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [placeholder, setPlaceholder] = useState(rotatingPrompts[0]);

  // Rotating placeholder effect - same logic as web
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const nextIndex = (rotatingPrompts.indexOf(prev) + 1) % rotatingPrompts.length;
        return rotatingPrompts[nextIndex];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Initialize session - same logic as web
  useEffect(() => {
    sessionManager.initialize().then((session) => {
      console.log('Session initialized:', session);
    }).catch((error) => {
      console.error('Failed to initialize session:', error);
    });
  }, []);

  // Main search handler - reuse existing logic with React Native navigation
  const handleSearch = async (queryParam?: string) => {
    const queryToUse = queryParam || searchQuery;
    if (!queryToUse.trim() || isLoading) return;
    
    setIsLoading(true);
    setLoadingMessage('Initializing search...');
    
    try {
      setLoadingMessage('Analyzing with AI...');
      
      // Reuse existing WiHy API service
      const wihyAPI = new WihyAPIService();
      const wihyResponse = await wihyAPI.searchHealth(queryToUse);
      
      if (wihyResponse.success) {
        let summary = 'Health information provided';
        
        if ('data' in wihyResponse) {
          summary = (wihyResponse as any).data?.response || summary;
        } else {
          summary = (wihyResponse as any).wihy_response?.core_principle || summary;
        }
        
        const searchResults = {
          summary: summary,
          details: wihyAPI.formatWihyResponse(wihyResponse),
          sources: wihyAPI.extractCitations(wihyResponse),
          recommendations: wihyAPI.extractRecommendations(wihyResponse),
          relatedTopics: [],
          medicalDisclaimer: 'This guidance is based on evidence-based health principles. Always consult healthcare professionals for personalized medical advice.',
          dataSource: 'wihy'
        };
        
        setLoadingMessage('Results ready!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const sessionId = sessionManager.getSessionId();
        
        // Navigate to results screen (React Native navigation)
        navigation.navigate('Results', {
          results: searchResults,
          apiResponse: wihyResponse,
          dataSource: 'wihy',
          fromSearch: true,
          sessionId: sessionId,
          query: queryToUse
        });
        
        setIsLoading(false);
        return;
      } else {
        throw new Error('WiHy API request failed');
      }
    } catch (error) {
      console.error("Search error:", error);
      
      const errorMessage = error.message || '';
      if (errorMessage.includes('NETWORK_ERROR') || errorMessage.includes('TIMEOUT_ERROR')) {
        setLoadingMessage('Connection trouble! Please check your internet and try again.');
      } else {
        setLoadingMessage('Something went wrong! Please try your search again 🔄');
      }
      
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('Searching...');
      }, 3000);
    }
  };

  // Camera capture handler - React Native specific implementation
  const handleCameraCapture = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Camera access is required to scan food items.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await handleImageAnalysis(imageData);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  // Image gallery picker - React Native specific
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission',
          'Photo library access is required to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await handleImageAnalysis(imageData);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Image analysis - reuse existing API logic
  const handleImageAnalysis = async (imageData: string) => {
    setIsLoading(true);
    setLoadingMessage('Processing image...');
    
    try {
      // Reuse existing scanning service logic
      const wihyAPI = new WihyAPIService();
      // Use the same scanning endpoint as web version
      const response = await wihyAPI.analyzeImage(imageData);
      
      if (response.success) {
        const analysisResults = {
          summary: response.analysis.summary,
          details: response.analysis.summary,
          sources: [],
          recommendations: response.analysis.recommendations || [],
          relatedTopics: [],
          medicalDisclaimer: 'This guidance is based on evidence-based health principles.',
          dataSource: 'wihy_scanner',
          imageUrl: imageData
        };
        
        const sessionId = sessionManager.getSessionId();
        
        navigation.navigate('Results', {
          results: analysisResults,
          apiResponse: response,
          dataSource: 'wihy_scanner',
          fromSearch: true,
          sessionId: sessionId,
          imageUrl: imageData
        });
      } else {
        throw new Error('Image analysis failed');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      setLoadingMessage('Could not analyze the image. Please try again.');
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage('Searching...');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
        <Text style={styles.loadingSubtext}>This may take a few moments...</Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setIsLoading(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>What is Healthy?</Text>
        </View>
        
        {/* Search Input Section */}
        <View style={styles.searchInputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={placeholder}
              style={styles.searchInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
            
            {/* Clear button */}
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearSearch}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, (!searchQuery.trim() || isLoading) && styles.disabledButton]}
            onPress={() => handleSearch()}
            disabled={!searchQuery.trim() || isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? loadingMessage : 'Analyze Nutrition'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Research')}
          >
            <Text style={styles.secondaryButtonText}>Verify With Evidence</Text>
          </TouchableOpacity>
        </View>

        {/* Camera Options */}
        <View style={styles.cameraButtons}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraCapture}
          >
            <Text style={styles.cameraButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleImagePicker}
          >
            <Text style={styles.cameraButtonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  searchInputContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 60,
    maxHeight: 120,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 20,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  actionButtons: {
    gap: 15,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  cameraButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});

export default VHealthSearchRN;