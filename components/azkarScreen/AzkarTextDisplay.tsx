import { THEME } from '@/constants/Theme';
import { AzkarItem } from '@/data';
import { useAzkarStore } from '@/store/azkarStore';
import { removeTashkeel, normalizeArabic } from '@/utils';
import React, { useMemo, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Paragraph, ScrollView, Text, YStack } from 'tamagui';

interface AzkarTextDisplayProps {
  currentZeker: AzkarItem;
  showTranslation: boolean;
  showNote: boolean;
  isDesktop: boolean;
  theme: 'light' | 'dark';
}

export const AzkarTextDisplay = ({ currentZeker, showTranslation, showNote, isDesktop, theme }: AzkarTextDisplayProps) => {
  const colors = THEME[theme];
  const { activeWordIndex, isSmartReadingEnabled } = useAzkarStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1))
    }).start();
  }, [currentZeker.id]);

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

  const renderedArabicText = useMemo(() => {
    const fontSize = getDynamicFontSize(currentZeker.arabic, showTranslation);
    
    if (!isSmartReadingEnabled) {
      return (
        <Text
          fontFamily="Amiri"
          fontSize={fontSize}
          lineHeight={fontSize * 1.8}
          textAlign="center"
          color={colors.textPrimary}
          maw={isDesktop ? 800 : '100%'}
          textShadowColor={theme === 'dark' ? "unset" : 'transparent'}
          textShadowRadius={0}
          textShadowOffset={{ width: 0, height: 0 }}
        >
          {currentZeker.arabic}
        </Text>
      );
    }

    const words = currentZeker.arabic.split(/\s+/);
    let validWordCount = 0;

    return (
        <Text
          fontFamily="Amiri"
          fontSize={fontSize}
          lineHeight={fontSize * 1.8}
          textAlign="center"
          color={colors.textPrimary}
          maw={isDesktop ? 800 : '100%'}
        >
          {words.map((word, index) => {
             const isValid = normalizeArabic(word).length > 0;
             const effectiveIndex = validWordCount;
             
             if (isValid) {
                 validWordCount++;
             }

             const isHighlighted = effectiveIndex < activeWordIndex;
             // Only underline if it is a VALID word AND matches the current index
             const isCurrent = isValid && effectiveIndex === activeWordIndex;
             
             // Styles
             const highlightColor = isHighlighted ? (theme === 'dark' ? '#FFD700' : '#d97706') : colors.textPrimary;
             const textDecorationLine = isCurrent ? 'underline' : 'none';
             const opacity = isCurrent ? 1 : (isHighlighted ? 1 : 0.8); // Slight fade for upcoming words

             return (
               <Text 
                 key={index} 
                 color={highlightColor}
                 textDecorationLine={textDecorationLine}
                 opacity={opacity}
               >
                 {word}{' '}
               </Text>
             );
          })}
        </Text>
    );

  }, [currentZeker.arabic, showTranslation, isDesktop, theme, colors, isSmartReadingEnabled, activeWordIndex]);

  return (
    <YStack f={1} px="$6" pb="$0" pt={isDesktop ? "0" : "$4"} jc="center" ai="center" space="$4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={currentZeker.id}
          style={{ alignItems: 'center', width: '100%', opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}
        >
          {renderedArabicText}

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