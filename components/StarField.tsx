import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  withSequence
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const STAR_COUNT = 10;
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
        // No rotation needed for this character
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
          textShadowRadius: 8, // Creates the glow/divine light effect
        }
      ]} 
    >
      ✦
    </AnimatedText>
  );
};

// Memoize the individual star to prevent re-renders of the list items
const Star = React.memo(StarComponent);

interface StarFieldProps {
  color?: string;
}

const StarFieldComponent = ({ color = '#FFD700' }: StarFieldProps) => {
  // Memoize the star data so it doesn't recalculate on every render
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: (Math.random() * (height * 0.4)) + (height * 0.2), // Position between 20% and 60% of screen height
      size: Math.random() * 6 + 8, // Range 8px to 14px for visibility
      delay: Math.random() * 2000,
      duration: Math.random() * 3000 + 2000,
    }));
  }, []);

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
    </View>
  );
};

// Memoize the entire field so it ignores parent re-renders (like counter updates)
export default React.memo(StarFieldComponent);

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    includeFontPadding: false, // Helps center the character vertically
    textAlignVertical: 'center',
  },
});
