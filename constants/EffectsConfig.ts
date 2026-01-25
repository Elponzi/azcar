type Theme = 'light' | 'dark';

export const EFFECTS_CONFIG = {
  // Global Switch
  masterEnabled: true,

  parallax: {
    enabled: true,
    themes: ['dark'] as Theme[], // Only active in dark mode
    starsDepth: 25,
    moonDepth: 10,
  },
  
  stars: {
    enabled: true,
    themes: ['dark'] as Theme[], // Only visible in dark mode
    horizonRatio: 1,
    layers: {
      background: {
        count: 30,
        speed: 50000,
        sizeRange: { min: 2, max: 4 },
        color: 'white',
      },
      middle: {
        count: 8,
        speed: 100000,
        sizeRange: { min: 5, max: 8 },
        color: 'white',
      },
      foreground: {
        count: 6,
        speed: 150000,
        sizeRange: { min: 9, max: 12 },
        color: 'white',
      },
    }
  },

  shootingStar: {
    enabled: true,
    themes: ['dark'] as Theme[],
    minDelay: 8000,
    maxDelay: 25000,
    duration: 1500,
    minTrailLength: 100,
    maxTrailLength: 200,
  },

  moon: {
    enabled: false,
    themes: ['dark'] as Theme[],
    size: 180,
    rotation: -30,
    position: { top: 80, left: 0 },
    glowEnabled: true,
  },

  divineLight: {
    enabled: true, 
    themes: ['light', 'dark'] as Theme[], // Visible in both
  }
};