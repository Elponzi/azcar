import { Platform } from 'react-native';
import { 
  useAnimatedSensor, 
  SensorType, 
  useAnimatedStyle, 
  withSpring,
  SharedValue
} from 'react-native-reanimated';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';

/**
 * Creates a parallax effect based on device tilt (Gravity).
 * @param depth The maximum pixel offset for the effect (sensitivity).
 * @returns An animated style object to apply to a View.
 */
export function useParallax(depth?: number) {
  // Config Check
  const isEnabled = EFFECTS_CONFIG.masterEnabled && EFFECTS_CONFIG.parallax.enabled;

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
    const xTilt = clamp(x, -5, 5) / 5; 
    const yTilt = clamp(y, -5, 5) / 5; 

    return {
      transform: [
        { translateX: withSpring(xTilt * finalDepth, { damping: 50, stiffness: 200 }) },
        { translateY: withSpring(yTilt * finalDepth, { damping: 50, stiffness: 200 }) }
      ]
    };
  });

  return animatedStyle;
}
