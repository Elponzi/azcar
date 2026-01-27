import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef } from 'react';
import { Platform, Pressable, Animated, Easing } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import DivineLight from '@/components/DivineLight';
import { ProgressRing } from '@/components/ProgressRing';
import { THEME } from '@/constants/Theme';

interface AzkarCounterProps {
  count: number;
  target: number;
  progress: number;
  onIncrement: () => void;
  onReset: () => void;
  onComplete: () => void;
  theme: 'light' | 'dark';
  isDesktop: boolean;
  language: 'en' | 'ar';
  t: any;
}

export const AzkarCounter = ({ 
  count, 
  target, 
  progress, 
  onIncrement, 
  onReset, 
  onComplete, 
  theme, 
  isDesktop,
  language,
  t 
}: AzkarCounterProps) => {
  const colors = THEME[theme];
  const ringTrackColor = colors.cardBg;

  // Animation for Press and Completion
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const completionScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current; // Default 0 for glow

  const handlePressIn = () => {
    Animated.parallel([
        Animated.timing(scale, { toValue: 0.98, duration: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.9, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
  };

  const player = useAudioPlayer(require('@/assets/sounds/switch.mp3'));

  const playSuccessSound = () => {
    player.seekTo(0);
    player.play();
  };

  const remaining = Math.max(target - count, 0);

  const timesLabel = useMemo(() => {
    if (language === 'ar') {
      if(remaining === 2) {
        return t.times2;
      }
      return (remaining > 1 && remaining <= 10) ? t.times : t.time;
    }
    return target === 1 ? t.time : t.times;
  }, [t, language, remaining])

  return (
      <XStack ai="center" jc="center" position="relative">
        <Pressable 
          onPress={() => {
            if (count < target) {
              const isCompleting = count + 1 >= target;
              
              if (Platform.OS !== 'web') {
                 if (isCompleting) {
                   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Stronger haptic
                   playSuccessSound();
                 } else {
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 }
              }

              onIncrement();

              if (isCompleting) {
                // Trigger Celebration Animation
                Animated.sequence([
                    Animated.timing(completionScale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
                    Animated.timing(completionScale, { toValue: 1, duration: 250, useNativeDriver: true })
                ]).start();

                Animated.sequence([
                    Animated.timing(glowOpacity, { toValue: 1.5, duration: 150, useNativeDriver: true }),
                    Animated.timing(glowOpacity, { toValue: 0, duration: 250, useNativeDriver: true })
                ]).start();

                setTimeout(() => {
                  onComplete();
                }, 400); // Slightly longer delay to let animation peak
              }
            }
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <Animated.View style={{ 
              transform: [
                  { scale: Animated.multiply(scale, completionScale) } // Combine scales
              ], 
              opacity 
          }}>
            <ProgressRing 
                radius={isDesktop ? 140 : 90} 
                stroke={6} 
                progress={progress} 
                color={colors.accent}
                bgColor={ringTrackColor} 
            >
              <YStack ai="center" jc="center" position="relative">
                  <DivineLight color={colors.accent} size={isDesktop ? 320 : 240} />
                <Text fontSize={isDesktop ? 72 : 56} fontFamily="ReemKufi" color={progress >= 100 ? colors.accent : colors.textPrimary} zIndex={1}>
                  {remaining}
                </Text>
                <YStack ai="center" zIndex={1}>
                  <Text fontSize={isDesktop ? 14 : 12} color={colors.textSecondary} opacity={0.7} mt={-2}>
                    {timesLabel}
                  </Text>
                </YStack>
              </YStack>
            </ProgressRing>
          </Animated.View>
        </Pressable>

        {count > 0 && (
          <Button 
            size="$3" 
            circular 
            bg={colors.cardBg}
            color={colors.textSecondary}
            icon={<Ionicons name="refresh" size={20} color={colors.textSecondary} />} 
            onPress={onReset}
            position="absolute"
            bottom={-10}
            right={isDesktop ? -40 : -20}
            elevation={0}
            hoverStyle={{ bg: colors.accentDim }}
            pressStyle={{ bg: colors.accentDim }}
          />
        )}
      </XStack>
  );
};