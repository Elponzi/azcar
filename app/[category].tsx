import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useWindowDimensions, StyleSheet } from 'react-native';
import { YStack, XStack, Button, Text, ScrollView, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import { NavButton, CategoryButton } from '@/components/azkarScreen/ScreenControls';
import { DesktopCategoryNav } from '@/components/azkarScreen/DesktopCategoryNav';

// Hooks
import { useParallax } from '@/hooks/useParallax';
import { useWebKeyboard } from '@/hooks/useWebKeyboard';
import { useSmartReading } from '@/hooks/useSmartReading';

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
    showNote,
    // Smart reading state
    isListening,
    currentWordIndex,
    smartReadingEnabled,
    startListening,
    stopListening,
    setCurrentWordIndex,
    resetWordProgress,
  } = useAzkarStore();

  // Sync URL param with Store
  useEffect(() => {
    if (categoryParam) {
      // Normalize param to match AzkarCategory type (capitalize first letter)
      // Assuming URL is like /morning -> Morning
      // But if user typed /Morning, it's fine.
      // We should be case-insensitive or strict. Let's try to match.
      const match = CATEGORIES.find(c => c.toLowerCase() === categoryParam.toLowerCase());
      if (match && match !== currentCategory) {
        setCategory(match);
      }
    }
  }, [categoryParam]);

  // Handle Category Change (Update URL)
  const handleCategoryChange = (cat: AzkarCategory) => {
    // Use setParams to update the current route's dynamic segment without a full navigation/transition
    router.setParams({ category: cat });
  };

  const colors = THEME[theme];
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  
  const currentZeker = filteredAzkar[currentIndex];
  const count = counts[currentZeker?.id] || 0;
  const progress = Math.min((count / currentZeker?.target) * 100, 100);
  
  const hasCategoryProgress = useMemo(() => filteredAzkar.some(z => (counts[z.id] || 0) > 0), [filteredAzkar, counts]);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === filteredAzkar.length - 1;

  // Track if we're in the middle of auto-advancing to prevent loops
  const isAutoAdvancingRef = useRef(false);

  // Handle word match - update word index in store
  const handleWordMatched = useCallback((newIndex: number) => {
    setCurrentWordIndex(newIndex);
  }, [setCurrentWordIndex]);

  // Handle recitation complete - increment count and manage navigation
  const handleRecitationComplete = useCallback(() => {
    if (isAutoAdvancingRef.current) return;

    const currentCount = counts[currentZeker?.id] || 0;
    const target = currentZeker?.target || 1;

    // Increment the count
    incrementCount();

    const newCount = currentCount + 1;

    if (newCount >= target) {
      // Target reached - stop listening and advance to next zeker after delay
      isAutoAdvancingRef.current = true;
      stopListening();

      setTimeout(() => {
        if (!isLast) {
          nextZeker();
          resetWordProgress();
          // Resume listening for the next zeker
          setTimeout(() => {
            isAutoAdvancingRef.current = false;
            if (smartReadingEnabled) {
              startListening();
            }
          }, 500);
        } else {
          isAutoAdvancingRef.current = false;
        }
      }, 1500);
    } else {
      // Target not reached - reset word progress and continue
      resetWordProgress();
    }
  }, [
    counts,
    currentZeker,
    incrementCount,
    stopListening,
    isLast,
    nextZeker,
    resetWordProgress,
    smartReadingEnabled,
    startListening,
  ]);

  // Handle silence timeout
  const handleSilenceTimeout = useCallback(() => {
    stopListening();
  }, [stopListening]);

  // Smart reading hook
  const {
    isAvailable: smartReadingAvailable,
    hasPermission: smartReadingPermission,
    startListening: startSmartReading,
    stopListening: stopSmartReading,
    requestPermission: requestSmartReadingPermission,
    lastTranscript,
  } = useSmartReading({
    text: currentZeker?.arabic || '',
    isEnabled: smartReadingEnabled && isListening,
    currentWordIndex,
    onWordMatched: handleWordMatched,
    onRecitationComplete: handleRecitationComplete,
    onSilenceTimeout: handleSilenceTimeout,
  });

  // Toggle listening - IMPORTANT: Keep this synchronous for Web Speech API
  const handleToggleListening = useCallback(() => {
    console.log('[handleToggleListening] Called, isListening:', isListening);
    if (isListening) {
      console.log('[handleToggleListening] Stopping...');
      stopListening();
      stopSmartReading();
    } else {
      // Start synchronously to maintain user gesture context
      console.log('[handleToggleListening] Starting...');
      startListening();
      resetWordProgress();
      startSmartReading();
    }
  }, [
    isListening,
    stopListening,
    stopSmartReading,
    startListening,
    resetWordProgress,
    startSmartReading,
  ]);

  // Reset word progress when changing zeker
  useEffect(() => {
    resetWordProgress();
  }, [currentIndex, resetWordProgress]);

  // Stop listening when changing category
  useEffect(() => {
    if (isListening) {
      stopListening();
      stopSmartReading();
    }
  }, [currentCategory]);

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
          allowsRecording: true, // Enable for speech recognition
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
       
       {/* Header */}
       <XStack 
          pt={isDesktop ? '$6' : insets.top + 30}
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
          {/* Settings Button / Left Spacer */}
          <XStack w={40} jc="flex-start">
             {/* Spacer/Settings placeholder */}
             {hasCategoryProgress && (
              <Button 
                size="$3" 
                circular 
                bg="transparent"
                color={colors.textSecondary}
                icon={<Ionicons name="refresh" size={20} color={colors.textSecondary} />} 
                onPress={resetCategoryCounts}
                hoverStyle={{ bg: colors.background }}
                animation="quick"
                enterStyle={{ opacity: 0, scale: 0.5 }}
                exitStyle={{ opacity: 0, scale: 0.5 }}
              />
            )}
          </XStack>

          {/* Desktop: Categories ScrollView */}
          {isDesktop ? (
            <DesktopCategoryNav 
              categories={CATEGORIES}
              currentCategory={currentCategory}
              onCategoryChange={handleCategoryChange}
              colors={colors}
              t={t}
              isRTL={isRTL}
            />
          ) : (
            /* Mobile: Category Trigger */
            <Button
              chromeless
              onPress={() => setCategorySheetOpen(true)}
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

          <XStack w={40} jc="flex-end">
            <Button 
              size="$3" 
              circular 
              bg="transparent"
              color={colors.textSecondary}
              icon={<Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />} 
              onPress={() => setSettingsOpen(true)}
              hoverStyle={{ bg: colors.background }}
            />
            
          </XStack>
        </XStack>

        {/* Content Body */}
        <XStack f={1} fd={isDesktop ? (isRTL ? 'row-reverse' : 'row') : 'column'}>
          
          {/* Text Section */}
          <AzkarTextDisplay
            currentZeker={currentZeker}
            showTranslation={showTranslation}
            showNote={showNote}
            isDesktop={isDesktop}
            theme={theme}
            isListening={isListening}
            currentWordIndex={currentWordIndex}
          />

          {/* Controls Section Container */}
          <YStack 
            w={isDesktop ? 400 : '100%'}
            f={isDesktop ? 0 : 0}
            flexShrink={0}
            bg={isDesktop ? colors.background : 'transparent'} 
            px="$6"
            pt="$4"
            pb={isDesktop ? "$6" : insets.bottom}
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
              isListening={isListening}
              isAvailable={smartReadingAvailable}
              hasPermission={smartReadingPermission}
              onToggleListening={handleToggleListening}
              smartReadingEnabled={smartReadingEnabled}
              debugTranscript={lastTranscript}
            />

            {/* Nav Controls */}
            <XStack w="100%" jc={isDesktop ? "center" : "space-between"} gap={isDesktop ? "$6" : "$0"} ai="center" px="$2" fd={isRTL ? 'row-reverse' : 'row'}>
              <NavButton 
                iconName={isRTL ? "chevron-forward" : "chevron-back"}
                onPress={isRTL ? nextZeker : prevZeker}
                colors={colors}
                isDesktop={isDesktop}
                disabled={isRTL ? isLast : isFirst}
              />
              
              {!isDesktop && (
                <Text 
                  textTransform="uppercase" 
                  letterSpacing={1} 
                  fontSize={12} 
                  color={colors.textSecondary}
                  fontWeight="600"
                >
                  {t.driveMode}
                </Text>
              )}

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
