import React from 'react';
import { Button } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/Theme';

interface NavButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: ThemeColors;
  isDesktop: boolean;
}

export const NavButton = ({ iconName, onPress, colors, isDesktop }: NavButtonProps) => (
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
      onPress();
    }} 
    pressStyle={{ opacity: 0.8 }}
  />
);

interface CategoryButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
}

export const CategoryButton = ({ label, isActive, onPress, colors }: CategoryButtonProps) => (
  <Button 
    size="$3" 
    br="$10"
    bg={isActive ? colors.cardBg : 'transparent'}
    color={isActive ? colors.accent : colors.textSecondary}
    onPress={onPress}
    chromeless={!isActive}
    pressStyle={{ opacity: 0.8 }}
    bw={1}
    bc={isActive ? colors.accent : 'transparent'}
    fontWeight={isActive ? "700" : "400"}
  >
    {label}
  </Button>
);
