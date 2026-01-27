import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { useKeepAwake } from 'expo-keep-awake';
import { useAzkarStore } from '@/store/azkarStore';
import { normalizeArabic } from '@/utils';

// Web Speech API types
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const useSmartReading = () => {
  const {
    isSmartReadingEnabled,
    setSmartReadingEnabled,
    filteredAzkar,
    currentIndex,
    activeWordIndex,
    setActiveWordIndex,
    incrementCount,
    nextZeker,
    counts,
    currentCategory
  } = useAzkarStore();

  const [transcript, setTranscript] = useState("");

  useKeepAwake(); // Keep screen on while hook is active (technically component mounted, but we can guard it)

  const currentZeker = filteredAzkar[currentIndex];
  const recognitionRef = useRef<any>(null);
  const isWeb = Platform.OS === 'web';
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);

  // Split current zeker text into normalized words for matching
  const expectedWords = currentZeker?.arabic 
    ? currentZeker.arabic.split(/\s+/).map(normalizeArabic).filter(w => w.length > 0)
    : [];

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(() => {
      if (isSmartReadingEnabled) {
        setSmartReadingEnabled(false); // Stop after 30s silence
      }
    }, 30000);
  }, [isSmartReadingEnabled, setSmartReadingEnabled]);

  const handleMatch = useCallback((spokenText: string) => {
    resetSilenceTimer();
    setTranscript(spokenText);
    
    if (activeWordIndex >= expectedWords.length) return;

    const normalizedSpoken = normalizeArabic(spokenText);
    const spokenWords = normalizedSpoken.split(/\s+/);

    let nextIndex = activeWordIndex;
    if (nextIndex === -1) nextIndex = 0;
    
    let matchesFound = 0;

    // Greedy sequential matching
    for (const word of spokenWords) {
        if (nextIndex >= expectedWords.length) break;
        
        const expected = expectedWords[nextIndex];
        
        // 1. Exact Match
        if (word === expected) {
             nextIndex++;
             matchesFound++;
             continue;
        }

        // 2. Fuzzy Match (Constrained)
        // Only allow substring matching for longer words to avoid false positives with short particles
        if (word.length > 3 && expected.length > 3) {
            const isSubstring = word.includes(expected) || expected.includes(word);
            const lengthDiff = Math.abs(word.length - expected.length);

            if (isSubstring && lengthDiff <= 2) {
                nextIndex++;
                matchesFound++;
            }
        }
    }
    
    if (matchesFound > 0) {
       setActiveWordIndex(nextIndex);

       // Check completion
       if (nextIndex >= expectedWords.length) {
          // Finished the Zeker!
          incrementCount();
          
          // FOR WEB: Stop recognition to clear cumulative buffer
          if (isWeb && recognitionRef.current) {
              recognitionRef.current.stop();
          }

          // Small delay for UI to show full highlight
          setTimeout(() => {
             const updatedCount = (counts[currentZeker.id] || 0) + 1;
             if (updatedCount >= currentZeker.target) {
                 // Next Zeker
                 setTimeout(() => {
                     nextZeker();
                     // Recognition will restart via useEffect because isSmartReadingEnabled is still true
                 }, 1500);
             } else {
                 // Reset for next repetition
                 setActiveWordIndex(0);
                 setTranscript("");
                 // For web, if we stopped it, restart it now
                 if (isWeb && isSmartReadingEnabled && recognitionRef.current) {
                     try { recognitionRef.current.start(); } catch(e){}
                 }
             }
          }, 300);
       }
    }

  }, [activeWordIndex, expectedWords, incrementCount, nextZeker, counts, currentZeker, setActiveWordIndex, resetSilenceTimer]);


  const handleMatchRef = useRef(handleMatch);
  const isStopping = useRef(false);

  useEffect(() => {
    handleMatchRef.current = handleMatch;
  }, [handleMatch]);

  // Web Implementation
  useEffect(() => {
    if (!isWeb || !isSmartReadingEnabled) return;

    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      setSmartReadingEnabled(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ar-SA'; // Arabic

    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const text = lastResult[0].transcript;
      handleMatchRef.current(text);
    };

    recognition.onerror = (event: any) => {
        if (event.error === 'aborted') {
            return;
        }
        console.error("Speech Error", event.error);
        if (event.error === 'not-allowed') {
            setSmartReadingEnabled(false);
        }
    };

    recognition.onend = () => {
        if (isSmartReadingEnabled && !isStopping.current) {
            try {
                recognition.start();
            } catch (e) { /* ignore */ }
        }
    };

    isStopping.current = false;
    try {
        recognition.start();
    } catch (e) {
        console.warn("Failed to start recognition", e);
    }
    recognitionRef.current = recognition;

    return () => {
      isStopping.current = true;
      recognition.stop();
    };
  }, [isWeb, isSmartReadingEnabled]); // Removed handleMatch from dependencies


  // Native Implementation
  useEffect(() => {
    if (isWeb) return;

    const onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        handleMatch(e.value[0]);
      }
    };
    
    const onSpeechError = (e: any) => {
        console.log("Voice Error", e);
        // Don't auto-disable immediately on simple errors, but maybe on specific ones
    };

    if (isSmartReadingEnabled) {
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;
      
      Voice.start('ar-SA').catch(e => {
          console.error("Failed to start Voice", e);
          setSmartReadingEnabled(false);
      });

      resetSilenceTimer();
    } else {
      Voice.stop().catch(() => {});
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    }

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, [isWeb, isSmartReadingEnabled, handleMatch]);

  return { transcript };
};
