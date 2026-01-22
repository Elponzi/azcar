import DivineLight from '@/components/DivineLight';
import { CrescentMoon } from '@/components/CrescentMoon';
import { ProgressRing } from '@/components/ProgressRing';
import { useParallax } from '@/hooks/useParallax';
import { StyleSheet } from 'react-native';
import { SeoHead } from '@/components/SeoHead';
import SettingsModal from '@/components/SettingsModal';
import StarField from '@/components/StarField';
import { THEME, ThemeColors } from '@/constants/Theme';
import { TRANSLATIONS } from '@/constants/Translations';
import { useAzkarStore } from '@/store/azkarStore';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button, Paragraph, ScrollView, Text, View, XStack, YStack } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Helper Components ---
interface NavButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: ThemeColors;
  isDesktop: boolean;
}

const NavButton = ({ iconName, onPress, colors, isDesktop }: NavButtonProps) => (
  <Button 
    size="$6" 
    circular 
    bg={colors.cardBg}
    borderWidth={isDesktop ? 1 : 0}
    borderColor={colors.borderColor}
    elevation={0}
    shadowOpacity={0}
    color={colors.textPrimary}
    icon={<Ionicons name={iconName} size={32} color={colors.textPrimary} />} 
    onPress={() => {
      onPress();
    }} 
    pressStyle={{ opacity: 0.8 }}
  />
);

interface CategoryButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
}

const CategoryButton = ({ label, isActive, onPress, colors }: CategoryButtonProps) => (
  <Button 
    size="$3" 
    br="$10"
    bg={isActive ? colors.cardBg : 'transparent'}
    color={isActive ? colors.accent : colors.textSecondary}
    onPress={onPress}
    chromeless={!isActive}
    pressStyle={{ opacity: 0.8 }}
    bw={1}
    bc={isActive ? colors.accent : 'transparent'}
    fontWeight={isActive ? "700" : "400"}
  >
    {label}
  </Button>
);

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

  // Animation for Press
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/2.mp3'),
        { shouldPlay: false }
      );
      
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });

      await sound.playAsync();
    } catch (e) {
      console.log('Error playing sound', e);
    }
  };

  // Dynamic Font Size
  const getDynamicFontSize = (text: string, translationVisible: boolean) => {
    const len = text.length;
    const boost = translationVisible ? 1 : 1.3; // 30% larger when translation is off

    if (len < 50) return (isDesktop ? 48 : 32) * boost;
    if (len < 100) return (isDesktop ? 36 : 24) * boost;
    if (len < 200) return (isDesktop ? 28 : 20) * boost;
    if (len < 300) return (isDesktop ? 24 : 18) * boost;
    return (isDesktop ? 20 : 16) * boost;
  };

  // Keyboard controls for Web "Car Mode"
  useEffect(() => {
    // Configure Audio for playback
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

  const ringTrackColor = colors.cardBg;
  
  // Parallax Effects
  const starParallax = useParallax(25); // Deep background
  const moonParallax = useParallax(10); // Mid-ground

  // Render Content
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
                      fontFamily="System" 
                      fontWeight="700" 
                      fontSize={fontSize} 
                      textAlign="center" 
                      lineHeight={fontSize * 1.4}
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

          {/* Controls Section */}
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
            {/* Counter Ring */}
            <XStack ai="center" jc="center" position="relative">
              <Pressable 
                onPress={() => {
                  if (Platform.OS !== 'web' && count < currentZeker.target) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  incrementCount();
                }}
                onLongPress={() => {
                  if (count >= currentZeker.target) {
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync();
                      playSuccessSound();
                    }
                    nextZeker();
                  }
                }}
                delayLongPress={500}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <Animated.View style={animatedScaleStyle}>
                  <ProgressRing 
                      radius={isDesktop ? 140 : 90} 
                      stroke={6} 
                      progress={progress} 
                      color={colors.accent}
                      bgColor={ringTrackColor} 
                  >
                    <YStack ai="center" jc="center" position="relative">
                      <DivineLight color={colors.accent} size={isDesktop ? 320 : 240} />
                      <Text fontSize={isDesktop ? 72 : 56} fontWeight="800" color={progress >= 100 ? colors.accent : colors.textPrimary} zIndex={1}>
                        {count}
                      </Text>
                      {count >= currentZeker.target ? (
                        <Text fontSize={isDesktop ? 16 : 14} color={colors.accent} fontWeight="600" zIndex={1} opacity={0.8}>
                          {t.hold}
                        </Text>
                      ) : (
                        <Text fontSize={isDesktop ? 20 : 16} color={colors.textSecondary} zIndex={1}>/ {currentZeker.target}</Text>
                      )}
                    </YStack>
                  </ProgressRing>
                </Animated.View>
              </Pressable>

              {count > 0 && (
                <Button 
                  size="$3" 
                  circular 
                  bg={colors.cardBg}
                  color={colors.textSecondary}
                  icon={<Ionicons name="refresh" size={20} color={colors.textSecondary} />} 
                  onPress={() => resetCurrentCount()}
                  position="absolute"
                  bottom={-10}
                  right={isDesktop ? -40 : -20}
                  elevation={0}
                  hoverStyle={{ bg: colors.accentDim }}
                  pressStyle={{ bg: colors.accentDim }}
                />
              )}
            </XStack>

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
