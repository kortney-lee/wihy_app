// Test script to verify Wihy Scanning Service integration
import { wihyScanningService } from '../src/services/wihyScanningService';

async function testScanningService() {
  console.log(' Testing Wihy Scanning Service Integration...\n');

  try {
    // Test 1: Service Status
    console.log('1️⃣ Testing service status...');
    const status = await wihyScanningService.getServiceStatus();
    console.log('Status:', status.success ? '[OK] Online' : '[X] Offline');
    console.log('Services:', status.services);
    console.log('Capabilities:', status.capabilities);
    console.log('');

    // Test 2: Barcode Scanning (using Coca-Cola barcode from API docs)
    console.log('2️⃣ Testing barcode scanning...');
    const barcodeResult = await wihyScanningService.scanBarcode('049000042566');
    console.log('Barcode scan:', barcodeResult.success ? '[OK] Success' : '[X] Failed');
    if (barcodeResult.success && barcodeResult.product) {
      console.log('Product:', barcodeResult.product.name);
      console.log('Brand:', barcodeResult.product.brand);
      console.log('Health Score:', barcodeResult.nutrition?.grade, barcodeResult.nutrition?.score);
    }
    if (barcodeResult.error) {
      console.log('Error:', barcodeResult.error);
    }
    console.log('');

    // Test 3: Product Name Search
    console.log('3️⃣ Testing product name search...');
    const searchResult = await wihyScanningService.scanProductName('Greek Yogurt');
    console.log('Product search:', searchResult.success ? '[OK] Success' : '[X] Failed');
    if (searchResult.success && searchResult.analysis) {
      console.log('Summary:', searchResult.analysis.summary?.substring(0, 100) + '...');
      console.log('Confidence:', Math.round((searchResult.analysis.confidence_score || 0) * 100) + '%');
    }
    if (searchResult.error) {
      console.log('Error:', searchResult.error);
    }
    console.log('');

    console.log('[PARTY] Scanning service integration test completed!');

  } catch (error) {
    console.error('[X] Test failed:', error);
  }
}

// Export for use in development
export { testScanningService };

// Auto-run if this file is executed directly (for development testing)
if (typeof window !== 'undefined' && (window as any).testScanning) {
  testScanningService();
}