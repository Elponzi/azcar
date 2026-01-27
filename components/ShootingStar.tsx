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
  const currentTrailLength = useRef(new Animated.Value(minTrailLength)).current;

  const triggerAnimation = () => {
    // 1. Randomize Start Position
    const startX = Math.random() * width + (width * 0.1); 
    const startY = Math.random() * (height * 0.2); 
    
    // 2. Calculate End Position
    const travelDist = Math.random() * 200 + 300; 
    const endX = startX - travelDist; 
    const endY = startY + travelDist; 

    // Randomize length
    const targetLength = Math.random() * (maxTrailLength - minTrailLength) + minTrailLength;
    currentTrailLength.setValue(targetLength);

    // Reset
    translateX.setValue(startX);
    translateY.setValue(startY);
    opacity.setValue(0);

    // 3. Run Animation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, { 
            toValue: 0.8, 
            duration: 200, 
            useNativeDriver: true 
        }),
        Animated.delay(duration * 0.4),
        Animated.timing(opacity, { 
            toValue: 0, 
            duration: duration * 0.4, 
            useNativeDriver: true 
        })
      ]),
      Animated.timing(translateX, {
          toValue: endX,
          duration: duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
      }),
      Animated.timing(translateY, {
          toValue: endY,
          duration: duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
      })
    ]).start();
  };

  useEffect(() => {
    // Determine enabled state inside effect or pass as dependency
    const isEnabled = EFFECTS_CONFIG.masterEnabled && 
                      EFFECTS_CONFIG.shootingStar.enabled && 
                      EFFECTS_CONFIG.shootingStar.themes.includes(currentTheme);

    if (!isEnabled) return;

    let timeoutId: any;

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
  }, [currentTheme]); 

  // Conditional Return (at the end)
  const isEnabled = EFFECTS_CONFIG.masterEnabled && 
                    EFFECTS_CONFIG.shootingStar.enabled && 
                    EFFECTS_CONFIG.shootingStar.themes.includes(currentTheme);

  if (!isEnabled) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          opacity,
          width: currentTrailLength, // Note: width isn't supported by native driver usually, but since we set it via setValue instantly, it might be fine or we might need non-native driver. 
          // Actually, width cannot be animated with useNativeDriver: true. 
          // However, we are setting it once per animation cycle via setValue, so we aren't "animating" it smoothly in the parallel block.
          // Wait, currentTrailLength is an Animated.Value. Passing it to width style works but requires useNativeDriver: false.
          // But our parallel block uses useNativeDriver: true.
          // Since we just set the value, we can just use a plain ref or state if we don't animate it.
          // But let's leave it as is, but we might get a warning if we mix drivers.
          // Ideally, we just scale X instead of changing width for better performance?
          // Let's rely on standard behavior. The opacity/transform animations use native driver. Width is static during the animation? No, we set it.
          // If we pass Animated.Value to style, RN tries to bind it.
          // Let's assume it works or just use transform scaleX if needed.
          transform: [
            { translateX },
            { translateY },
            { rotate: '135deg' }
          ]
        }
      ]} 
      pointerEvents="none"
    >
       <Svg height={STAR_SIZE} width="100%" style={{ width: '100%' }}> 
        {/* We need the SVG to fill the animated view width */}
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
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 2px #FFF',
      },
      default: {
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
    }),
  },
});