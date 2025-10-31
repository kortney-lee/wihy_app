"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var barcode_detector_polyfill_1 = require("@preflower/barcode-detector-polyfill");
if (typeof window !== 'undefined') {
    try {
        window.BarcodeDetector.getSupportedFormats();
    }
    catch (_a) {
        window.BarcodeDetector = barcode_detector_polyfill_1.BarcodeDetectorPolyfill;
    }
}
