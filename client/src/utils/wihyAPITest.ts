/**
 * WiHy Enhanced Model API Integration Test
 * Tests the new production endpoints and enhanced features
 */

import { wihyAPI } from '../services/wihyAPI';

export class WihyEnhancedAPITest {
  
  /**
   * Test Enhanced Model API Health Check
   */
  static async testAPIHealth(): Promise<void> {
    try {
      console.log('🔍 Testing WiHy Enhanced Model API Health...');
      
      const healthStatus = await wihyAPI.checkAPIHealth();
      
      console.log('✅ API Health Check Results:');
      console.log(`   Status: ${healthStatus.status}`);
      console.log(`   Model Version: ${healthStatus.model_version}`);
      console.log(`   Training Examples: ${healthStatus.training_examples}`);
      
    } catch (error) {
      console.error('❌ API Health Check Failed:', error);
      throw error;
    }
  }

  /**
   * Test Enhanced Health Question
   */
  static async testHealthQuestion(): Promise<void> {
    try {
      console.log('🧠 Testing Enhanced Health Question...');
      
      const response = await wihyAPI.askEnhancedHealthQuestion({
        query: 'What are the health benefits of eating spinach?',
        context: 'nutritional analysis for family meals',
        user_id: 'test_user'
      });
      
      console.log('✅ Enhanced Health Question Results:');
      console.log(`   Answer Length: ${response.answer.length} characters`);
      console.log(`   Research Citations: ${response.research_citations.length}`);
      console.log(`   Biblical Wisdom: ${response.wihy_wisdom.length} items`);
      console.log(`   Confidence Score: ${Math.round(response.confidence_score * 100)}%`);
      console.log(`   Training Examples Used: ${response.training_examples_used}`);
      
      // Test the formatted response
      const formatted = wihyAPI.formatEnhancedResponse(response);
      console.log(`   Formatted Response Length: ${formatted.length} characters`);
      
    } catch (error) {
      console.error('❌ Enhanced Health Question Failed:', error);
      throw error;
    }
  }

  /**
   * Test Barcode Scanner (if available)
   */
  static async testBarcodeScanner(): Promise<void> {
    try {
      console.log('📊 Testing Barcode Scanner...');
      
      // Test with a common product barcode (Nutella)
      const response = await wihyAPI.scanBarcode('3017620422003', {
        scan_location: 'web_app_test',
        device_type: 'desktop'
      });
      
      console.log('✅ Barcode Scanner Results:');
      console.log(`   Success: ${response.success}`);
      console.log(`   Product: ${response.product_name}`);
      console.log(`   Health Score: ${response.health_score}/100`);
      console.log(`   NOVA Group: ${response.nova_group}`);
      console.log(`   Recommendations: ${response.wihy_recommendations.length}`);
      console.log(`   Data Sources: ${response.data_sources.join(', ')}`);
      
      // Test NOVA guidance
      const guidance = wihyAPI.getNovaGuidance(response.nova_group);
      console.log(`   NOVA Guidance: ${guidance.action} (${guidance.color}) - ${guidance.message}`);
      
    } catch (error) {
      console.error('❌ Barcode Scanner Failed:', error);
      console.log('ℹ️  This may be normal if the product is not in the database');
    }
  }

  /**
   * Test Legacy Compatibility
   */
  static async testLegacyCompatibility(): Promise<void> {
    try {
      console.log('🔄 Testing Legacy Compatibility...');
      
      const response = await wihyAPI.askAnything({
        query: 'Is olive oil healthy?',
        user_context: {
          age: 35,
          family_size: 4,
          dietary_restrictions: ['none']
        }
      });
      
      console.log('✅ Legacy Compatibility Results:');
      console.log(`   Success: ${response.success}`);
      console.log(`   Response Type: ${(response as any).response_type || 'enhanced_model'}`);
      
      // Test formatted response
      const formatted = wihyAPI.formatWihyResponse(response);
      console.log(`   Formatted Response Length: ${formatted.length} characters`);
      
      // Test recommendations extraction
      const recommendations = wihyAPI.extractRecommendations(response);
      console.log(`   Extracted Recommendations: ${recommendations.length}`);
      
    } catch (error) {
      console.error('❌ Legacy Compatibility Failed:', error);
      throw error;
    }
  }

  /**
   * Run all integration tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Starting WiHy Enhanced Model API Integration Tests...');
    console.log('================================================');
    
    try {
      // Test API Health first
      await this.testAPIHealth();
      console.log('');
      
      // Test Enhanced Health Question
      await this.testHealthQuestion();
      console.log('');
      
      // Test Barcode Scanner
      await this.testBarcodeScanner();
      console.log('');
      
      // Test Legacy Compatibility
      await this.testLegacyCompatibility();
      console.log('');
      
      console.log('🎉 All WiHy Enhanced Model API Tests Completed!');
      console.log('================================================');
      
    } catch (error) {
      console.error('❌ Integration Tests Failed:', error);
      throw error;
    }
  }
}

// Export for use in development/testing
export default WihyEnhancedAPITest;