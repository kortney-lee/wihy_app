/**
 * Quick test utility to verify Wihy API integration
 * Run this in browser console: testWihyAPI()
 */

// Test function to verify the API connection
async function testWihyAPI() {
  console.log('🧪 Testing Wihy API connection...');
  
  try {
    // Test the health endpoint first
    const healthResponse = await fetch('http://localhost:8001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test a simple health query
    const testQuery = {
      query: "what is healthy right now",
      request_type: "auto"
    };
    
    console.log('📤 Sending test query:', testQuery);
    
    const response = await fetch('http://localhost:8001/wihy/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testQuery)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    // Test the response format matches what we expect
    if (data.success && data.data && data.data.response) {
      console.log('🎉 API integration working perfectly!');
      console.log('💬 Response text:', data.data.response);
      return data;
    } else {
      console.warn('⚠️ Unexpected response format:', data);
      return data;
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error);
    return null;
  }
}

// Auto-run the test when this file is loaded
if (typeof window !== 'undefined') {
  console.log('🔧 Wihy API test utility loaded. Call testWihyAPI() to test the connection.');
}

export { testWihyAPI };