import React, { useEffect, useRef } from 'react';
import { Circle, Svg } from 'react-native-svg';
import { View, Animated, Easing } from 'react-native';

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
  
  const strokeDashoffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    const offset = circumference - (progress / 100) * circumference;
    Animated.timing(strokeDashoffset, { 
      toValue: offset,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false // SVG props often require JS driver
    }).start();
  }, [progress, circumference]);

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
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </View>
    </View>
  );
};
