import * as React from 'react';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

import { useSilentDriveMode } from '@/hooks/useSilentDriveMode';
import { setupNativePlayer } from '@/services/TrackPlayerSetup';
import { useAzkarStore } from '@/store/azkarStore';
import { useKeepAwake } from '@/hooks/useKeepAwake';
import { PremiumSplashScreen } from '@/components/SplashScreen';

// Polyfill for legacy components that expect React.default (React 19/ESM interop)
if (!React.default) {
  (React as any).default = React;
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
if (typeof window !== 'undefined') {
  SplashScreen.preventAutoHideAsync();
}

setupNativePlayer();

export default function RootLayout() {
  useKeepAwake();

  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);

  // Load fonts safely. Spread only if FontAwesome.font exists to prevent SSR crashes.
  const [loaded, error] = useFonts({
    Tajawal: require('../assets/fonts/Tajawal-Regular.ttf'),
    Amiri: require('../assets/fonts/Amiri-Bold.ttf'),
    ReemKufi: require('../assets/fonts/ReemKufi-Bold.ttf'),
    ...(FontAwesome ? FontAwesome.font : {}),
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
      if (typeof window !== 'undefined') {
        SplashScreen.hideAsync();
      }
    }
  }, [loaded, isHydrated]);

  if (!loaded || !isHydrated) {
    return null;
  }

  if (!isSplashAnimationFinished) {
    return (
      <TamaguiProvider config={config} defaultTheme="dark">
        <PremiumSplashScreen onAnimationComplete={() => setIsSplashAnimationFinished(true)} />
      </TamaguiProvider>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const currentTheme = useAzkarStore((state) => state.theme);
  const language = useAzkarStore((state) => state.language);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <TamaguiProvider config={config} defaultTheme={currentTheme} dir={dir}>
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
