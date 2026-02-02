import { THEME } from '@/constants/Theme';
import { AzkarItem } from '@/data';
import { removeTashkeel, normalizeArabic, tokenizeArabicText } from '@/utils';
import React, { useMemo, memo, useEffect } from 'react';
import Animated, { FadeInDown, FadeOutUp, useSharedValue, useAnimatedStyle, withTiming, interpolateColor, withDelay } from 'react-native-reanimated';
import { Paragraph, ScrollView, Text, YStack } from 'tamagui';

interface AzkarTextDisplayProps {
  currentZeker: AzkarItem;
  showTranslation: boolean;
  showNote: boolean;
  isDesktop: boolean;
  theme: 'light' | 'dark';
  activeWordIndex?: number;
}

// Create Animated version of Tamagui Text
const AnimatedText = Animated.createAnimatedComponent(Text);

// Helper to apply opacity to hex color
const withOpacity = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const AzkarWord = memo(({ 
  word, 
  status, 
  textPrimary,
  accent,
  accentGlow
}: { 
  word: string, 
  status: 'read' | 'current' | 'upcoming', 
  textPrimary: string,
  accent: string,
  accentGlow: string
}) => {
  // State representation: 0 = Upcoming, 1 = Current, 2 = Read
  const progress = useSharedValue(0);

  // Pre-calculate colors on JS thread to avoid worklet issues with helper functions
  const upcomingColor = useMemo(() => withOpacity(textPrimary, 0.6), [textPrimary]);
  const currentColor = accent;
  const readColor = textPrimary;
  const glowColorVal = accentGlow;

  useEffect(() => {
    if (status === 'upcoming') {
      progress.value = withTiming(0, { duration: 300 });
    } else if (status === 'current') {
      progress.value = withTiming(1, { duration: 150 }); 
    } else if (status === 'read') {
      progress.value = withTiming(2, { duration: 800 }); 
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1, 2],
      [upcomingColor, currentColor, readColor]
    );

    const shadowOpacity = 1 - Math.abs(progress.value - 1); 
    const shadowRadius = shadowOpacity * 10;
    
    const glowColor = interpolateColor(
        progress.value,
        [0.8, 1, 1.2], 
        ['transparent', glowColorVal, 'transparent']
    );

    return {
      color,
      textShadowRadius: shadowRadius,
      textShadowColor: glowColor,
    };
  });

  return (
    <AnimatedText
      style={animatedStyle}
      textShadowOffset={{ width: 0, height: 0 }}
      fontFamily="Amiri"
    >
      {word}{' '}
    </AnimatedText>
  );
});

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
    // 1. Split by newlines to preserve explicit line breaks
    const segments = currentZeker.arabic.split(/(\n)/g);
    let counter = 0;
    const result: { word: string, logicalIndex: number, isNewline: boolean }[] = [];

    segments.forEach(segment => {
      if (segment === '\n') {
        result.push({ word: '\n', logicalIndex: -1, isNewline: true });
      } else {
        // 2. Split segments by other whitespace
        const segmentWords = tokenizeArabicText(segment); // Use helper!
        segmentWords.forEach(word => {
           if (!word) return;
           const normalized = normalizeArabic(word);
           const isValid = normalized.length > 0;
           const logicalIndex = isValid ? counter++ : Math.max(0, counter - 1);
           result.push({ word, logicalIndex, isNewline: false });
        });
      }
    });
    
    return result;
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
          {currentZeker.prefix && (
            <Text
              fontFamily="Amiri"
              fontSize={isDesktop ? 20 : 16}
              lineHeight={isDesktop ? 32 : 26}
              textAlign="center"
              color={colors.textSecondary}
              mb="$3"
              maw={isDesktop ? 800 : '100%'}
            >
              {currentZeker.prefix}
            </Text>
          )}
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
                   <Text fontFamily="Amiri" color={colors.textPrimary}>{currentZeker.arabic}</Text>
                ) : (
                   wordsWithLogicalIndex.map((item, index) => {
                     if (item.isNewline) {
                        return <Text key={`nl-${index}`}>{'\n'}</Text>;
                     }

                     let status: 'read' | 'current' | 'upcoming' = 'upcoming';

                     if (item.logicalIndex < activeWordIndex) {
                        status = 'read';
                     }
                     else if (item.logicalIndex === activeWordIndex) status = 'current';

                     return (
                       <AzkarWord
                         key={`${currentZeker.id}-${index}`}
                         word={item.word}
                         status={status}
                         textPrimary={colors.textPrimary}
                         accent={colors.accent}
                         accentGlow={colors.accentGlow}
                       />
                     );
                   })
                )}
              </Text>
            );
          })()}
          {currentZeker.postfix && (
            <Text
              fontFamily="Amiri"
              fontSize={isDesktop ? 14 : 12}
              lineHeight={isDesktop ? 22 : 18}
              textAlign="center"
              color={colors.textDim}
              mt="$2"
              opacity={0.75}
              maw={isDesktop ? 800 : '100%'}
            >
              [ {currentZeker.postfix} ]
            </Text>
          )}
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
