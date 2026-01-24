import React from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text, YStack, XStack, Button } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { ProgressRing } from '@/components/ProgressRing';
import DivineLight from '@/components/DivineLight';
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
  t 
}: AzkarCounterProps) => {
  const colors = THEME[theme];
  const ringTrackColor = colors.cardBg;

  // Animation for Press
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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

  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/2.mp3'),
        { shouldPlay: false }
      );
      
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });

      await sound.playAsync();
    } catch (e) {
      console.log('Error playing sound', e);
    }
  };

  return (
      <XStack ai="center" jc="center" position="relative">
        <Pressable 
          onPress={() => {
            if (Platform.OS !== 'web' && count < target) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onIncrement();
          }}
          onLongPress={() => {
            if (count >= target) {
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
                playSuccessSound();
              }
              onComplete();
            }
          }}
          delayLongPress={500}
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
                  {count}
                </Text>
                {count >= target ? (
                  <Text fontSize={isDesktop ? 16 : 14} color={colors.accent} fontWeight="600" zIndex={1} opacity={0.8}>
                    {t.hold}
                  </Text>
                ) : (
                  <Text fontSize={isDesktop ? 20 : 16} color={colors.textSecondary} zIndex={1}>/ {target}</Text>
                )}
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