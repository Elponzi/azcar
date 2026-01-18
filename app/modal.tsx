import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { YStack, Text, H2, H4, XStack, Button, Separator, Theme, useTheme } from 'tamagui';
import { useAzkarStore } from '../store/azkarStore';

export default function ModalScreen() {
  const { theme, language, setTheme, setLanguage } = useAzkarStore();
  const activeTheme = useTheme();

  return (
    <Theme name={theme}>
      <YStack f={1} ai="center" jc="flex-start" p="$4" backgroundColor="$background">
        
        <H2 mt="$4">Settings</H2>
        <Separator my="$4" w="80%" />

        {/* Theme Settings */}
        <YStack w="100%" gap="$2" mb="$6">
          <H4 color="$color10" textTransform="uppercase" fontSize="$3">Appearance</H4>
          <XStack backgroundColor="$color3" borderRadius="$4" p="$1">
            <Button 
              flex={1} 
              theme={theme === 'dark' ? 'active' : null}
              backgroundColor={theme === 'dark' ? '$background' : 'transparent'}
              onPress={() => setTheme('dark')}
            >
              Dark 🌙
            </Button>
            <Button 
              flex={1} 
              theme={theme === 'light' ? 'active' : null}
              backgroundColor={theme === 'light' ? '$background' : 'transparent'}
              onPress={() => setTheme('light')}
            >
              Light ☀️
            </Button>
          </XStack>
        </YStack>

        {/* Language Settings */}
        <YStack w="100%" gap="$2">
          <H4 color="$color10" textTransform="uppercase" fontSize="$3">Language</H4>
          <XStack backgroundColor="$color3" borderRadius="$4" p="$1">
            <Button 
              flex={1} 
              theme={language === 'en' ? 'active' : null}
              backgroundColor={language === 'en' ? '$background' : 'transparent'}
              onPress={() => setLanguage('en')}
            >
              English
            </Button>
            <Button 
              flex={1} 
              theme={language === 'ar' ? 'active' : null}
              backgroundColor={language === 'ar' ? '$background' : 'transparent'}
              onPress={() => setLanguage('ar')}
            >
              العربية
            </Button>
          </XStack>
        </YStack>

        {/* Use a light status bar on iOS to account for the black space above the modal */}
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      </YStack>
    </Theme>
  );
}