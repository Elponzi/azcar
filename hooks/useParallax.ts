import { Platform } from 'react-native';
import { 
  useAnimatedSensor, 
  SensorType, 
  useAnimatedStyle, 
  withSpring,
  SharedValue
} from 'react-native-reanimated';
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

  // Always call the hook to satisfy Rules of Hooks
  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });
  
  const animatedStyle = useAnimatedStyle(() => {
    if (!isEnabled || Platform.OS === 'web') {
      return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    }

    const { x, y } = sensor.sensor.value;
    const finalDepth = depth ?? EFFECTS_CONFIG.parallax.starsDepth;

    // Gravity Logic
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
    
    // Smooth out the sensor noise with dividing by range
    const xTilt = clamp(x, -5, 5) / 5; 
    const yTilt = clamp(y, -5, 5) / 5; 

    // Physics Configuration for "Space Float" feel
    const springConfig = {
      damping: 20,    
      stiffness: 60,  
      mass: 1
    };

    // Invert direction (-xTilt) for "Window" depth effect
    return {
      transform: [
        { translateX: withSpring(-xTilt * finalDepth, springConfig) },
        { translateY: withSpring(-yTilt * finalDepth, springConfig) }
      ]
    };
  });

  return animatedStyle;
}