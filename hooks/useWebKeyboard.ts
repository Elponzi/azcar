import { useEffect } from 'react';
import { Platform } from 'react-native';

interface KeyboardHandlers {
  onIncrement: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function useWebKeyboard({ onIncrement, onNext, onPrev }: KeyboardHandlers) {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          onIncrement();
        } else if (e.code === 'ArrowRight') {
          onNext();
        } else if (e.code === 'ArrowLeft') {
          onPrev();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [onIncrement, onNext, onPrev]);
}
