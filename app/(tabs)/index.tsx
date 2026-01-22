import React, { useEffect } from 'react';
import { Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { YStack, XStack, Button, Text, ScrollView, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Audio } from 'expo-av';

import { useAzkarStore } from '@/store/azkarStore';
import { THEME } from '@/constants/Theme';
import { TRANSLATIONS } from '@/constants/Translations';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';

// Components
import { SeoHead } from '@/components/SeoHead';
import SettingsModal from '@/components/SettingsModal';
import StarField from '@/components/StarField';
import { CrescentMoon } from '@/components/CrescentMoon';
import { AzkarTextDisplay } from '@/components/azkarScreen/AzkarTextDisplay';
import { AzkarCounter } from '@/components/azkarScreen/AzkarCounter';
import { NavButton, CategoryButton } from '@/components/azkarScreen/ScreenControls';

// Hooks
import { useParallax } from '@/hooks/useParallax';
import { useWebKeyboard } from '@/hooks/useWebKeyboard';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width > 768;

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
    theme,
    language,
    setSettingsOpen,
    showTranslation
  } = useAzkarStore();

  const colors = THEME[theme];
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  
  const currentZeker = filteredAzkar[currentIndex];
  const count = counts[currentZeker?.id] || 0;
  const progress = Math.min((count / currentZeker?.target) * 100, 100);

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
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
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
          pt={isDesktop ? '$4' : insets.top}
          pb="$3"
          px="$4"
          ai="center" 
          jc="space-between"
          bbw={isDesktop ? 1 : 0} 
          bbc={colors.borderColor}
          fd={isRTL ? 'row-reverse' : 'row'}
          zIndex={10}
        >
          {/* Left Spacer to balance Settings button */}
          <XStack w={40} />
          
          <XStack 
            bg={colors.cardBg} 
            p="$1.5" 
            br="$10" 
            gap="$2" 
            fd={isRTL ? 'row-reverse' : 'row'}
          >
            <CategoryButton 
              label={t.morning} 
              isActive={currentCategory === 'Morning'} 
              onPress={() => setCategory('Morning')} 
              colors={colors}
            />
            <CategoryButton 
              label={t.evening} 
              isActive={currentCategory === 'Evening'} 
              onPress={() => setCategory('Evening')} 
              colors={colors}
            />
          </XStack>

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
            isDesktop={isDesktop}
            theme={theme}
          />

          {/* Controls Section Container */}
          <YStack 
            w={isDesktop ? 400 : '100%'}
            f={isDesktop ? 0 : 0}
            flexShrink={0}
            bg={isDesktop ? colors.background : 'transparent'} 
            p="$6" 
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
              t={t}
            />

            {/* Nav Controls */}
            <XStack w="100%" jc={isDesktop ? "center" : "space-between"} gap={isDesktop ? "$6" : "$0"} ai="center" px="$2" fd={isRTL ? 'row-reverse' : 'row'}>
              <NavButton 
                iconName={isRTL ? "chevron-forward" : "chevron-back"}
                onPress={isRTL ? nextZeker : prevZeker}
                colors={colors}
                isDesktop={isDesktop}
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
        <StarField color={colors.accent} />
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
    </YStack>
  );
}