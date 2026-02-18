import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { useAzkarStore } from '@/store/azkarStore';

/**
 * Encapsulates completion logic (manual or auto):
 * sound player, navigation guards, and completion handlers.
 */
export function useAutoComplete() {
  const currentIndex = useAzkarStore((s) => s.currentIndex);
  const nextZeker = useAzkarStore((s) => s.nextZeker);
  const player = useAudioPlayer(require('@/assets/sounds/switch.mp3'));
  
  const isNavigatingRef = useRef(false);
  const stopRecognitionRef = useRef<() => void>(() => {});

  // Reset navigation guard when the current zeker changes
  useEffect(() => {
    isNavigatingRef.current = false;
  }, [currentIndex]);

  const handleZekerCompleted = useCallback(() => {
    if (isNavigatingRef.current) return;
    
    player.seekTo(0);
    player.play();

    // Re-check state inside the delay
    setTimeout(() => {
      const state = useAzkarStore.getState();
      if (state.currentIndex < state.filteredAzkar.length - 1) {
        isNavigatingRef.current = true;
        nextZeker();
      } else {
        stopRecognitionRef.current();
      }
    }, 600);
  }, [player, nextZeker]);

  const handleAutoComplete = useCallback(() => {
    const store = useAzkarStore.getState();
    store.incrementCount();

    const freshState = useAzkarStore.getState();
    const activeZeker = freshState.filteredAzkar[freshState.currentIndex];
    const currentCount = freshState.counts[activeZeker.id] || 0;

    if (currentCount >= activeZeker.target) {
      handleZekerCompleted();
    }
  }, [handleZekerCompleted]);

  const playSuccessSound = useCallback(() => {
    player.seekTo(0);
    player.play();
  }, [player]);

  return { handleAutoComplete, stopRecognitionRef, playSuccessSound, handleZekerCompleted };
}