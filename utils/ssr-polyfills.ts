import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window === 'undefined') {
  const globalAny = global as any;

  // Polyfill window
  if (!globalAny.window) {
    globalAny.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { href: '' },
      navigator: { userAgent: 'node' },
    };
  }

  // Polyfill document
  if (!globalAny.document) {
    globalAny.document = {
      createElement: () => ({
        style: {},
        appendChild: () => {},
      }),
      head: {
        appendChild: () => {},
      },
    };
  }

  // Polyfill EventTarget (often extended by expo-font/web)
  if (!globalAny.EventTarget) {
    globalAny.EventTarget = class EventTarget {
      addEventListener() {}
      removeEventListener() {}
      dispatchEvent() { return true; }
    };
  }

  // Polyfill FontFace (often used by expo-font/web)
  if (!globalAny.FontFace) {
    globalAny.FontFace = class FontFace {
      constructor() {}
      load() { return Promise.resolve(); }
    };
  }
  
  // Polyfill HTMLElement
  if (!globalAny.HTMLElement) {
    globalAny.HTMLElement = class HTMLElement {};
  }
  
  // Polyfill HTMLImageElement
  if (!globalAny.HTMLImageElement) {
    globalAny.HTMLImageElement = class HTMLImageElement {};
  }

  // Polyfill Image
  if (!globalAny.Image) {
    globalAny.Image = class Image {};
  }
}
