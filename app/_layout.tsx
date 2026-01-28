import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useKeepAwake } from 'expo-keep-awake';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

import { useAzkarStore } from '@/store/azkarStore';
import { useSilentDriveMode } from '@/hooks/useSilentDriveMode';
import { setupNativePlayer } from '@/services/TrackPlayerSetup';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

setupNativePlayer();

export default function RootLayout() {
  useKeepAwake();
  const [loaded, error] = useFonts({
    Tajawal: require('../assets/fonts/Tajawal-Regular.ttf'),
    Amiri: require('../assets/fonts/Amiri-Bold.ttf'),
    ReemKufi: require('../assets/fonts/ReemKufi-Bold.ttf'),
    ...FontAwesome.font,
  });

  const isHydrated = useAzkarStore((state) => state.isHydrated);

  // Initialize Silent Drive Mode
  useSilentDriveMode();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isHydrated]);

  if (!loaded || !isHydrated) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const currentTheme = useAzkarStore((state) => state.theme);

  return (
    <TamaguiProvider config={config} defaultTheme={currentTheme}>
      <ThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="[category]" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
