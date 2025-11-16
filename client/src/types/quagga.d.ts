// QuaggaJS TypeScript declarations
// Since @types/quagga is not available, we'll create our own minimal declarations

declare module 'quagga' {
  interface QuaggaJSConfigObject {
    inputStream?: {
      name?: string;
      type?: string;
      target?: HTMLElement | null;
      constraints?: {
        width?: number;
        height?: number;
        facingMode?: string;
      };
    };
    locator?: {
      patchSize?: string;
      halfSample?: boolean;
    };
    numOfWorkers?: number;
    decoder?: {
      readers?: string[];
    };
    locate?: boolean;
    src?: string;
  }

  interface QuaggaJSResultObject {
    codeResult?: {
      code?: string;
      format?: string;
    };
  }

  interface QuaggaJSStatic {
    init(config: QuaggaJSConfigObject, callback: (error?: any) => void): void;
    start(): void;
    stop(): void;
    onDetected(callback: (result: QuaggaJSResultObject) => void): void;
    decodeSingle(config: QuaggaJSConfigObject, callback: (result: QuaggaJSResultObject) => void): void;
  }

  const Quagga: QuaggaJSStatic;
  export default Quagga;
}