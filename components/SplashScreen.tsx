import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { View, YStack, Text } from 'tamagui';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay, 
  runOnJS,
  Easing,
  FadeOut
} from 'react-native-reanimated';
import StarField from '@/components/StarField';
import { CrescentMoon } from '@/components/CrescentMoon';
import { THEME } from '@/constants/Theme';

interface PremiumSplashScreenProps {
  onAnimationComplete: () => void;
  minDuration?: number; // Minimum time to show splash
}

export const PremiumSplashScreen = ({ onAnimationComplete, minDuration = 3000 }: PremiumSplashScreenProps) => {
  const { width, height } = useWindowDimensions();
  // Force dark theme colors for splash to maintain premium "night" feel regardless of system theme
  const colors = THEME.dark; 

  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    // 1. Entrance Animation
    scale.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) });
    
    textOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    textTranslateY.value = withDelay(500, withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) }));

    // 2. Exit Sequence
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 800 }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      });
    }, minDuration);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: colors.background }, containerStyle]}>
      {/* Background Effects */}
      <View style={StyleSheet.absoluteFill}>
        <StarField forceTheme="dark" />
      </View>

      {/* Main Content */}
      <YStack f={1} ai="center" jc="center" gap="$6" zIndex={10}>
        
        {/* Centered Logo Composition */}
        <Animated.View style={logoStyle}>
           <View width={200} height={200} ai="center" jc="center">
              <CrescentMoon 
                forceTheme="dark" 
                size={150} 
                color={colors.accent}
                style={{
                  width: 150,
                  height: 150,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
           </View>
        </Animated.View>

        {/* Text Branding */}
        <Animated.View style={textStyle}>
          <YStack ai="center" gap="$2">
            <Text 
              fontFamily="Amiri" 
              fontSize={56} 
              color={colors.textPrimary}
              textShadowColor={colors.accentGlow}
              textShadowRadius={15}
              textAlign="center"
            >
              أذكار درايف
            </Text>
            <Text 
              fontFamily="Tajawal" 
              fontSize={20} 
              color={colors.textSecondary} 
              letterSpacing={1}
              opacity={0.8}
              textAlign="center"
              fontWeight="600"
            >
              رفيقك في الطريق
            </Text>
            <View h={20} />
            <Text 
              fontFamily="Tajawal" 
              fontSize={14} 
              color={colors.textDim} 
              letterSpacing={2}
              opacity={0.6}
            >
              AZKAR DRIVE
            </Text>
          </YStack>
        </Animated.View>
      </YStack>

      {/* Footer / Copyright */}
      <Animated.View style={[styles.footer, textStyle]}>
        <Text fontFamily="Tajawal" fontSize={12} color={colors.textDim}>
          v1.0.0
        </Text>
      </Animated.View>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 9999,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  }
});
