import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop, RadialGradient, Circle } from 'react-native-svg';
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

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

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
    <AnimatedSvg 
      style={[
        styles.star, 
        animatedStyle
      ]}
      width={size}
      height={size}
      viewBox="0 0 100 100"
    >
      <Defs>
        {/* External Glow Gradient */}
        <RadialGradient 
          id="externalGlow" 
          cx="50" 
          cy="50" 
          rx="50" 
          ry="50" 
          fx="50" 
          fy="50" 
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#FFD700" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#FFD700" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      {/* The Glow (Behind) */}
      <Circle cx="50" cy="50" r="50" fill="url(#externalGlow)" />

      {/* The Star Shape (Solid Gold) */}
      <Polygon
        points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
        fill="#FFD700"
      />
    </AnimatedSvg>
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
    
    // Limits
    const bottomLimit = height * 0.55; // Avoid bottom controls
    const sideZoneWidth = width * 0.25; // Left/Right zones take 25% each
    const topZoneHeight = height * 0.25; // Top zone height

    return Array.from({ length: count }).map((_, i) => {
      // Zone-based distribution to frame the text
      const zone = Math.random();
      let x, y;

      if (zone < 0.35) {
        // Left Zone (35%)
        x = Math.random() * sideZoneWidth;
        y = Math.random() * bottomLimit;
      } else if (zone < 0.70) {
        // Right Zone (35%)
        x = width - (Math.random() * sideZoneWidth);
        y = Math.random() * bottomLimit;
      } else {
        // Top Zone (30%) - Spread across top, above text
        x = Math.random() * width;
        y = Math.random() * topZoneHeight;
      }

      return {
        id: i,
        x,
        y,
        size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
        delay: Math.random() * 2000,
        duration: Math.random() * (animation.maxDuration - animation.minDuration) + animation.minDuration,
      };
    });
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