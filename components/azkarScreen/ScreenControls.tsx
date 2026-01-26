import React from 'react';
import { Button } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
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
