import { useEffect, useRef, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { useAzkarStore } from '@/store/azkarStore';

/**
 * Encapsulates auto-advance-on-completion logic:
 * sound player, navigation guard, and the handleAutoComplete callback.
 */
export function useAutoComplete() {
  const currentIndex = useAzkarStore((s) => s.currentIndex);
  const player = useAudioPlayer(require('@/assets/sounds/switch.mp3'));
  const isNavigatingRef = useRef(false);
  const stopRecognitionRef = useRef<() => void>(() => {});

  // Reset navigation guard when the current zeker changes
  useEffect(() => {
    isNavigatingRef.current = false;
  }, [currentIndex]);

  const handleAutoComplete = useCallback(() => {
    useAzkarStore.getState().incrementCount();

    const state = useAzkarStore.getState();
    const activeZeker = state.filteredAzkar[state.currentIndex];
    const currentCount = state.counts[activeZeker.id] || 0;

    if (currentCount >= activeZeker.target) {
      player.seekTo(0);
      player.play();

      setTimeout(() => {
        if (isNavigatingRef.current) return;

        // Re-read state to avoid acting on stale values
        const fresh = useAzkarStore.getState();
        if (fresh.currentIndex < fresh.filteredAzkar.length - 1) {
          isNavigatingRef.current = true;
          fresh.nextZeker();
        } else {
          stopRecognitionRef.current();
        }
      }, 600);
    }
  }, [player]);

  const playSuccessSound = useCallback(() => {
    player.seekTo(0);
    player.play();
  }, [player]);

  return { handleAutoComplete, stopRecognitionRef, playSuccessSound };
}
