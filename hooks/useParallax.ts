import { useEffect, useRef } from 'react';
import { Platform, Animated } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';
import { useAzkarStore } from '@/store/azkarStore';

/**
 * Creates a parallax effect based on device tilt (Gravity).
 * @param depth The maximum pixel offset for the effect (sensitivity).
 * @returns An animated style object to apply to a View.
 */
export function useParallax(depth?: number) {
  const currentTheme = useAzkarStore(state => state.theme);
  
  // Config Check
  const isEnabled = EFFECTS_CONFIG.masterEnabled && 
                    EFFECTS_CONFIG.parallax.enabled &&
                    EFFECTS_CONFIG.parallax.themes.includes(currentTheme);

  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!isEnabled || Platform.OS === 'web') {
      return;
    }

    const subscription = DeviceMotion.addListener((data) => {
      const { rotation } = data;
      if (rotation) {
        const finalDepth = depth ?? EFFECTS_CONFIG.parallax.starsDepth;
        
        // Simple tilt mapping
        // rotation.gamma is left/right (roughly -pi/2 to pi/2)
        // rotation.beta is forward/back
        
        const x = (rotation.gamma || 0) * 5; 
        const y = (rotation.beta || 0) * 5;

        Animated.spring(translate, {
          toValue: { x: -x * finalDepth, y: -y * finalDepth },
          useNativeDriver: true,
          friction: 7,
          tension: 40
        }).start();
      }
    });

    DeviceMotion.setUpdateInterval(50);

    return () => {
      subscription.remove();
    };
  }, [isEnabled, depth]);

  if (!isEnabled || Platform.OS === 'web') {
    return { transform: [{ translateX: 0 }, { translateY: 0 }] };
  }

  return {
    transform: translate.getTranslateTransform()
  };
}