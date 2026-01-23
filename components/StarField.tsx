import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Polygon, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';
import { ShootingStar } from './ShootingStar';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';
import { useAzkarStore } from '@/store/azkarStore';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// --- Types ---
interface StarData {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  twinkleDelay: number;
  twinkleDuration: number;
}

interface StarProps extends StarData {
  color: string;
}

// --- Individual Star Component ---
const StarComponent = ({ size, rotation, color }: StarProps) => {
  const isGold = color === 'gold';
  const fillColor = isGold ? '#FFD700' : '#E0E0E0';
  const glowId = isGold ? 'glow_gold' : 'glow_white';

  return (
    <Svg 
      style={{ 
        transform: [{ rotate: `${rotation}deg` }],
        opacity: 0.9 
      }}
      width={size}
      height={size}
      viewBox="0 0 100 100"
    >
      {/* Outer Glow using Global Defs */}
      <Circle cx="50" cy="50" r="50" fill={`url(#${glowId})`} />

      {/* Star Shape */}
      <Polygon
        points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
        fill={fillColor}
      />
    </Svg>
  );
};
const Star = React.memo(StarComponent);

// --- Layer Components ---

// A static block of stars that covers the screen width once
const StarBlock = React.memo(({ data, color }: { data: StarData[], color: string }) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {data.map((star) => (
        <View 
          key={star.id} 
          style={{ position: 'absolute', left: star.x, top: star.y }}
        >
          <Star {...star} color={color} />
        </View>
      ))}
    </View>
  );
});

// The scrolling container
const InfiniteLayer = ({ 
  data, 
  speed, 
  color, 
  width 
}: { 
  data: StarData[], 
  speed: number, 
  color: string, 
  width: number 
}) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(translateX);
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-width, { duration: speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [width, speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { flexDirection: 'row', width: width * 2 }, animatedStyle]}>
      <View style={{ width: width, height: '100%' }}>
        <StarBlock data={data} color={color} />
      </View>
      {/* Duplicate block for seamless loop */}
      <View style={{ width: width, height: '100%' }}>
        <StarBlock data={data} color={color} />
      </View>
    </Animated.View>
  );
};


// --- Main StarField Component ---

const StarFieldComponent = () => {
  const { width, height } = useWindowDimensions();
  const currentTheme = useAzkarStore(state => state.theme);

  // Configuration
  const isEnabled = EFFECTS_CONFIG.masterEnabled && 
                    EFFECTS_CONFIG.stars.enabled && 
                    EFFECTS_CONFIG.stars.themes.includes(currentTheme);

  // Generate Data for Layers
  const layers = useMemo(() => {
    if (!isEnabled) return { foreground: [], middle: [], background: [] };

    const horizonY = height * 0.6; // Stars only in top 60%
    const { background, middle, foreground } = EFFECTS_CONFIG.stars.layers;
    const { animation } = EFFECTS_CONFIG.stars;

    // Helper to generate star data
    const generateStars = (count: number, minSize: number, maxSize: number) => {
      return Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * horizonY,
        size: Math.random() * (maxSize - minSize) + minSize,
        rotation: Math.random() * 360,
        twinkleDelay: Math.random() * 2000,
        twinkleDuration: animation.minDuration + Math.random() * (animation.maxDuration - animation.minDuration),
      }));
    };

    return {
      foreground: generateStars(foreground.count, foreground.sizeRange.min, foreground.sizeRange.max),
      middle: generateStars(middle.count, middle.sizeRange.min, middle.sizeRange.max),
      background: generateStars(background.count, background.sizeRange.min, background.sizeRange.max),
    };
  }, [width, height, isEnabled]);

  if (!isEnabled) return null;

  const { background, middle, foreground } = EFFECTS_CONFIG.stars.layers;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Global Gradient Definitions - Rendered once for all stars */}
      <Svg height="0" width="0">
        <Defs>
          <RadialGradient 
            id="glow_gold" 
            cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" 
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#FFD700" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#FFD700" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient 
            id="glow_white" 
            cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" 
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
      </Svg>
      
      {/* Layer 1: Deep Space (Background) */}
      <InfiniteLayer 
        data={layers.background} 
        speed={background.speed} 
        color={background.color}
        width={width}
      />

      {/* Layer 2: Mid Space (Middle) */}
      <InfiniteLayer 
        data={layers.middle} 
        speed={middle.speed} 
        color={middle.color}
        width={width}
      />

      {/* Layer 3: Near Field (Foreground) */}
      <InfiniteLayer 
        data={layers.foreground} 
        speed={foreground.speed} 
        color={foreground.color}
        width={width}
      />

      <ShootingStar />
    </View>
  );
};
export default React.memo(StarFieldComponent);