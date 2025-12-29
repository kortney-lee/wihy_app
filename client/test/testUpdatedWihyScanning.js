// Test the updated WiHy Scanning Service using Universal Search API
// This should return much richer data with the full contract

const { wihyScanningService } = require('../src/services/wihyScanningService.ts');

async function testUpdatedBarcodeScan() {
  console.log(' Testing Updated WiHy Scanning Service - Barcode Scan');
  console.log('='.repeat(60));
  
  try {
    // Test barcode scanning with Universal Search API integration
    const testBarcode = '3017620422003'; // Nutella barcode
    
    console.log(`\n[SEARCH] Testing barcode: ${testBarcode}`);
    
    const result = await wihyScanningService.scanBarcode(testBarcode, {
      health_goals: ['nutrition_analysis'],
      dietary_restrictions: [],
      background: 'health_conscious_consumer'
    });
    
    console.log('\n[CHART] FULL RESULT STRUCTURE:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n[OK] SUCCESS! Rich data received:');
      
      // Check for contract-compliant rich data
      console.log('\n[PAGE] PRODUCT INFO:');
      console.log(`- Name: ${result.product?.name}`);
      console.log(`- Brand: ${result.product?.brand}`);
      console.log(`- Health Score: ${result.health_score}/100`);
      console.log(`- NOVA Group: ${result.nova_group}`);
      console.log(`- Grade: ${result.nutrition?.grade}`);
      
      console.log('\n NUTRITION FACTS (per 100g):');
      if (result.nutrition?.per_100g) {
        console.log(`- Calories: ${result.nutrition.per_100g.energy_kcal}`);
        console.log(`- Protein: ${result.nutrition.per_100g.proteins}g`);
        console.log(`- Carbs: ${result.nutrition.per_100g.carbohydrates}g`);
        console.log(`- Fat: ${result.nutrition.per_100g.fat}g`);
        console.log(`- Fiber: ${result.nutrition.per_100g.fiber}g`);
        console.log(`- Sugar: ${result.nutrition.per_100g.sugars}g`);
        console.log(`- Sodium: ${result.nutrition.per_100g.sodium}mg`);
      }
      
      console.log('\n[!] HEALTH ALERTS:');
      if (result.health_analysis?.alerts && result.health_analysis.alerts.length > 0) {
        result.health_analysis.alerts.forEach(alert => {
          console.log(`- [${alert.severity.toUpperCase()}] ${alert.message}`);
        });
      } else {
        console.log('- No health alerts');
      }
      
      console.log('\n[BULB] RECOMMENDATIONS:');
      if (result.analysis?.recommendations && result.analysis.recommendations.length > 0) {
        result.analysis.recommendations.forEach(rec => {
          console.log(`- ${rec}`);
        });
      }
      
      console.log('\n[CHART] CHARTS AVAILABLE:');
      console.log(`- Has charts: ${!!result.analysis?.charts}`);
      
      console.log('\n⏱️ PERFORMANCE:');
      console.log(`- Confidence: ${result.scan_metadata?.confidence_score}`);
      console.log(`- Data Sources: ${result.scan_metadata?.data_sources?.join(', ')}`);
      
    } else {
      console.log('[X] FAILED:', result.error);
    }
    
  } catch (error) {
    console.error('[X] TEST ERROR:', error);
  }
}

async function testProductNameScan() {
  console.log('\n\n Testing Product Name Scan');
  console.log('='.repeat(60));
  
  try {
    const productName = 'quinoa nutrition';
    console.log(`\n[SEARCH] Testing product: ${productName}`);
    
    const result = await wihyScanningService.scanProductName(productName, {
      health_goals: ['nutrition_analysis', 'weight_loss'],
      dietary_restrictions: ['gluten_free']
    });
    
    console.log('\n[CHART] PRODUCT NAME SCAN RESULT:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('[X] Product name scan error:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('[ROCKET] Starting Updated WiHy Scanning Service Tests');
  console.log('Testing integration with Universal Search API for rich contract data');
  
  await testUpdatedBarcodeScan();
  await testProductNameScan();
  
  console.log('\n[OK] Tests completed!');
}

runTests();