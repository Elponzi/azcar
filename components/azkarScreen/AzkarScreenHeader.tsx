import React from 'react';
import { XStack, Button, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
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
  insetTop,
  onResetCategory,
  onCategoryChange,
  onOpenSettings,
  onOpenCategorySheet,
}: AzkarScreenHeaderProps) => (
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
        <Button
          size="$3"
          circular
          bg="transparent"
          color={colors.textSecondary}
          icon={<Ionicons name="refresh" size={20} color={colors.textSecondary} />}
          onPress={onResetCategory}
          hoverStyle={{ bg: colors.background }}
          animation="quick"
          enterStyle={{ opacity: 0, scale: 0.5 }}
          exitStyle={{ opacity: 0, scale: 0.5 }}
        />
      )}
    </XStack>

    {/* Desktop: Categories ScrollView / Mobile: Category Trigger */}
    {isDesktop ? (
      <DesktopCategoryNav
        categories={CATEGORIES}
        currentCategory={currentCategory}
        onCategoryChange={onCategoryChange}
        colors={colors}
        t={t}
        isRTL={isRTL}
      />
    ) : (
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
);
