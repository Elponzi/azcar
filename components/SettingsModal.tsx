import React, { useEffect, useState } from 'react';
import { useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import { YStack, XStack, H4, Text, Button } from 'tamagui';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing
} from 'react-native-reanimated';
import { useAzkarStore } from '@/store/azkarStore';
import { TRANSLATIONS } from '@/constants/Translations';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/Theme';
import { DriveModeInfoModal } from './DriveModeInfoModal';

// --- Helper Component for Toggle Buttons ---
interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: typeof THEME.dark; // Type derived from Theme
}

const ToggleButton = ({ label, isActive, onPress, colors }: ToggleButtonProps) => (
  <Button 
    f={1} 
    bg={isActive ? colors.modalBg : 'transparent'} 
    color={isActive ? colors.accent : colors.textSecondary}
    onPress={onPress}
    chromeless={!isActive}
    pressStyle={{ opacity: 0.8 }}
    br="$3"
    bw={1}
    bc={isActive ? colors.accent : 'transparent'}
    shadowColor="rgba(0,0,0,0.1)"
    shadowOffset={{ width: 0, height: 2 }}
    shadowOpacity={isActive ? 0.2 : 0}
    elevation={isActive ? 2 : 0}
    fontWeight={isActive ? "700" : "400"}
  >
    {label}
  </Button>
);

export const SettingsModal = () => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 768;
  const { theme, setTheme, language, setLanguage, isSettingsOpen, setSettingsOpen, showTranslation, setShowTranslation, showNote, setShowNote, isDriveModeEnabled, setDriveMode } = useAzkarStore();
  const t = TRANSLATIONS[language];
  
  // Local state for info modal
  const [isInfoOpen, setInfoOpen] = useState(false);

  // Use centralized theme
  const colors = THEME[theme];

  const opacity = useSharedValue(0);
  const translation = useSharedValue(isDesktop ? 350 : height);

  useEffect(() => {
    if (isSettingsOpen) {
      opacity.value = withTiming(1, { duration: 200 });
      translation.value = withTiming(0, { 
        duration: 250, 
        easing: Easing.out(Easing.cubic) 
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      // Add extra buffer to height to ensure it's completely off-screen on all devices
      const hiddenVal = isDesktop ? 350 : (height + 100);
      translation.value = withTiming(hiddenVal, { 
        duration: 200, 
        easing: Easing.in(Easing.cubic) 
      });
    }
  }, [isSettingsOpen, isDesktop, height]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedPanelStyle = useAnimatedStyle(() => {
    if (isDesktop) {
        return {
            transform: [{ translateX: translation.value }],
            end: 0,
        }
    } else {
        return {
            transform: [{ translateY: translation.value }],
            bottom: 0,
        }
    }
  }, [isDesktop]);

  if (!isSettingsOpen && opacity.value === 0) return null;

  return (
    <YStack 
      position="absolute" 
      top={0} 
      left={0} 
      right={0} 
      bottom={0} 
      zIndex={9999}
      pointerEvents={isSettingsOpen ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={() => setSettingsOpen(false)}>
        <Animated.View 
          style={[
            { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
            animatedBackdropStyle
          ]} 
        />
      </TouchableWithoutFeedback>

      {/* Panel */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            backgroundColor: colors.modalBg,
            height: '100%',
            width: isDesktop ? 350 : '100%',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 20,
            padding: 30,
            borderStartWidth: isDesktop ? 1 : 0,
            borderColor: colors.borderColor,
          },
          animatedPanelStyle
        ]}
      >
        <YStack space="$6" f={1}>
            {/* Header */}
            <XStack jc="space-between" ai="center">
                <H4 fontSize={20} fontWeight="700" color={colors.textPrimary}>{t.settings}</H4>
                <Button 
                    size="$3" 
                    circular 
                    chromeless 
                    onPress={() => setSettingsOpen(false)}
                    icon={<Ionicons name="close" size={24} color={colors.textSecondary} />}
                />
            </XStack>

            {/* Appearance Section */}
            <YStack space="$4">
                <Text fontSize={12} fontWeight="600" textTransform="uppercase" color={colors.textSecondary} letterSpacing={1}>
                    {t.appearance}
                </Text>
                
                <XStack bg={colors.cardBg} p="$1" br="$4" bw={0}>
                  <ToggleButton 
                    label={t.dark} 
                    isActive={theme === 'dark'} 
                    onPress={() => setTheme('dark')} 
                    colors={colors} 
                  />
                  <ToggleButton 
                    label={t.light} 
                    isActive={theme === 'light'} 
                    onPress={() => setTheme('light')} 
                    colors={colors} 
                  />
                </XStack>
            </YStack>

            {/* Language Section */}
            <YStack space="$4">
                <Text fontSize={12} fontWeight="600" textTransform="uppercase" color={colors.textSecondary} letterSpacing={1}>
                    {t.language}
                </Text>
                
                <XStack bg={colors.cardBg} p="$1" br="$4" bw={0}>
                   <ToggleButton 
                    label="English" 
                    isActive={language === 'en'} 
                    onPress={() => setLanguage('en')} 
                    colors={colors} 
                  />
                  <ToggleButton 
                    label="العربية" 
                    isActive={language === 'ar'} 
                    onPress={() => setLanguage('ar')} 
                    colors={colors} 
                  />
                </XStack>
            </YStack>

            {/* Translation Section */}
            <YStack space="$4">
                <Text fontSize={12} fontWeight="600" textTransform="uppercase" color={colors.textSecondary} letterSpacing={1}>
                    {t.showTranslation}
                </Text>
                
                <XStack bg={colors.cardBg} p="$1" br="$4" bw={0}>
                   <ToggleButton 
                    label={t.off} 
                    isActive={!showTranslation} 
                    onPress={() => setShowTranslation(false)} 
                    colors={colors} 
                  />
                  <ToggleButton 
                    label={t.on} 
                    isActive={showTranslation} 
                    onPress={() => setShowTranslation(true)} 
                    colors={colors} 
                  />
                </XStack>
            </YStack>

            {/* Note Section */}
            <YStack space="$4">
                <Text fontSize={12} fontWeight="600" textTransform="uppercase" color={colors.textSecondary} letterSpacing={1}>
                    {t.showBenefits}
                </Text>
                
                <XStack bg={colors.cardBg} p="$1" br="$4" bw={0}>
                   <ToggleButton 
                    label={t.off} 
                    isActive={!showNote} 
                    onPress={() => setShowNote(false)} 
                    colors={colors} 
                  />
                  <ToggleButton 
                    label={t.on} 
                    isActive={showNote} 
                    onPress={() => setShowNote(true)} 
                    colors={colors} 
                  />
                </XStack>
            </YStack>

            {/* Drive Mode Section */}
            <YStack space="$4">
                <XStack ai="center" space="$2">
                    <Text fontSize={12} fontWeight="600" textTransform="uppercase" color={colors.textSecondary} letterSpacing={1}>
                        {t.driveMode}
                    </Text>
                    <Button 
                        size="$1.5"
                        circular
                        chromeless
                        onPress={() => setInfoOpen(true)}
                        icon={<Ionicons name="information-circle-outline" size={16} color={colors.accent} />}
                        p={0}
                    />
                </XStack>
                
                <XStack bg={colors.cardBg} p="$1" br="$4" bw={0}>
                   <ToggleButton 
                    label={t.off} 
                    isActive={!isDriveModeEnabled} 
                    onPress={() => setDriveMode(false)} 
                    colors={colors} 
                  />
                  <ToggleButton 
                    label={t.on} 
                    isActive={isDriveModeEnabled} 
                    onPress={() => setDriveMode(true)} 
                    colors={colors} 
                  />
                </XStack>
            </YStack>

            {/* Footer Hints */}
            <YStack mt="auto" ai="center" space="$2">
                <Text color={colors.textSecondary} fontSize={12}>{t.countPrompt}</Text>
                <Text color={colors.textSecondary} fontSize={12}>{t.navPrompt}</Text>
            </YStack>
        </YStack>
      </Animated.View>
      
      {/* Nested Info Modal */}
      <DriveModeInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setInfoOpen(false)} 
      />
    </YStack>
  );
}
