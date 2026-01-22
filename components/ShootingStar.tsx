import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay, 
  Easing
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';

const { width, height } = Dimensions.get('window');

const STAR_SIZE = 2; 

export const ShootingStar = () => {
  // Config Check
  if (!EFFECTS_CONFIG.masterEnabled || !EFFECTS_CONFIG.shootingStar.enabled) return null;

  const { minDelay, maxDelay, duration, minTrailLength, maxTrailLength } = EFFECTS_CONFIG.shootingStar;

  // Animation Values
  const translateX = useSharedValue(-maxTrailLength);
  const translateY = useSharedValue(-maxTrailLength);
  const opacity = useSharedValue(0);
  const currentTrailLength = useSharedValue(minTrailLength);

  const triggerAnimation = () => {
    // 1. Randomize Start Position
    const startX = Math.random() * width + (width * 0.1); 
    const startY = Math.random() * (height * 0.2); 
    
    // 2. Calculate End Position
    const travelDist = Math.random() * 200 + 300; 
    const endX = startX - travelDist; 
    const endY = startY + travelDist; 

    // Randomize length
    currentTrailLength.value = Math.random() * (maxTrailLength - minTrailLength) + minTrailLength;

    // Reset
    translateX.value = startX;
    translateY.value = startY;
    opacity.value = 0;

    // 3. Run Animation
    opacity.value = withSequence(
      withTiming(0.8, { duration: 200 }), 
      withDelay(duration * 0.4, withTiming(0, { duration: duration * 0.4 }))
    );

    const movementConfig = { 
      duration: duration, 
      easing: Easing.out(Easing.quad) 
    };

    translateX.value = withTiming(endX, movementConfig);
    translateY.value = withTiming(endY, movementConfig);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      const nextDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutId = setTimeout(() => {
        triggerAnimation();
        scheduleNext();
      }, nextDelay);
    };

    // Initial trigger
    timeoutId = setTimeout(() => {
        triggerAnimation();
        scheduleNext();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    width: currentTrailLength.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: '135deg' }
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
       <Svg height={STAR_SIZE} width={maxTrailLength}>
        <Defs>
          <LinearGradient id="tail" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="transparent" stopOpacity="0" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={STAR_SIZE} fill="url(#tail)" />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: STAR_SIZE,
    zIndex: 0, 
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
});