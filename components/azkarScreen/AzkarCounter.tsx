import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { memo, useMemo } from "react";
import { Platform, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Text, XStack, YStack } from "tamagui";

import DivineLight from "@/components/DivineLight";
import { ProgressRing } from "@/components/ProgressRing";
import { THEME } from "@/constants/Theme";

interface AzkarCounterProps {
  count: number;
  target: number;
  progress: number;
  onIncrement: () => void;
  onReset: () => void;
  onZekerComplete: () => void;
  theme: "light" | "dark";
  isDesktop: boolean;
  language: "en" | "ar";
  t: any;
}

const ResetButton = ({
  onReset,
  colors,
  isDesktop,
}: {
  onReset: () => void;
  colors: any;
  isDesktop: boolean;
}) => (
  <Pressable
    onPress={onReset}
    style={({ pressed }) => ({
      position: "absolute" as const,
      bottom: -10,
      right: isDesktop ? -40 : -20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBg,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      opacity: pressed ? 0.5 : 1,
    })}
  >
    <Ionicons name="refresh" size={20} color={colors.textSecondary} />
  </Pressable>
);

export const AzkarCounter = memo(
  ({
    count,
    target,
    progress,
    onIncrement,
    onReset,
    onZekerComplete,
    theme,
    isDesktop,
    language,
    t,
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

    const remaining = Math.max(target - count, 0);

    const timesLabel = useMemo(() => {
      if (language === "ar") {
        if (remaining === 2) {
          return t.times2;
        }
        return remaining > 1 && remaining <= 10 ? t.times : t.time;
      }
      return target === 1 ? t.time : t.times;
    }, [t, language, remaining]);

    return (
      <XStack ai="center" jc="center" position="relative">
        <Pressable
          onPress={() => {
            if (count < target) {
              const isCompleting = count + 1 >= target;

              if (Platform.OS !== "web") {
                if (isCompleting) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  ); // Stronger haptic
                } else {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }

              onIncrement();

              if (isCompleting) {
                // Trigger Celebration Animation
                completionScale.value = withTiming(
                  1.05,
                  { duration: 150 },
                  () => {
                    completionScale.value = withTiming(1, { duration: 250 });
                  },
                );
                glowOpacity.value = withTiming(1.5, { duration: 150 }, () => {
                  glowOpacity.value = withTiming(1, { duration: 250 });
                });

                onZekerComplete();
              }
            }
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ alignItems: "center", justifyContent: "center" }}
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
                <DivineLight
                  color={colors.accent}
                  size={isDesktop ? 320 : 240}
                />
                <Text
                  fontSize={isDesktop ? 72 : 56}
                  fontFamily="ReemKufi"
                  color={progress >= 100 ? colors.accent : colors.textPrimary}
                  zIndex={1}
                >
                  {remaining}
                </Text>
                <YStack ai="center" zIndex={1}>
                  <Text
                    fontSize={isDesktop ? 14 : 12}
                    color={colors.textSecondary}
                    opacity={0.7}
                    mt={-2}
                  >
                    {timesLabel}
                  </Text>
                </YStack>
              </YStack>
            </ProgressRing>
          </Animated.View>
        </Pressable>

        {count > 0 && (
          <ResetButton
            onReset={onReset}
            colors={colors}
            isDesktop={isDesktop}
          />
        )}
      </XStack>
    );
  },
);