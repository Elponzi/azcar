import React, { useEffect, useRef } from 'react';
import { Button } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing } from 'react-native';
import { ThemeColors } from '@/constants/Theme';

interface NavButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: ThemeColors;
  isDesktop: boolean;
  disabled?: boolean;
}

export const NavButton = ({ iconName, onPress, colors, isDesktop, disabled }: NavButtonProps) => (
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

interface SmartReadingButtonProps {
  isActive: boolean;
  onToggle: () => void;
  colors: ThemeColors;
  isDesktop: boolean;
}

export const SmartReadingButton = ({ isActive, onToggle, colors, isDesktop }: SmartReadingButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isActive) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          })
        ])
      );
      animation.start();
    } else {
      scale.setValue(1);
      scale.stopAnimation();
    }

    return () => {
       if (animation) animation.stop();
       scale.stopAnimation();
    };
  }, [isActive]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Button 
        size="$6" 
        circular 
        bg={isActive ? colors.accent : colors.cardBg}
        borderWidth={isDesktop && !isActive ? 1 : 0}
        borderColor={colors.borderColor}
        elevation={0}
        shadowOpacity={0}
        color={isActive ? '#FFFFFF' : colors.textPrimary}
        icon={<Ionicons name={isActive ? "mic" : "mic-outline"} size={32} color={isActive ? '#FFFFFF' : colors.textPrimary} />} 
        onPress={onToggle}
        hoverStyle={{ bg: isActive ? colors.accent : colors.accentDim }}
      />
    </Animated.View>
  );
};

interface CategoryButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDesktop?: boolean;
}

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
