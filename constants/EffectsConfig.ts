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
    count: 20,
    sizeRange: { min: 10, max: 14 },
    animation: {
      minDuration: 2000,
      maxDuration: 5000,
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
    enabled: true,
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