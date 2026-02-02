import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useWindowDimensions, StyleSheet, Pressable } from 'react-native';
import { YStack, XStack, Text, View, Button } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeOutUp } from 'react-native-reanimated';
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
  const [dismissedCompletion, setDismissedCompletion] = useState(false);

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

  const { handleAutoComplete, stopRecognitionRef, playSuccessSound } = useAutoComplete();

  const { isListening, startRecognition, stopRecognition, activeWordIndex, permissionError, clearPermissionError } = useSmartTrack({
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

  const categoryProgress = useMemo(() => {
    const completed = filteredAzkar.filter(z => (counts[z.id] || 0) >= z.target).length;
    return { completed, total: filteredAzkar.length };
  }, [filteredAzkar, counts]);

  const isCategoryComplete = categoryProgress.total > 0 && categoryProgress.completed === categoryProgress.total;

  // Reset dismissedCompletion when category changes
  useEffect(() => {
    setDismissedCompletion(false);
  }, [currentCategory]);

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

  // Auto-dismiss permission error after 4 seconds
  useEffect(() => {
    if (permissionError) {
      const timer = setTimeout(() => clearPermissionError(), 4000);
      return () => clearTimeout(timer);
    }
  }, [permissionError, clearPermissionError]);

  const handleRetryMic = useCallback(() => {
    clearPermissionError();
    startRecognition();
  }, [clearPermissionError, startRecognition]);

  if (!currentZeker) return <View><Text>Loading...</Text></View>;

  const renderContent = () => (
    <>
       <SeoHead
         title={currentCategory === 'Morning' ? 'Morning Azkar' : 'Evening Azkar'}
         description={currentZeker.translation}
       />

       {/* Mic Permission Error Banner */}
       {permissionError && (
         <Animated.View
           entering={FadeInUp.duration(300)}
           exiting={FadeOutUp.duration(300)}
           style={{ width: '100%', position: 'absolute', top: isDesktop ? 0 : insets.top, zIndex: 100 }}
         >
           <Pressable onPress={handleRetryMic}>
             <XStack
               bg={colors.accent}
               px="$4"
               py="$3"
               ai="center"
               jc="center"
               gap="$2"
             >
               <Text fontSize={16} fontWeight="700" color={colors.background}>
                 {t.micPermissionDenied}
               </Text>
               <Text fontSize={14} color={colors.background} opacity={0.8}>
                 {t.tapToRetry}
               </Text>
             </XStack>
           </Pressable>
         </Animated.View>
       )}

       <AzkarScreenHeader
         isDesktop={isDesktop}
         isRTL={isRTL}
         colors={colors}
         t={t}
         currentCategory={currentCategory}
         hasCategoryProgress={hasCategoryProgress}
         currentZekrIndex={currentIndex}
         totalAzkar={filteredAzkar.length}
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
              playSuccessSound={playSuccessSound}
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
      {/* Category Completion Celebration Overlay */}
      {isCategoryComplete && !dismissedCompletion && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[StyleSheet.absoluteFill, { zIndex: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }]}
        >
          <YStack ai="center" gap="$4" p="$6">
            <Ionicons name="checkmark-circle" size={120} color={colors.accent} />
            <Text fontSize={28} fontWeight="800" color="#fff">
              {t.categoryComplete}
            </Text>
            <Button
              size="$5"
              bg={colors.accent}
              color={colors.background}
              br="$10"
              px="$8"
              fontWeight="700"
              fontSize={18}
              onPress={() => setDismissedCompletion(true)}
              pressStyle={{ opacity: 0.8, scale: 0.97 }}
            >
              {t.done}
            </Button>
          </YStack>
        </Animated.View>
      )}

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
