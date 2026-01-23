import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Polygon, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
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
}

interface StarProps extends StarData {}

// --- Individual Star Component ---
const StarComponent = ({ size, rotation }: StarProps) => {
  return (
    <Svg 
      style={{ 
        transform: [{ rotate: `${rotation}deg` }],
        opacity: 0.8 
      }}
      width={size}
      height={size}
      viewBox="0 0 100 100"
    >
      {/* Star Shape */}
      <Polygon
        points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
        fill="#FFFFFF"
      />
    </Svg>
  );
};
const Star = React.memo(StarComponent);

// --- Layer Components ---

// A static block of stars that covers the screen width once
const StarBlock = React.memo(({ data }: { data: StarData[] }) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {data.map((star) => (
        <View 
          key={star.id} 
          style={{ position: 'absolute', left: star.x, top: star.y }}
        >
          <Star {...star} />
        </View>
      ))}
    </View>
  );
});

// The scrolling container
const InfiniteLayer = ({
  data,
  speed,
  blockHeight
}: {
  data: StarData[],
  speed: number,
  blockHeight: number
}) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(translateY);
    translateY.value = 0;
    translateY.value = withRepeat(
      withTiming(-blockHeight, { duration: speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [blockHeight, speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { flexDirection: 'column', height: blockHeight * 2 }, animatedStyle]}>
      <View style={{ width: '100%', height: blockHeight }}>
        <StarBlock data={data} />
      </View>
      {/* Duplicate block for seamless loop */}
      <View style={{ width: '100%', height: blockHeight }}>
        <StarBlock data={data} />
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

  // Constants for vertical scroll
  const horizonY = height * EFFECTS_CONFIG.stars.horizonRatio;

  // Generate Data for Layers
  const layers = useMemo(() => {
    if (!isEnabled) return { foreground: [], middle: [], background: [] };

    const { background, middle, foreground } = EFFECTS_CONFIG.stars.layers;

    // Helper to generate star data
    const generateStars = (count: number, minSize: number, maxSize: number) => {
      return Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * horizonY,
        size: Math.random() * (maxSize - minSize) + minSize,
        rotation: Math.random() * 360,
      }));
    };

    return {
      foreground: generateStars(foreground.count, foreground.sizeRange.min, foreground.sizeRange.max),
      middle: generateStars(middle.count, middle.sizeRange.min, middle.sizeRange.max),
      background: generateStars(background.count, background.sizeRange.min, background.sizeRange.max),
    };
  }, [width, horizonY, isEnabled]);

  if (!isEnabled) return null;

  const { background, middle, foreground } = EFFECTS_CONFIG.stars.layers;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      
      {/* Masked Container for Star Layers to prevent overflow into bottom controls */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: width, height: horizonY, overflow: 'hidden' }}>
        {/* Layer 1: Deep Space (Background) */}
        <InfiniteLayer 
          data={layers.background} 
          speed={background.speed} 
          blockHeight={horizonY}
        />

        {/* Layer 2: Mid Space (Middle) */}
        <InfiniteLayer 
          data={layers.middle} 
          speed={middle.speed} 
          blockHeight={horizonY}
        />

        {/* Layer 3: Near Field (Foreground) */}
        <InfiniteLayer 
          data={layers.foreground} 
          speed={foreground.speed} 
          blockHeight={horizonY}
        />
      </View>

      <ShootingStar />
    </View>
  );
};
export default React.memo(StarFieldComponent);