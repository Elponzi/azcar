import React, { useEffect } from 'react';
import { Platform, useWindowDimensions, Pressable } from 'react-native';
import { View, Text, YStack, XStack, Button, ScrollView, H4, Paragraph, Separator } from 'tamagui';
import { useAzkarStore } from '@/store/azkarStore';
import { ProgressRing } from '@/components/ProgressRing';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TRANSLATIONS } from '@/constants/Translations';
import SettingsModal from '@/components/SettingsModal';

// Mockup Colors
const MOCKUP_THEME = {
  dark: {
    // Mobile
    mobileBg: '#050505',
    mobileCardBg: '#1A1A1A', // Used for track color in mobile
    // Desktop
    desktopBody: '#121212',
    desktopCard: '#1E1E1E',
    desktopControlBg: '#121212',
    // Common
    textPrimary: '#FFFFFF',
    textSecondary: '#888888',
    accent: '#34D399',
    accentDim: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#333333',
  },
  light: {
    // Mobile
    mobileBg: '#F3F4F6',
    mobileCardBg: '#FFFFFF',
    // Desktop
    desktopBody: '#E5E7EB',
    desktopCard: '#FFFFFF',
    desktopControlBg: '#E5E7EB',
    // Common
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    accent: '#059669',
    accentDim: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#E5E7EB',
  }
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
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
  } = useAzkarStore();

  const colors = MOCKUP_THEME[theme];
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  
  const currentZeker = filteredAzkar[currentIndex];
  const count = counts[currentZeker?.id] || 0;
  const progress = Math.min((count / currentZeker?.target) * 100, 100);

  // Dynamic Font Size
  const getDynamicFontSize = (text: string) => {
    const len = text.length;
    if (len < 50) return isDesktop ? 48 : 32;
    if (len < 100) return isDesktop ? 36 : 24;
    if (len < 200) return isDesktop ? 28 : 20;
    if (len < 300) return isDesktop ? 24 : 18;
    return isDesktop ? 20 : 16;
  };

  // Keyboard controls for Web "Car Mode"
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          incrementCount();
        } else if (e.code === 'ArrowRight') {
          nextZeker();
        } else if (e.code === 'ArrowLeft') {
          prevZeker();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [incrementCount, nextZeker, prevZeker]);

  if (!currentZeker) return <View><Text>Loading...</Text></View>;

  const ringTrackColor = isDesktop ? colors.desktopCard : colors.mobileCardBg;

  // Render Content
  const renderContent = () => (
    <>
       {/* Header */}
       <XStack 
          p="$4" 
          jc="space-between" 
          ai="center" 
          bbw={isDesktop ? 1 : 0} 
          bbc={colors.borderColor}
          fd={isRTL ? 'row-reverse' : 'row'}
        >
          <H4 fontWeight="bold" color={colors.textPrimary}>📿 Azkar Drive</H4>
          
          <XStack 
            bg={isDesktop ? colors.desktopBody : colors.mobileCardBg} 
            p="$1.5" 
            br="$10" 
            gap="$2" 
            fd={isRTL ? 'row-reverse' : 'row'}
          >
            <Button 
              size="$3" 
              br="$10"
              bg={currentCategory === 'Morning' ? colors.accent : 'transparent'}
              color={currentCategory === 'Morning' ? '#FFFFFF' : colors.textSecondary}
              onPress={() => setCategory('Morning')}
              chromeless={currentCategory !== 'Morning'}
              pressStyle={{ opacity: 0.8 }}
            >
              {t.morning}
            </Button>
            <Button 
              size="$3" 
              br="$10"
              bg={currentCategory === 'Evening' ? colors.accent : 'transparent'}
              color={currentCategory === 'Evening' ? '#FFFFFF' : colors.textSecondary}
              onPress={() => setCategory('Evening')}
              chromeless={currentCategory !== 'Evening'}
              pressStyle={{ opacity: 0.8 }}
            >
              {t.evening}
            </Button>
          </XStack>

          <Button 
            size="$3" 
            circular 
            bg="transparent"
            color={colors.textSecondary}
            icon={<Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />} 
            onPress={() => setSettingsOpen(true)}
            hoverStyle={{ bg: isDesktop ? colors.desktopBody : colors.mobileCardBg }}
          />
        </XStack>

        {/* Content Body */}
        <XStack f={1} fd={isDesktop ? (isRTL ? 'row-reverse' : 'row') : 'column'}>
          
          {/* Text Section */}
          <YStack f={1} p="$6" jc="center" ai="center" space="$4">
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
              showsVerticalScrollIndicator={false}
            >
              <Text 
                fontFamily="System" 
                fontWeight="700" 
                fontSize={getDynamicFontSize(currentZeker.arabic)} 
                textAlign="center" 
                lineHeight={isDesktop ? 60 : 36}
                color={colors.textPrimary}
                maw={isDesktop ? 800 : '100%'}
              >
                {currentZeker.arabic}
              </Text>
              <Paragraph 
                mt="$4" 
                fontSize={isDesktop ? 18 : 14} 
                color={colors.textSecondary} 
                textAlign="center"
                maw={600}
              >
                {currentZeker.translation}
              </Paragraph>
            </ScrollView>
          </YStack>

          {/* Controls Section */}
          <YStack 
            w={isDesktop ? 400 : '100%'}
            f={isDesktop ? 0 : 0}
            flexShrink={0}
            bg={isDesktop ? colors.desktopControlBg : 'transparent'} 
            p="$6" 
            jc="center" 
            ai="center" 
            space="$6"
            blc={colors.borderColor}
            blw={isDesktop ? (isRTL ? 0 : 1) : 0}
            brc={colors.borderColor}
            brw={isDesktop ? (isRTL ? 1 : 0) : 0}
          >
            {/* Counter Ring */}
            <XStack ai="center" jc="center" position="relative">
              <Pressable onPress={incrementCount} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing 
                    radius={isDesktop ? 140 : 90} 
                    stroke={12} 
                    progress={progress} 
                    color={colors.accent}
                    bgColor={ringTrackColor} 
                >
                  <YStack ai="center" jc="center">
                    <Text fontSize={isDesktop ? 72 : 56} fontWeight="800" color={progress >= 100 ? colors.accent : colors.textPrimary}>
                      {count}
                    </Text>
                    <Text fontSize={isDesktop ? 20 : 16} color={colors.textSecondary}>/ {currentZeker.target}</Text>
                  </YStack>
                </ProgressRing>
              </Pressable>

              {count > 0 && (
                <Button 
                  size="$3" 
                  circular 
                  bg={colors.bgCard}
                  color={colors.textSecondary}
                  icon={<Ionicons name="refresh" size={20} color={colors.textSecondary} />} 
                  onPress={(e) => {
                    e.stopPropagation();
                    resetCurrentCount();
                  }}
                  position="absolute"
                  bottom={0}
                  right={isDesktop ? 0 : -10}
                  elevation={0}
                  hoverStyle={{ bg: colors.accentDim }}
                  pressStyle={{ bg: colors.accentDim }}
                />
              )}
            </XStack>

            {/* Nav Controls */}
            <XStack w="100%" jc={isDesktop ? "center" : "space-between"} gap={isDesktop ? "$6" : "$0"} ai="center" px="$2" fd={isRTL ? 'row-reverse' : 'row'}>
              <Button 
                size="$6" 
                circular 
                bg={colors.desktopCard}
                borderWidth={isDesktop ? 1 : 0}
                borderColor={colors.borderColor}
                elevation={0}
                shadowOpacity={0}
                color={colors.textPrimary}
                icon={<Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={32} color={colors.textPrimary} />} 
                onPress={isRTL ? nextZeker : prevZeker} 
                pressStyle={{ opacity: 0.8 }}
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

              <Button 
                size="$6" 
                circular 
                bg={colors.desktopCard}
                borderWidth={isDesktop ? 1 : 0}
                borderColor={colors.borderColor}
                elevation={0}
                shadowOpacity={0}
                color={colors.textPrimary}
                icon={<Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={32} color={colors.textPrimary} />} 
                onPress={isRTL ? prevZeker : nextZeker} 
                pressStyle={{ opacity: 0.8 }}
              />
            </XStack>
          </YStack>

        </XStack>
    </>
  );

  return (
    <YStack 
      f={1} 
      bg={isDesktop ? colors.desktopBody : colors.mobileBg} 
      padding={isDesktop ? "$4" : "$4"} 
      jc={isDesktop ? "center" : "flex-start"} 
      ai="center"
    >
      {isDesktop ? (
        <YStack 
          w="100%" 
          maw={1000} 
          h="80%" 
          bg={colors.desktopCard} 
          br={24} 
          overflow="hidden"
          elevation="$4"
          bc={colors.borderColor}
          bw={1}
        >
          {renderContent()}
        </YStack>
      ) : (
        <YStack f={1} w="100%">
          {renderContent()}
        </YStack>
      )}
      <SettingsModal />
    </YStack>
  );
}
