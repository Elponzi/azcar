import { Platform } from 'react-native';
import { 
  useAnimatedSensor, 
  SensorType, 
  useAnimatedStyle, 
  withSpring,
  SharedValue
} from 'react-native-reanimated';

/**
 * Creates a parallax effect based on device tilt (Gravity).
 * @param depth The maximum pixel offset for the effect (sensitivity).
 * @returns An animated style object to apply to a View.
 */
export function useParallax(depth: number = 20) {
  // We use GRAVITY because we want the position to correspond to the absolute tilt angle,
  // not the rate of rotation (Gyroscope).
  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });
  
  const animatedStyle = useAnimatedStyle(() => {
    // Web fallback
    if (Platform.OS === 'web') {
      return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    }

    const { x, y } = sensor.sensor.value;
    
    // Gravity Logic:
    // X axis: Tilt Left/Right. Range roughly -9.8 to 9.8.
    // Y axis: Tilt Forward/Back. Range roughly -9.8 to 9.8.
    
    // We reverse the direction (multiply by -1) so elements "closer" move opposite to tilt,
    // or "background" elements move WITH tilt?
    // Standard parallax: Background moves in direction of tilt (like a window).
    // If I tilt phone LEFT (window frame moves left), I should see more of the Right side of the view.
    // So background should move RIGHT relative to frame.
    // Tilt Left -> sensor X becomes positive (on Android/iOS vary, usually positive).
    // Let's use a standard mapping and let the user feel it. 
    
    // We clamp the values slightly to prevent extreme shifts
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
    
    // Map -5 to 5 gravity (approx 30 degree tilt) to the depth range
    const xTilt = clamp(x, -5, 5) / 5; // -1 to 1
    const yTilt = clamp(y, -5, 5) / 5; // -1 to 1

    return {
      transform: [
        { translateX: withSpring(xTilt * depth, { damping: 50, stiffness: 200 }) },
        { translateY: withSpring(yTilt * depth, { damping: 50, stiffness: 200 }) }
      ]
    };
  });

  return animatedStyle;
}
