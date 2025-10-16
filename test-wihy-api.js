// Test script to verify WiHy API integration
// This matches the exact example format provided

async function testWihyAPI() {
  console.log('Testing WiHy API with exact format...');
  
  try {
    // This matches your example exactly!
    const response = await fetch('https://wihy-main-api.graypebble-2c416c49.westus2.azurecontainerapps.io/wihy/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "what is healthy",
        request_type: "auto",
        context: {}
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ WiHy API Response:', data);
    
    // Check if response has expected structure
    if (data.success) {
      console.log('✅ API call successful!');
      console.log('Service used:', data.service_used);
      console.log('Request type:', data.request_type);
      console.log('Processing time:', data.processing_time);
    } else {
      console.log('❌ API call failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Error testing WiHy API:', error);
  }
}

// Run the test if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testWihyAPI();
}

module.exports = testWihyAPI;