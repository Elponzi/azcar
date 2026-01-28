import React, { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, Animated, Easing, Platform } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';
import { useAzkarStore } from '@/store/azkarStore';

const STAR_SIZE = 2; 

export const ShootingStar = () => {
  const { width, height } = useWindowDimensions();
  const currentTheme = useAzkarStore(state => state.theme);

  const { minDelay, maxDelay, duration, minTrailLength, maxTrailLength } = EFFECTS_CONFIG.shootingStar;

  // Animation Values
  const translateX = useRef(new Animated.Value(-maxTrailLength)).current;
  const translateY = useRef(new Animated.Value(-maxTrailLength)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const currentTrailLength = useRef(new Animated.Value(minTrailLength)).current; // Acts as ScaleX

  const triggerAnimation = () => {
    // ...
    // Randomize length
    const targetLength = Math.random() * (maxTrailLength - minTrailLength) + minTrailLength;
    currentTrailLength.setValue(targetLength);

    // ...
  };

  // ...

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate: '135deg' },
            { scaleX: currentTrailLength } // Use ScaleX instead of width
          ]
        }
      ]} 
      pointerEvents="none"
    >
       {/* Set base width to 1 so scaleX acts as pixel width */}
       <Svg height={STAR_SIZE} width={1} style={{ width: 1, overflow: 'visible' }}> 
        <Defs>
          <LinearGradient id="tail" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="transparent" stopOpacity="0" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Draw Rect with fixed 1px width, it will be scaled */}
        <Rect x="0" y="0" width="1" height={STAR_SIZE} fill="url(#tail)" />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // ...
    width: 1, // Fixed base width
    // ...
  },
});