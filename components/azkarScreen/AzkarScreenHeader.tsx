import React, { useState, useEffect } from 'react';
import { Pressable, Platform, TouchableWithoutFeedback } from 'react-native';
import { XStack, YStack, Button, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ThemeColors } from '@/constants/Theme';
import { AzkarCategory } from '@/data/types';
import { CATEGORIES } from '@/data';
import { DesktopCategoryNav } from './DesktopCategoryNav';

interface AzkarScreenHeaderProps {
  isDesktop: boolean;
  isRTL: boolean;
  colors: ThemeColors;
  t: any;
  currentCategory: AzkarCategory;
  hasCategoryProgress: boolean;
  currentZekrIndex: number;
  totalAzkar: number;
  insetTop: number;
  onResetCategory: () => void;
  onCategoryChange: (cat: AzkarCategory) => void;
  onOpenSettings: () => void;
  onOpenCategorySheet: () => void;
}

export const AzkarScreenHeader = ({
  isDesktop,
  isRTL,
  colors,
  t,
  currentCategory,
  hasCategoryProgress,
  currentZekrIndex,
  totalAzkar,
  insetTop,
  onResetCategory,
  onCategoryChange,
  onOpenSettings,
  onOpenCategorySheet,
}: AzkarScreenHeaderProps) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onResetCategory();
  };

  return (
    <>
      <XStack
        pt={isDesktop ? '$6' : insetTop + 30}
        pb={isDesktop ? '$6' : '$3'}
        px="$4"
        ai="center"
        jc="space-between"
        bbw={isDesktop ? 1 : 0}
        bbc={colors.borderColor}
        fd={isRTL ? 'row-reverse' : 'row'}
        zIndex={10}
        minHeight={isDesktop ? 100 : 'auto'}
      >
        {/* Reset Button / Left Spacer */}
        <XStack w={40} jc="flex-start">
          {hasCategoryProgress && (
            <Pressable
              onPress={() => setShowResetConfirm(true)}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center' as const,
                justifyContent: 'center' as const,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </XStack>

        {/* Desktop: Categories ScrollView / Mobile: Category Trigger */}
        {isDesktop ? (
          <XStack ai="center" gap="$3">
            <DesktopCategoryNav
              categories={CATEGORIES}
              currentCategory={currentCategory}
              onCategoryChange={onCategoryChange}
              colors={colors}
              t={t}
              isRTL={isRTL}
            />
            <XStack bg={colors.accentDim} px="$2" py="$1" br="$10" ai="center">
              <Text fontSize={12} fontWeight="700" color={colors.accent}>
                {currentZekrIndex + 1}/{totalAzkar}
              </Text>
            </XStack>
          </XStack>
        ) : (
          <XStack ai="center" gap="$2" fd={isRTL ? 'row-reverse' : 'row'}>
            <Button
              chromeless
              onPress={onOpenCategorySheet}
              iconAfter={<Ionicons name="chevron-down" size={16} color={colors.accent} />}
              pressStyle={{ opacity: 0.6 }}
            >
              <Text fontSize={18} fontWeight="700" color={colors.accent}>
                {(() => {
                  const key = (currentCategory.charAt(0).toLowerCase() + currentCategory.slice(1)) as keyof typeof t;
                  const label = t[key] || currentCategory;
                  return isRTL ? `${t.adhkar} ${label}` : `${label} ${t.adhkar}`;
                })()}
              </Text>
            </Button>
            <XStack bg={colors.accentDim} px="$2" py="$1" br="$10" ai="center">
              <Text fontSize={11} fontWeight="700" color={colors.accent}>
                {currentZekrIndex + 1}/{totalAzkar}
              </Text>
            </XStack>
          </XStack>
        )}

        {/* Settings Button */}
        <XStack w={40} jc="flex-end">
          <Button
            size="$3"
            circular
            bg="transparent"
            color={colors.textSecondary}
            icon={<Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />}
            onPress={onOpenSettings}
            hoverStyle={{ bg: colors.background }}
          />
        </XStack>
      </XStack>

      <ResetConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        colors={colors}
        t={t}
      />
    </>
  );
};

const ResetConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  colors,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  colors: ThemeColors;
  t: any;
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isOpen) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.back(1.5)),
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [isOpen]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isOpen && opacity.value === 0) return null;

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={10000}
      jc="center"
      ai="center"
      pointerEvents={isOpen ? 'auto' : 'none'}
      px="$4"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
            },
            backdropStyle,
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View style={[{ width: '100%', maxWidth: 320 }, contentStyle]}>
        <YStack
          bg={colors.modalBg}
          p="$6"
          br="$6"
          gap="$5"
          ai="center"
          bc={colors.borderColor}
          bw={1}
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 10 }}
          shadowOpacity={0.25}
          shadowRadius={20}
          elevation={10}
        >
          <YStack
            bg={colors.cardBg}
            p="$4"
            br={100}
            bc={colors.borderColor}
            bw={1}
          >
            <Ionicons name="refresh-circle" size={36} color={colors.danger} />
          </YStack>

          <Text fontSize={17} fontWeight="700" color={colors.textPrimary} textAlign="center">
            {t.resetAllProgress}
          </Text>

          <XStack gap="$3" w="100%">
            <Button
              f={1}
              size="$4"
              br="$4"
              bg={colors.cardBg}
              color={colors.textSecondary}
              bw={1}
              bc={colors.borderColor}
              onPress={onClose}
              pressStyle={{ opacity: 0.8 }}
              fontWeight="600"
            >
              {t.cancel}
            </Button>
            <Button
              f={1}
              size="$4"
              br="$4"
              bg={colors.danger}
              color="#fff"
              fontWeight="700"
              onPress={onConfirm}
              pressStyle={{ opacity: 0.8 }}
            >
              {t.confirmReset}
            </Button>
          </XStack>
        </YStack>
      </Animated.View>
    </YStack>
  );
};
