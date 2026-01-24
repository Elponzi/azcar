import React from 'react';
import { ScrollView, Paragraph, Text, YStack } from 'tamagui';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { THEME } from '@/constants/Theme';
import { AzkarItem } from '@/constants/AzkarData';
import { removeTashkeel } from '@/utils';

interface AzkarTextDisplayProps {
  currentZeker: AzkarItem;
  showTranslation: boolean;
  isDesktop: boolean;
  theme: 'light' | 'dark';
}

export const AzkarTextDisplay = ({ currentZeker, showTranslation, isDesktop, theme }: AzkarTextDisplayProps) => {
  const colors = THEME[theme];

  // Dynamic Font Size
  const getDynamicFontSize = (text: string, translationVisible: boolean) => {
    const len = removeTashkeel(text).length;
    const boost = translationVisible ? 1 : 1.3; // 30% larger when translation is off

    if (len < 50) return (isDesktop ? 48 : 32) * boost;
    if (len < 100) return (isDesktop ? 36 : 24) * boost;
    if (len < 200) return (isDesktop ? 28 : 20) * boost;
    if (len < 300) return (isDesktop ? 24 : 18) * boost;
    return (isDesktop ? 20 : 18) * boost;
  };

  return (
    <YStack f={1} p="$6" jc="center" ai="center" space="$4">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          key={currentZeker.id}
          entering={FadeInDown.duration(600).springify()}
          exiting={FadeOutUp.duration(400)}
          style={{ alignItems: 'center', width: '100%' }}
        >
          {(() => {
            const fontSize = getDynamicFontSize(currentZeker.arabic, showTranslation);
            return (
              <Text 
                fontFamily="Amiri" 
                fontSize={fontSize} 
                textAlign="center" 
                color={colors.textPrimary}
                maw={isDesktop ? 800 : '100%'}
                shadowColor={colors.accent}
                shadowRadius={10}
                shadowOpacity={0.2}
              >
                {currentZeker.arabic}
              </Text>
            );
          })()}
          {showTranslation && (
            <Paragraph 
              mt="$4" 
              fontSize={isDesktop ? 18 : 14} 
              color={colors.textSecondary} 
              textAlign="center"
              maw={600}
            >
              {currentZeker.translation}
            </Paragraph>
          )}
        </Animated.View>
      </ScrollView>
    </YStack>
  );
};
