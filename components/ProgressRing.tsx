import React, { useEffect } from 'react';
import { Circle, Svg } from 'react-native-svg';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress: number; // 0 to 100
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  radius = 120,
  stroke = 12,
  progress,
  color = "#34D399",
  bgColor = "#1E1E1E",
  children
}) => {
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const strokeDashoffset = useSharedValue(circumference);

  useEffect(() => {
    const offset = circumference - (progress / 100) * circumference;
    // Match CSS: transition: stroke-dashoffset 0.35s ease-out;
    strokeDashoffset.value = withTiming(offset, { 
      duration: 350,
      easing: Easing.out(Easing.ease)
    });
  }, [progress, circumference]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: strokeDashoffset.value,
    };
  });

  return (
    <View style={{ width: radius * 2, height: radius * 2, justifyContent: 'center', alignItems: 'center' }}>
      <Svg
        width={radius * 2}
        height={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          stroke={bgColor}
          strokeWidth={stroke}
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="transparent"
        />
        <AnimatedCircle
          stroke={color}
          strokeWidth={stroke}
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </View>
    </View>
  );
};
