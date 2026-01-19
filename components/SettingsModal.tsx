import React, { useEffect } from 'react';
import { useWindowDimensions, TouchableWithoutFeedback, Platform } from 'react-native';
import { YStack, XStack, H4, Text, Button, Separator } from 'tamagui';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { useAzkarStore } from '@/store/azkarStore';
import { TRANSLATIONS } from '@/constants/Translations';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsModal() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 768;
  const { theme, setTheme, language, setLanguage, isSettingsOpen, setSettingsOpen } = useAzkarStore();
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';

  const opacity = useSharedValue(0);
  const translation = useSharedValue(isDesktop ? (isRTL ? -350 : 350) : height);

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
      const hiddenVal = isDesktop ? (isRTL ? -350 : 350) : (height + 100);
      translation.value = withTiming(hiddenVal, { 
        duration: 200, 
        easing: Easing.in(Easing.cubic) 
      });
    }
  }, [isSettingsOpen, isDesktop, isRTL, height]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedPanelStyle = useAnimatedStyle(() => {
    if (isDesktop) {
        return {
            transform: [{ translateX: translation.value }],
            right: isRTL ? undefined : 0,
            left: isRTL ? 0 : undefined,
        }
    } else {
        return {
            transform: [{ translateY: translation.value }],
            bottom: 0,
        }
    }
  });

  if (!isSettingsOpen && opacity.value === 0) return null;

  // Render Logic
  // Mobile: Bottom Sheet (full width, height 100% or auto? Mockup says height 100% and slides up)
  // Desktop: Sidebar (width 350, height 100%)

  // Colors based on theme (Mockup palette)
  const bgColor = theme === 'dark' ? '#1E1E1E' : '#FFFFFF';
  const borderColor = theme === 'dark' ? '#333333' : '#E5E7EB';
  const textColor = theme === 'dark' ? '#FFFFFF' : '#111827';
  const secondaryText = theme === 'dark' ? '#A0A0A0' : '#6B7280';
  const activeBg = theme === 'dark' ? '#121212' : '#F3F4F6';

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
            backgroundColor: bgColor,
            height: '100%',
            width: isDesktop ? 350 : '100%',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 20,
            padding: 30,
            borderLeftWidth: isDesktop && !isRTL ? 1 : 0,
            borderRightWidth: isDesktop && isRTL ? 1 : 0,
            borderColor: borderColor,
          },
          animatedPanelStyle
        ]}
      >
        <YStack space="$6" f={1}>
            {/* Header */}
            <XStack jc="space-between" ai="center">
                <H4 fontSize={20} fontWeight="700" color={textColor}>{t.settings}</H4>
                <Button 
                    size="$3" 
                    circular 
                    chromeless 
                    onPress={() => setSettingsOpen(false)}
                    icon={<Ionicons name="close" size={24} color={secondaryText} />}
                />
            </XStack>

            {/* Appearance */}
            <YStack space="$4">
                <Text fontSize={12} fontWeight="600" textTransform="uppercase" color={secondaryText} letterSpacing={1}>
                    {t.appearance}
                </Text>
                
                <XStack bg={activeBg} p="$1" br="$4" bw={0}>
                <Button 
                    f={1} 
                    bg={theme === 'dark' ? bgColor : 'transparent'} 
                    color={theme === 'dark' ? textColor : secondaryText}
                    onPress={() => setTheme('dark')}
                    chromeless={theme !== 'dark'}
                    pressStyle={{ opacity: 0.8 }}
                    br="$3"
                    shadowColor="rgba(0,0,0,0.1)"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={theme === 'dark' ? 0.2 : 0}
                    elevation={theme === 'dark' ? 2 : 0}
                >
                    {t.dark}
                </Button>
                <Button 
                    f={1} 
                    bg={theme === 'light' ? bgColor : 'transparent'} 
                    color={theme === 'light' ? textColor : secondaryText}
                    onPress={() => setTheme('light')}
                    chromeless={theme !== 'light'}
                    pressStyle={{ opacity: 0.8 }}
                    br="$3"
                    shadowColor="rgba(0,0,0,0.1)"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={theme === 'light' ? 0.2 : 0}
                    elevation={theme === 'light' ? 2 : 0}
                >
                    {t.light}
                </Button>
                </XStack>
            </YStack>

            {/* Language */}
            <YStack space="$4">
                <Text fontSize={12} fontWeight="600" textTransform="uppercase" color={secondaryText} letterSpacing={1}>
                    {t.language}
                </Text>
                
                <XStack bg={activeBg} p="$1" br="$4" bw={0}>
                <Button 
                    f={1} 
                    bg={language === 'en' ? bgColor : 'transparent'} 
                    color={language === 'en' ? textColor : secondaryText}
                    onPress={() => setLanguage('en')}
                    chromeless={language !== 'en'}
                    pressStyle={{ opacity: 0.8 }}
                    br="$3"
                    shadowColor="rgba(0,0,0,0.1)"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={language === 'en' ? 0.2 : 0}
                    elevation={language === 'en' ? 2 : 0}
                >
                    English
                </Button>
                <Button 
                    f={1} 
                    bg={language === 'ar' ? bgColor : 'transparent'} 
                    color={language === 'ar' ? textColor : secondaryText}
                    onPress={() => setLanguage('ar')}
                    chromeless={language !== 'ar'}
                    pressStyle={{ opacity: 0.8 }}
                    br="$3"
                    shadowColor="rgba(0,0,0,0.1)"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={language === 'ar' ? 0.2 : 0}
                    elevation={language === 'ar' ? 2 : 0}
                >
                    العربية
                </Button>
                </XStack>
            </YStack>

            {/* Footer Hints */}
            <YStack mt="auto" ai="center" space="$2">
                <Text color={secondaryText} fontSize={12}>{t.countPrompt}</Text>
                <Text color={secondaryText} fontSize={12}>{t.navPrompt}</Text>
            </YStack>
        </YStack>
      </Animated.View>
    </YStack>
  );
}