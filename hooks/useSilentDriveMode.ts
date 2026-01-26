import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAzkarStore } from '@/store/azkarStore';
import { MediaControlService } from '@/services/MediaControlService';
import { MediaControlServiceInterface } from '@/services/MediaControlService.interface';
import { TRANSLATIONS } from '@/constants/Translations';

// Helper to switch between web/native implementations dynamically if needed, 
// but metro usually handles .web.ts extension resolution automatically.
// Since we import from '@/services/MediaControlService', Metro picks the right one.
const player: MediaControlServiceInterface = MediaControlService;

export function useSilentDriveMode() {
  const {
    currentCategory,
    currentIndex,
    filteredAzkar,
    nextZeker,
    prevZeker,
    language,
  } = useAzkarStore();

  const appState = useRef(AppState.currentState);

  // 1. Setup Player & Register Events (Run Once)
  useEffect(() => {
    const init = async () => {
      await player.setupPlayer();
      
      player.registerRemoteEvents(
        () => {
             // onNext
             // We need to call the store's nextZeker. 
             // Since this callback might close over stale state if not careful,
             // using the store hook directly ensures we have access to functions.
             // But 'nextZeker' from useAzkarStore is stable (Zustand).
             useAzkarStore.getState().nextZeker();
        },
        () => {
             // onPrev
             useAzkarStore.getState().prevZeker();
        },
        () => {
            // onPlay - Resume "Silent" (Drive Mode Active)
            // No-op mostly, just ensure loop continues
        },
        () => {
            // onPause - Maybe user wants to stop Drive Mode manually via headset?
            // We can respect it.
        }
      );

      // Start playing if active
      if (AppState.currentState === 'active') {
        player.play();
      }
    };

    init();

    return () => {
        // Cleanup if needed
        // player.destroy(); 
    };
  }, []);

  // 2. Sync Metadata
  useEffect(() => {
    const currentZeker = filteredAzkar[currentIndex];
    const t = TRANSLATIONS[language];
    
    // Convert PascalCase category to camelCase key for translation lookup
    const categoryKey = (currentCategory.charAt(0).toLowerCase() + currentCategory.slice(1)) as keyof typeof t;
    const categoryName = t[categoryKey] || currentCategory;

    const isRTL = language === 'ar';
    const artistName = isRTL 
      ? `${t.adhkar} ${categoryName}` 
      : `${categoryName} ${t.adhkar}`;

    if (currentZeker) {
      player.updateMetadata({
        title: currentZeker.arabic, // Truncate if needed? Usually OS handles it.
        artist: artistName,
        // artwork: ... // We could pass an icon
      });
    }
  }, [currentCategory, currentIndex, filteredAzkar, language]);

  // 3. Handle AppState (Background/Foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground!
        player.play();
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background!
        player.pause();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
