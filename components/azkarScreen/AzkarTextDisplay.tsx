import { AzkarItem } from '@/constants/AzkarData';
import { THEME } from '@/constants/Theme';
import { removeTashkeel } from '@/utils';
import React from 'react';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Paragraph, ScrollView, Text, YStack } from 'tamagui';

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
    <YStack f={1} px="$6" pb="$0" pt={isDesktop ? "0" : "$10"} jc="center" ai="center" space="$4">
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
                lineHeight={fontSize * 1.6}
                textAlign="center" 
                color={colors.textPrimary}
                maw={isDesktop ? 800 : '100%'}
                textShadowColor={theme === 'dark' ? "unset" : 'transparent'}
                textShadowRadius={isDesktop ? 20 : 15}
                textShadowOffset={{ width: 0, height: 0 }}
              >
                {currentZeker.arabic}
              </Text>
            );
          })()}
              <YStack py="$2" ai="center" opacity={0.8}>
                <Text 
                  color={colors.accent} 
                  fontSize={24}
                  textShadowColor={theme === 'dark' ? colors.accent : 'transparent'}
                  textShadowRadius={15}
                  textShadowOffset={{ width: 0, height: 0 }}
                >
                  ❖
                </Text>
              </YStack>
              {showTranslation && (
              <Paragraph 
                fontFamily="Tajawal"
                mt="$1"
                fontSize={isDesktop ? 20 : 16} 
                lineHeight={isDesktop ? 32 : 26}
                color={colors.textDim} 
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
