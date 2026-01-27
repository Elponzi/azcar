import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button, Text, XStack, YStack } from 'tamagui';

import DivineLight from '@/components/DivineLight';
import { MicrophoneButton } from '@/components/MicrophoneButton';
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
  // Smart reading props
  isListening?: boolean;
  isAvailable?: boolean;
  hasPermission?: boolean | null;
  onToggleListening?: () => void;
  smartReadingEnabled?: boolean;
  // Debug
  debugTranscript?: string;
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
  t,
  isListening = false,
  isAvailable = false,
  hasPermission = null,
  onToggleListening,
  smartReadingEnabled = false,
  debugTranscript = '',
}: AzkarCounterProps) => {
  const colors = THEME[theme];
  const ringTrackColor = colors.cardBg;

  // Animation for Press and Completion
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const completionScale = useSharedValue(1);
  const glowOpacity = useSharedValue(1);

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * completionScale.value }],
    opacity: opacity.value,
  }));

 

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
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
    <YStack ai="center" space="$4">
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
                completionScale.value = withTiming(1.05, { duration: 150 }, () => {
                  completionScale.value = withTiming(1, { duration: 250 });
                });
                glowOpacity.value = withTiming(1.5, { duration: 150 }, () => {
                  glowOpacity.value = withTiming(1, { duration: 250 });
                });

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
          <Animated.View style={animatedScaleStyle}>
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

        {/* Microphone Button - Left side */}
        {smartReadingEnabled && isAvailable && onToggleListening && (
          <YStack
            position="absolute"
            bottom={-10}
            left={isDesktop ? -40 : -20}
          >
            <MicrophoneButton
              isListening={isListening}
              isAvailable={isAvailable}
              hasPermission={hasPermission}
              onPress={onToggleListening}
              colors={colors}
              isDesktop={isDesktop}
            />
          </YStack>
        )}

        {/* Reset Button - Right side */}
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

      {/* Debug: Speech Recognition Transcript */}
      {isListening && (
        <YStack
          bg={colors.cardBg}
          px="$4"
          py="$2"
          br="$4"
          maw={300}
          bw={1}
          bc={colors.accent}
        >
          <Text fontSize={10} color={colors.textSecondary} mb="$1">
            Speech Recognition:
          </Text>
          <Text
            fontSize={14}
            color={colors.textPrimary}
            textAlign="center"
            fontFamily="Amiri"
          >
            {debugTranscript || '(waiting for speech...)'}
          </Text>
        </YStack>
      )}
    </YStack>
  );
};