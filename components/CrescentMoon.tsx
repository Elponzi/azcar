import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';
import { useAzkarStore } from '@/store/azkarStore';

interface CrescentMoonProps {
  color?: string;
  size?: number;
  isRTL?: boolean;
}

export const CrescentMoon = ({ color = '#FFD700', size: propSize, isRTL = false }: CrescentMoonProps) => {
  const currentTheme = useAzkarStore(state => state.theme);

  const { size: configSize, rotation, position, glowEnabled } = EFFECTS_CONFIG.moon;
  const size = propSize || configSize;

  // Animation Values
  const glowOpacity = useSharedValue(0.4);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // 1. Breathing Glow Effect
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, 
      true 
    );

    // 2. Floating Motion
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowEnabled ? glowOpacity.value : 0,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }]
  }));

  // Logic Check
  const isEnabled = EFFECTS_CONFIG.masterEnabled && 
                    EFFECTS_CONFIG.moon.enabled && 
                    EFFECTS_CONFIG.moon.themes.includes(currentTheme);

  if (!isEnabled) return null;

  // Dynamic Styles from Config
  const dynamicWrapperStyle = {
    top: position.top,
    right: position.right,
    width: size,
    height: size,
  };

  const dynamicRotationStyle = {
    transform: [{ rotate: `${rotation}deg` }]
  };

  return (
    <View style={[styles.wrapper, dynamicWrapperStyle]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
        
        {/* The Glow (Behind) */}
        {glowEnabled && (
          <Animated.View style={[StyleSheet.absoluteFill, animatedGlowStyle]}>
            <Svg height="100%" width="100%" viewBox="0 0 100 100">
              <Defs>
                <RadialGradient
                  id="moonGlow"
                  cx="50"
                  cy="50"
                  rx="50"
                  ry="50"
                  fx="50"
                  fy="50"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={color} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="50" fill="url(#moonGlow)" />
            </Svg>
          </Animated.View>
        )}

        {/* The Crescent Shape */}
        <View style={[styles.moonContainer, dynamicRotationStyle]}>
          <Svg height="100%" width="100%" viewBox="0 0 100 100">
             {/* 
                M 85,20 : Move to top tip
                A 45,45 0 1,0 85,80 : Outer arc to bottom
                A 35,35 0 1,1 85,20 : Inner arc back to top
             */}
             <Path
               d="M 85,20 A 45,45 0 1,0 85,80 A 35,35 0 1,1 85,20 Z"
               fill={color}
               fillOpacity="0.95"
               stroke={color}
               strokeWidth="0.5"
               strokeOpacity="0.3"
             />
          </Svg>
        </View>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    // top/right/width/height set dynamically
    zIndex: 0, 
  },
  moonContainer: {
    ...StyleSheet.absoluteFillObject,
    // rotation set dynamically
  }
});