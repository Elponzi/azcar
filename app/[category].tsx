import React, { useEffect, useState, useMemo } from 'react';
import { useWindowDimensions, StyleSheet } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { setAudioModeAsync } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAzkarStore } from '@/store/azkarStore';
import { THEME } from '@/constants/Theme';
import { TRANSLATIONS } from '@/constants/Translations';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';
import { AzkarCategory } from '@/data/types';
import { CATEGORIES } from '@/data';

// Components
import { SeoHead } from '@/components/SeoHead';
import SettingsModal from '@/components/SettingsModal';
import CategorySheet from '@/components/CategorySheet';
import StarField from '@/components/StarField';
import { CrescentMoon } from '@/components/CrescentMoon';
import { AzkarTextDisplay } from '@/components/azkarScreen/AzkarTextDisplay';
import { AzkarCounter } from '@/components/azkarScreen/AzkarCounter';
import { NavButton, MicButton } from '@/components/azkarScreen/ScreenControls';
import { AzkarScreenHeader } from '@/components/azkarScreen/AzkarScreenHeader';

// Hooks
import { useParallax } from '@/hooks/useParallax';
import { useWebKeyboard } from '@/hooks/useWebKeyboard';
import { useSmartTrack } from '@/hooks/useSmartTrack';
import { useAutoComplete } from '@/hooks/useAutoComplete';

export default function CategoryScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width > 768;
  const [isCategorySheetOpen, setCategorySheetOpen] = useState(false);

  const router = useRouter();
  const { category: categoryParam } = useLocalSearchParams<{ category: string }>();

  const {
    currentCategory,
    currentIndex,
    filteredAzkar,
    counts,
    incrementCount,
    nextZeker,
    prevZeker,
    setCategory,
    resetCurrentCount,
    resetCategoryCounts,
    theme,
    language,
    setSettingsOpen,
    showTranslation,
    showNote
  } = useAzkarStore();

  const currentZeker = filteredAzkar[currentIndex];

  const { handleAutoComplete, stopRecognitionRef } = useAutoComplete();

  const { isListening, startRecognition, stopRecognition, activeWordIndex } = useSmartTrack({
    targetText: currentZeker?.arabic,
    autoReset: true,
    onComplete: handleAutoComplete,
  });

  stopRecognitionRef.current = stopRecognition;

  // Sync URL param with store (case-insensitive match)
  useEffect(() => {
    if (categoryParam) {
      const match = CATEGORIES.find(c => c.toLowerCase() === categoryParam.toLowerCase());
      if (match && match !== currentCategory) {
        setCategory(match);
      }
    }
  }, [categoryParam]);

  // Handle Category Change (Update URL)
  const handleCategoryChange = (cat: AzkarCategory) => {
    router.setParams({ category: cat });
  };

  const colors = THEME[theme];
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';

  const count = counts[currentZeker?.id] || 0;
  const progress = Math.min((count / currentZeker?.target) * 100, 100);

  const hasCategoryProgress = useMemo(() => filteredAzkar.some(z => (counts[z.id] || 0) > 0), [filteredAzkar, counts]);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === filteredAzkar.length - 1;

  // Parallax Effects
  const starParallax = useParallax(EFFECTS_CONFIG.parallax.starsDepth);
  const moonParallax = useParallax(EFFECTS_CONFIG.parallax.moonDepth);

  // Web Keyboard Controls
  useWebKeyboard({
    onIncrement: incrementCount,
    onNext: nextZeker,
    onPrev: prevZeker,
  });

  // Audio Setup (Global, kept here for now)
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
        });
      } catch (e) {
        console.warn('Error configuring audio', e);
      }
    };
    configureAudio();
  }, []);

  if (!currentZeker) return <View><Text>Loading...</Text></View>;

  const renderContent = () => (
    <>
       <SeoHead
         title={currentCategory === 'Morning' ? 'Morning Azkar' : 'Evening Azkar'}
         description={currentZeker.translation}
       />

       <AzkarScreenHeader
         isDesktop={isDesktop}
         isRTL={isRTL}
         colors={colors}
         t={t}
         currentCategory={currentCategory}
         hasCategoryProgress={hasCategoryProgress}
         insetTop={insets.top}
         onResetCategory={resetCategoryCounts}
         onCategoryChange={handleCategoryChange}
         onOpenSettings={() => setSettingsOpen(true)}
         onOpenCategorySheet={() => setCategorySheetOpen(true)}
       />

        {/* Content Body */}
        <XStack f={1} fd={isDesktop ? (isRTL ? 'row-reverse' : 'row') : 'column'}>

          {/* Text Section */}
          <AzkarTextDisplay
            currentZeker={currentZeker}
            showTranslation={showTranslation}
            showNote={showNote}
            isDesktop={isDesktop}
            theme={theme}
            activeWordIndex={isListening ? activeWordIndex : -1}
          />

          {/* Controls Section Container */}
          <YStack
            w={isDesktop ? 400 : '100%'}
            f={isDesktop ? 0 : 0}
            flexShrink={0}
            bg={isDesktop ? colors.background : 'transparent'}
            px="$6"
            pt="$4"
            pb={isDesktop ? "$6" : insets.bottom + 10}
            jc="center"
            ai="center"
            space="$6"
            blc={colors.borderColor}
            blw={isDesktop ? (isRTL ? 0 : 1) : 0}
            brc={colors.borderColor}
            brw={isDesktop ? (isRTL ? 1 : 0) : 0}
            zIndex={10}
          >
            <AzkarCounter
              count={count}
              target={currentZeker.target}
              progress={progress}
              onIncrement={incrementCount}
              onReset={resetCurrentCount}
              onComplete={nextZeker}
              theme={theme}
              isDesktop={isDesktop}
              language={language}
              t={t}
            />

            {/* Nav Controls */}
            <XStack w="100%" jc={isDesktop ? "center" : "space-between"} gap={isDesktop ? "$6" : "$0"} ai="center" px="$2" fd={'row'}>
              <NavButton
                iconName={isRTL ? "chevron-forward" : "chevron-back"}
                onPress={isRTL ? nextZeker : prevZeker}
                colors={colors}
                isDesktop={isDesktop}
                disabled={isRTL ? isLast : isFirst}
              />

              <MicButton
                isListening={isListening}
                onPress={isListening ? stopRecognition : startRecognition}
                colors={colors}
                label={t.startReading}
              />

              <NavButton
                iconName={isRTL ? "chevron-back" : "chevron-forward"}
                onPress={isRTL ? prevZeker : nextZeker}
                colors={colors}
                isDesktop={isDesktop}
                disabled={isRTL ? isFirst : isLast}
              />
            </XStack>
          </YStack>

        </XStack>
    </>
  );

  return (
    <YStack
      f={1}
      bg={colors.background}
      jc={isDesktop ? "center" : "flex-start"}
      ai="center"
      position="relative"
    >
      <Animated.View style={[StyleSheet.absoluteFill, starParallax]} pointerEvents="none">
        <StarField />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, moonParallax]} pointerEvents="none">
        <CrescentMoon color={colors.accent} />
      </Animated.View>

      <YStack
        f={1}
        w="100%"
        padding={isDesktop ? "$4" : "$0"}
        jc={isDesktop ? "center" : "flex-start"}
        ai="center"
        zIndex={1}
      >
        {isDesktop ? (
          <YStack
            w="100%"
            maw={1000}
            h="80%"
            bg={colors.cardBg}
            br={24}
            overflow="hidden"
            elevation="$4"
            bc={colors.borderColor}
            bw={1}
            zIndex={1}
          >
            {renderContent()}
          </YStack>
        ) : (
          <YStack f={1} w="100%" zIndex={1}>
            {renderContent()}
          </YStack>
        )}
      </YStack>
      <SettingsModal />
      <CategorySheet
        isOpen={isCategorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        categories={CATEGORIES}
        onSelect={(cat) => handleCategoryChange(cat)}
      />
    </YStack>
  );
}
