import { THEME } from '@/constants/Theme';
import { AzkarItem } from '@/data';
import { removeTashkeel, normalizeArabic } from '@/utils';
import React, { useMemo } from 'react';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Paragraph, ScrollView, Text, YStack } from 'tamagui';

interface AzkarTextDisplayProps {
  currentZeker: AzkarItem;
  showTranslation: boolean;
  showNote: boolean;
  isDesktop: boolean;
  theme: 'light' | 'dark';
  activeWordIndex?: number;
}

export const AzkarTextDisplay = ({ currentZeker, showTranslation, showNote, isDesktop, theme, activeWordIndex = -1 }: AzkarTextDisplayProps) => {
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

  // Map visual words to logical indices (skipping punctuation)
  const wordsWithLogicalIndex = useMemo(() => {
    const rawWords = currentZeker.arabic.split(/\s+/).filter(Boolean);
    let counter = 0;
    
    return rawWords.map((word) => {
      const normalized = normalizeArabic(word);
      const isValid = normalized.length > 0;
      // If valid word, use current counter and increment.
      // If punctuation (invalid), attach to previous word (counter - 1).
      const logicalIndex = isValid ? counter++ : Math.max(0, counter - 1);
      
      return { word, logicalIndex };
    });
  }, [currentZeker.arabic]);

  return (
    <YStack f={1} px="$6" pb="$0" pt={isDesktop ? "0" : "$4"} jc="center" ai="center" space="$4">
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
                lineHeight={fontSize * 1.8}
                textAlign="center"
                maw={isDesktop ? 800 : '100%'}
                textShadowColor={theme === 'dark' ? "unset" : 'transparent'}
                textShadowRadius={0}
                textShadowOffset={{ width: 0, height: 0 }}
              >
                {activeWordIndex === -1 ? (
                   // Default rendering
                   <Text fontFamily="Amiri" color={colors.textPrimary}>{currentZeker.arabic}</Text>
                ) : (
                   // Word-by-word rendering
                   wordsWithLogicalIndex.map((item, index) => {
                     const isRead = item.logicalIndex < activeWordIndex;
                     const isCurrent = item.logicalIndex === activeWordIndex;
                     
                     return (
                       <Text
                         key={`${currentZeker.id}-${index}`}
                         color={isCurrent ? colors.accent : colors.textPrimary}
                         opacity={isRead ? 1 : (isCurrent ? 1 : 0.8)}
                         textShadowRadius={isCurrent ? 10 : 0}
                         textShadowColor={isCurrent ? colors.accentGlow : 'transparent'}
                         fontFamily="Amiri"
                      >
                         {item.word}{' '}
                       </Text>
                     );
                   })
                )}
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

          {showNote && currentZeker.note && (
            <Text
              fontFamily="Tajawal"
              mt="$4"
              fontSize={isDesktop ? 15 : 13}
              lineHeight={isDesktop ? 24 : 20}
              color={colors.textSecondary}
              textAlign="center"
              fontStyle="italic"
              maw={550}
              opacity={0.85}
            >
              ✦ {currentZeker.note}
            </Text>
          )}

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
