import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { normalizeArabic, levenshtein, tokenizeArabicText } from '@/utils';

interface UseSmartTrackProps {
  targetText?: string;
  onComplete?: () => void;
}

const MAX_SKIP = 3;
const MIN_FUZZY_LENGTH = 3;

function maxAllowedDistance(length: number): number {
  if (length < MIN_FUZZY_LENGTH) return 0;
  if (length <= 5) return 1;
  return 2;
}

/**
 * Pure matching logic.
 * Returns the new index based on spoken words and current target state.
 */
function calculateMatchIndex(
  spokenWords: string[], 
  targetWords: string[], 
  startIndex: number
): number {
  let idx = startIndex;
  const total = targetWords.length;

  for (const spoken of spokenWords) {
    if (idx >= total) break;
    const normalizedSpoken = normalizeArabic(spoken);

    // 1. Exact match at current position
    if (normalizedSpoken === targetWords[idx]) {
      idx++;
      continue;
    }

    // 2. Fuzzy match at current position
    const currentRef = targetWords[idx];
    const currentMaxDist = maxAllowedDistance(currentRef.length);
    if (currentMaxDist > 0 && levenshtein(normalizedSpoken, currentRef) <= currentMaxDist) {
      idx++;
      continue;
    }

    // 3. Look-ahead for skipped words
    const maxLook = Math.min(MAX_SKIP, total - idx - 1);
    for (let skip = 1; skip <= maxLook; skip++) {
      const candidate = targetWords[idx + skip];
      const isExact = normalizedSpoken === candidate;
      const candidateMaxDist = maxAllowedDistance(candidate.length);
      const isFuzzy =
        !isExact && candidateMaxDist > 0 &&
        levenshtein(normalizedSpoken, candidate) <= candidateMaxDist;

      if (isExact || isFuzzy) {
        idx = idx + skip + 1;
        break;
      }
    }
  }
  return idx;
}

export function useSmartTrack({ targetText = "", onComplete }: UseSmartTrackProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState(0); 
  
  // Refs
  const currentWordIndexRef = useRef(0);
  const targetWordsRef = useRef<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  const webRecognitionRef = useRef<any>(null);

  // Sync refs and reset on new target
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (targetText) {
      // Split raw text first, then normalize each word to preserve punctuation alignment
      targetWordsRef.current = tokenizeArabicText(targetText).map(w => normalizeArabic(w));
    } else {
      targetWordsRef.current = [];
    }
    setActiveWordIndex(0);
    currentWordIndexRef.current = 0;
    setTranscript("");
  }, [targetText]);

  const processResult = useCallback((transcriptText: string, isFinal: boolean) => {
    const spokenWords = tokenizeArabicText(transcriptText);
    if (spokenWords.length === 0) return;

    const newIndex = calculateMatchIndex(
      spokenWords,
      targetWordsRef.current,
      currentWordIndexRef.current
    );

    if (isFinal) {
      currentWordIndexRef.current = newIndex;
      setActiveWordIndex(newIndex);
      
      if (newIndex >= targetWordsRef.current.length) {
        onCompleteRef.current?.();
        setIsListening(false);
        if (Platform.OS === 'web') {
           webRecognitionRef.current?.stop();
        } else {
           ExpoSpeechRecognitionModule.stop();
        }
      }
    } else {
      // Only update preview if we moved forward
      if (newIndex > currentWordIndexRef.current) {
        setActiveWordIndex(newIndex);
      }
    }
  }, []);

  // Web Initialization
  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e: any) => { console.error("Web Speech Error:", e); setIsListening(false); };
        
        recognition.onresult = (event: any) => {
           for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              const text = res[0].transcript;
              const isFinal = res.isFinal;
              setTranscript(text);
              processResult(text, isFinal);
           }
        };
        
        webRecognitionRef.current = recognition;
        setPermissionStatus('granted'); // Assume granted or prompt will show
      } else {
        console.warn("Web Speech API not supported in this browser.");
      }
    }
  }, [processResult]);

  // Native Events
  if (Platform.OS !== 'web') {
    useSpeechRecognitionEvent("start", () => setIsListening(true));
    useSpeechRecognitionEvent("end", () => setIsListening(false));
    
    useSpeechRecognitionEvent("result", (event: any) => {
      const text = event?.results?.[0]?.transcript || event?.transcript || "";
      const isFinal = event?.isFinal || false;
      
      setTranscript(text);
      processResult(text, isFinal);
    });

    useSpeechRecognitionEvent("error", (event: any) => {
      console.log("Speech recognition error:", event);
      setIsListening(false);
    });
  }

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  const startRecognition = useCallback(async () => {
    if (Platform.OS === 'web') {
        try {
          webRecognitionRef.current?.start();
        } catch(e) { console.error(e); }
        return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: "ar-SA",
        interimResults: true,
        continuous: true,
      });
    } catch (e) {
      console.error("Failed to start:", e);
      setIsListening(false);
    }
  }, [requestPermissions]);

  const stopRecognition = useCallback(() => {
    if (Platform.OS === 'web') {
        webRecognitionRef.current?.stop();
        return;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (e) {
      console.error("Failed to stop:", e);
    }
  }, []);

  return {
    isListening,
    transcript,
    permissionStatus,
    activeWordIndex,
    startRecognition,
    stopRecognition,
  };
}
