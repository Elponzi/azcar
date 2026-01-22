import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  withSequence
} from 'react-native-reanimated';
import { ShootingStar } from './ShootingStar';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';
import { useAzkarStore } from '@/store/azkarStore';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface StarProps {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

const StarComponent = ({ x, y, size, delay, duration, color }: StarProps) => {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: duration, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.8, { duration: duration, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
      ],
      left: x,
      top: y,
    };
  });

  return (
    <AnimatedText 
      style={[
        styles.star, 
        animatedStyle, 
        { 
          fontSize: size,
          color: color,
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 8, 
        }
      ]} 
    >
      ✦
    </AnimatedText>
  );
};

const Star = React.memo(StarComponent);

interface StarFieldProps {
  color?: string;
}

const StarFieldComponent = ({ color = '#FFD700' }: StarFieldProps) => {
  const { width, height } = useWindowDimensions();
  const currentTheme = useAzkarStore(state => state.theme);

  const stars = useMemo(() => {
    if (!EFFECTS_CONFIG.masterEnabled) return [];
    if (!EFFECTS_CONFIG.stars.themes.includes(currentTheme)) return [];
    if (!EFFECTS_CONFIG.stars.enabled) return [];
    
    const { count, sizeRange, animation } = EFFECTS_CONFIG.stars;

    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: (Math.random() * (height * 0.4)) + (height * 0.2), 
      size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
      delay: Math.random() * 2000,
      duration: Math.random() * (animation.maxDuration - animation.minDuration) + animation.minDuration,
    }));
  }, [width, height, currentTheme]);

  if (!EFFECTS_CONFIG.masterEnabled) return null;
  if (!EFFECTS_CONFIG.stars.themes.includes(currentTheme)) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star) => (
        <Star 
          key={star.id} 
          x={star.x} 
          y={star.y} 
          size={star.size} 
          delay={star.delay}
          duration={star.duration}
          color={color}
        />
      ))}
      <ShootingStar />
    </View>
  );
};

export default React.memo(StarFieldComponent);

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    includeFontPadding: false, 
    textAlignVertical: 'center',
  },
});