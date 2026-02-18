import React, { useEffect } from 'react';
import { Button, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { ThemeColors } from '@/constants/Theme';
import { useAzkarStore } from '@/store/azkarStore';

interface NavButtonProps {
  iconName: 'chevron-back' | 'chevron-forward';
  onPress: () => void;
  colors: ThemeColors;
  isDesktop: boolean;
  disabled?: boolean;
}

export const NavButton = ({ iconName, onPress, colors, isDesktop, disabled }: NavButtonProps) => {


  return (
    <Button 
      size="$6" 
      circular 
      bg={colors.cardBg}
      borderWidth={isDesktop ? 1 : 0}
      borderColor={colors.borderColor}
      elevation={0}
      shadowOpacity={0}
      color={colors.textPrimary}
      icon={<Ionicons name={iconName} size={32} color={colors.textPrimary} />} 
      onPress={() => {
        if (!disabled) onPress();
      }}
      
      disabled={disabled}
      opacity={disabled ? 0.3 : 1}
      pressStyle={{ opacity: disabled ? 0.3 : 0.8 }}
    />
  );
};

interface CategoryButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDesktop?: boolean;
}

interface MicButtonProps {
  isListening: boolean;
  onPress: () => void;
  colors: ThemeColors;
  label: string;
}

export const MicButton = ({ isListening, onPress, colors, label }: MicButtonProps) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1.0, { duration: 800 }),
        ),
        -1,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={pulseStyle}>
      <Button
        size="$3.5"
        bg={isListening ? colors.accent : colors.cardBg}
        borderColor={isListening ? colors.accent : colors.borderColor}
        borderWidth={1}
        br="$10"
        pressStyle={{ opacity: 0.8, scale: 0.96 }}
        hoverStyle={{
          bg: isListening ? colors.accent : colors.accentDim,
          borderColor: colors.accent
        }}
        onPress={onPress}
        icon={<Ionicons name={isListening ? "mic-off" : "mic-outline"} size={18} color={isListening ? colors.background : colors.textPrimary} />}
        space="$2"
        animation="quick"
        elevation={isListening ? "$2" : "$0"}
      >
        <Text
          color={isListening ? colors.background : colors.textPrimary}
          fontSize={13}
          fontWeight="600"
        >
          {label}
        </Text>
      </Button>
    </Animated.View>
  );
};

export const CategoryButton = ({ label, isActive, onPress, colors, isDesktop }: CategoryButtonProps) => (
  <Button 
    size={isDesktop ? "$4" : "$3"} 
    br="$10"
    bg={isActive ? colors.accentDim : 'transparent'}
    color={isActive ? colors.accent : colors.textSecondary}
    onPress={onPress}
    chromeless={!isActive && !isDesktop}
    pressStyle={{ opacity: 0.8, scale: 0.97 }}
    hoverStyle={isDesktop ? { 
      bg: colors.accentDim,
      bc: colors.accent,
      scale: 1.02,
    } : undefined}
    bw={1}
    bc={isActive ? colors.accent : (isDesktop ? colors.borderColor : 'transparent')}
    fontWeight={isActive ? "700" : "500"}
    px={isDesktop ? "$5" : "$3"}
    animation="bouncy"
  >
    {label}
  </Button>
);