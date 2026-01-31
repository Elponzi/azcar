import { levenshtein, normalizeArabic } from '@/utils';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

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

export function useSmartTrack({ targetText = "", onComplete }: UseSmartTrackProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState(0); // This represents the "committed" index
  
  // Refs
  const currentWordIndexRef = useRef(0);
  const targetWordsRef = useRef<string[]>([]);
  const onCompleteRef = useRef(onComplete);

  // Sync refs and reset on new target
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (targetText) {
      // Split raw text into tokens by whitespace
      const rawTokens = targetText.split(/\s+/).filter(Boolean);
      // Normalize each token (this removes commas/punctuation from the comparison base)
      targetWordsRef.current = rawTokens.map(w => normalizeArabic(w)).filter(w => w.length > 0);
    } else {
      targetWordsRef.current = [];
    }
    // Reset state when target changes
    setActiveWordIndex(0);
    currentWordIndexRef.current = 0;
    setTranscript("");
  }, [targetText]);

  // Matching Logic (Adapted from temp.ts)
  const matchWords = useCallback(
    (transcriptText: string, isFinal: boolean) => {
      const spokenWords = transcriptText.trim().split(/\s+/).filter(Boolean);
      if (spokenWords.length === 0) return;

      let idx = currentWordIndexRef.current;
      const total = targetWordsRef.current.length;
      const normalizedTargetWords = targetWordsRef.current; // Already normalized in ref? No, ref stores normalized?
      // Wait, in useEffect I did normalizeArabic(targetText). So they are normalized.

      for (const spoken of spokenWords) {
        if (idx >= total) break;
        const normalizedSpoken = normalizeArabic(spoken);

        // 1. Exact match at current position
        console.log("normalizedSpoken", normalizedSpoken, "normalizedTargetWords[idx]", normalizedTargetWords[idx]);
        if (normalizedSpoken === normalizedTargetWords[idx]) {
          idx++;
          continue;
        }

        // 2. Fuzzy match at current position
        const currentRef = normalizedTargetWords[idx];
        const currentMaxDist = maxAllowedDistance(currentRef.length);
        if (currentMaxDist > 0 && levenshtein(normalizedSpoken, currentRef) <= currentMaxDist) {
          idx++;
          continue;
        }

        // 3. Look-ahead for skipped words
        const maxLook = Math.min(MAX_SKIP, total - idx - 1);
        for (let skip = 1; skip <= maxLook; skip++) {
          const candidate = normalizedTargetWords[idx + skip];
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
        // No match found → ignore this spoken word
      }

      if (isFinal) {
        currentWordIndexRef.current = idx;
        setActiveWordIndex(idx);
        
        if (idx >= total) {
          onCompleteRef.current?.();
          setIsListening(false);
          ExpoSpeechRecognitionModule.stop(); // Use stop instead of abort for cleaner end?
        }
      } else {
        // Preview logic: We can update activeWordIndex strictly or use a separate preview state
        // For now, let's update activeWordIndex to give real-time feedback
        // But prevent it from going backward if previous final was higher (which shouldn't happen with correct logic)
        if (idx > currentWordIndexRef.current) {
             setActiveWordIndex(idx);
        }
      }
    },
    []
  );

  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  
  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event?.results?.[0]?.transcript || event?.transcript || "";
    const isFinal = event?.isFinal || false;
    
    setTranscript(text); // Keep showing raw transcript for debug
    matchWords(text, isFinal);
  });

  useSpeechRecognitionEvent("error", (event: any) => {
    console.log("Speech recognition error:", event);
    setIsListening(false);
  });

  const requestPermissions = useCallback(async () => {
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  const startRecognition = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Reset loop index ONLY if we finished previous or user manually reset? 
    // Usually we want to continue from where we left off if paused.
    // But if we are starting fresh on a new Zeker, useEffect handles that.
    
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
