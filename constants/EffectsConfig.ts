export const EFFECTS_CONFIG = {
  // Global Switch (if false, disables all effects)
  masterEnabled: true,

  parallax: {
    enabled: true,
    starsDepth: 25,
    moonDepth: 10,
  },
  
  stars: {
    enabled: true,
    count: 15,
    sizeRange: { min: 8, max: 14 },
    animation: {
      minDuration: 2000,
      maxDuration: 5000,
    }
  },

  shootingStar: {
    enabled: true,
    minDelay: 8000,
    maxDelay: 25000,
    duration: 1500,
    minTrailLength: 100,
    maxTrailLength: 200,
  },

  moon: {
    enabled: true,
    size: 140,
    rotation: -35,
    position: { top: 80, right: 20 },
    glowEnabled: true,
  },

  divineLight: {
    enabled: true, // The ring background glow
  }
};
