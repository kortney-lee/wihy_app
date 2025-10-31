import { BarcodeDetectorPolyfill } from '@preflower/barcode-detector-polyfill';
if (typeof window !== 'undefined') {
    try {
        window.BarcodeDetector.getSupportedFormats();
    }
    catch (_a) {
        window.BarcodeDetector = BarcodeDetectorPolyfill;
    }
}
