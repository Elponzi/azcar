import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAzkarStore } from '@/store/azkarStore';
import { MediaControlService } from '@/services/MediaControlService';
import { MediaControlServiceInterface } from '@/services/MediaControlService.interface';
import { TRANSLATIONS } from '@/constants/Translations';

// Helper to switch between web/native implementations dynamically if needed
const player: MediaControlServiceInterface = MediaControlService;

export function useSilentDriveMode() {
  const {
    currentCategory,
    currentIndex,
    filteredAzkar,
    language,
    isDriveModeEnabled,
  } = useAzkarStore();

  const appState = useRef(AppState.currentState);

  // 1. Lifecycle Management (Start on Active, Destroy on Background)
  useEffect(() => {
    if (!isDriveModeEnabled) {
      player.destroy();
      return;
    }

    const startSession = async () => {
      await player.setupPlayer();
      
      player.registerRemoteEvents(
        () => useAzkarStore.getState().nextZeker(),
        () => useAzkarStore.getState().prevZeker(),
        () => {}, // Play
        () => {}  // Pause
      );

      // Start playing
      await player.play();

      // Force sync metadata (as session was just reset)
      const state = useAzkarStore.getState();
      const currentZeker = state.filteredAzkar[state.currentIndex];
      if (currentZeker) {
        const t = TRANSLATIONS[state.language];
        const categoryKey = (state.currentCategory.charAt(0).toLowerCase() + state.currentCategory.slice(1)) as keyof typeof t;
        const categoryName = t[categoryKey] || state.currentCategory;
        const isRTL = state.language === 'ar';
        const artistName = isRTL ? `${t.adhkar} ${categoryName}` : `${categoryName} ${t.adhkar}`;

        player.updateMetadata({
          title: currentZeker.arabic,
          artist: artistName,
        });
      }
    };

    const stopSession = () => {
      player.destroy();
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground!
        startSession();
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background!
        stopSession();
      }

      appState.current = nextAppState;
    };

    // Initial check
    if (AppState.currentState === 'active') {
      startSession();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      stopSession();
    };
  }, [isDriveModeEnabled]);

  // 2. Sync Metadata (When content changes while active)
  useEffect(() => {
    if (!isDriveModeEnabled || AppState.currentState !== 'active') return;

    const currentZeker = filteredAzkar[currentIndex];
    const t = TRANSLATIONS[language];
    
    const categoryKey = (currentCategory.charAt(0).toLowerCase() + currentCategory.slice(1)) as keyof typeof t;
    const categoryName = t[categoryKey] || currentCategory;

    const isRTL = language === 'ar';
    const artistName = isRTL 
      ? `${t.adhkar} ${categoryName}` 
      : `${categoryName} ${t.adhkar}`;

    if (currentZeker) {
      player.updateMetadata({
        title: currentZeker.arabic,
        artist: artistName,
      });
    }
  }, [currentCategory, currentIndex, filteredAzkar, language, isDriveModeEnabled]);
}
