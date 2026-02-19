/**
 * SSR/SSG Polyfills for Vercel/Node build environment.
 * This file MUST NOT import anything to avoid hoisting issues.
 */

if (typeof window === 'undefined') {
  const g = global as any;

  // Basic window/document objects
  g.window = g.window || {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    location: { href: '', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'node' },
    history: { pushState: () => {}, replaceState: () => {}, state: {} },
    customElements: { define: () => {} },
    matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  };

  g.document = g.document || {
    createElement: () => ({
      style: {},
      appendChild: () => {},
      setAttribute: () => {},
      getElementsByTagName: () => [],
    }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    documentElement: { style: {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  g.self = g.window;

  // The Big Ones: Classes that are often extended or instantiated
  
  // EventTarget is the most common cause of "Class extends value undefined"
  if (!g.EventTarget) {
    g.EventTarget = class EventTarget {
      addEventListener() {}
      removeEventListener() {}
      dispatchEvent() { return true; }
    };
  }

  // Node, Element, HTMLElement
  g.Node = g.Node || class Node {};
  g.Element = g.Element || class Element extends g.Node {};
  g.HTMLElement = g.HTMLElement || class HTMLElement extends g.Element {};
  g.HTMLImageElement = g.HTMLImageElement || class HTMLImageElement extends g.HTMLElement {};

  // FontFace and FontFaceSet (Critical for expo-font)
  if (!g.FontFace) {
    g.FontFace = class FontFace {
      constructor() {}
      load() { return Promise.resolve(this); }
    };
  }

  if (!g.document.fonts) {
    g.document.fonts = {
      add: () => {},
      delete: () => {},
      clear: () => {},
      check: () => true,
      ready: Promise.resolve(),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }
  
  // Image
  g.Image = g.Image || class Image extends g.HTMLImageElement {};
}
