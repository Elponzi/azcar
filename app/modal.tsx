import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { YStack, XStack, H2, H4, Text, Switch, Button, Label, Separator, Group } from 'tamagui';
import { useAzkarStore } from '@/store/azkarStore';
import { router } from 'expo-router';
import { TRANSLATIONS } from '@/constants/Translations';

export default function ModalScreen() {
  const { theme, setTheme, language, setLanguage } = useAzkarStore();
  const t = TRANSLATIONS[language];

  return (
    <YStack f={1} bg="$background" p="$5" space="$5">
      <XStack jc="space-between" ai="center">
        <H2>{t.settings}</H2>
        <Button chromeless onPress={() => router.back()}>{t.done}</Button>
      </XStack>

      <Separator />

      <YStack space="$4">
        <H4 color="$color05" textTransform="uppercase" fontSize={14}>{t.appearance}</H4>
        
        <XStack bg="$backgroundHover" p="$2" br="$4" bw={1} bc="$borderColor">
          <Button 
            f={1} 
            theme={theme === 'dark' ? 'active' : undefined} 
            onPress={() => setTheme('dark')}
            chromeless={theme !== 'dark'}
          >
            {t.dark}
          </Button>
          <Button 
            f={1} 
            theme={theme === 'light' ? 'active' : undefined} 
            onPress={() => setTheme('light')}
            chromeless={theme !== 'light'}
          >
            {t.light}
          </Button>
        </XStack>
      </YStack>

      <YStack space="$4">
        <H4 color="$color05" textTransform="uppercase" fontSize={14}>{t.language}</H4>
        
        <XStack bg="$backgroundHover" p="$2" br="$4" bw={1} bc="$borderColor">
          <Button 
            f={1} 
            theme={language === 'en' ? 'active' : undefined} 
            onPress={() => setLanguage('en')}
            chromeless={language !== 'en'}
          >
            English
          </Button>
          <Button 
            f={1} 
            theme={language === 'ar' ? 'active' : undefined} 
            onPress={() => setLanguage('ar')}
            chromeless={language !== 'ar'}
          >
            العربية
          </Button>
        </XStack>
      </YStack>

      <YStack mt="auto" ai="center" space="$2">
         <Text color="$color05" fontSize={12}>{t.countPrompt}</Text>
         <Text color="$color05" fontSize={12}>{t.navPrompt}</Text>
      </YStack>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </YStack>
  );
}
