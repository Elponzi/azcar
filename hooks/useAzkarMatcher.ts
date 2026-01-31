import { useState, useCallback, useEffect, useRef } from 'react';
import { normalizeArabic, levenshtein, tokenizeArabicText } from '@/utils';

const MAX_SKIP = 2;
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

interface UseAzkarMatcherProps {
  targetText?: string;
  onComplete?: () => void;
  onStopRequest?: () => void; // Callback to request stopping recognition
  autoReset?: boolean; // If true, resets index on complete instead of requesting stop
}

export function useAzkarMatcher({ targetText = "", onComplete, onStopRequest, autoReset = false }: UseAzkarMatcherProps) {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  
  // Refs
  const currentWordIndexRef = useRef(0);
  const targetWordsRef = useRef<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  const onStopRequestRef = useRef(onStopRequest);

  // Sync refs
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onStopRequestRef.current = onStopRequest;
  }, [onComplete, onStopRequest]);

  // Reset logic when target text changes
  useEffect(() => {
    if (targetText) {
      targetWordsRef.current = tokenizeArabicText(targetText).map(w => normalizeArabic(w));
    } else {
      targetWordsRef.current = [];
    }
    setActiveWordIndex(0);
    currentWordIndexRef.current = 0;
  }, [targetText]);

  const processTranscript = useCallback((transcriptText: string, isFinal: boolean) => {
    const spokenWords = tokenizeArabicText(transcriptText);
    if (spokenWords.length === 0) return;

    const newIndex = calculateMatchIndex(
      spokenWords,
      targetWordsRef.current,
      currentWordIndexRef.current
    );

    if (isFinal) {
      // Logic for completion
      if (newIndex >= targetWordsRef.current.length) {
        onCompleteRef.current?.();
        
        if (autoReset) {
           // Reset for next repetition
           currentWordIndexRef.current = 0;
           setActiveWordIndex(0);
        } else {
           // Commit final index and request stop
           currentWordIndexRef.current = newIndex;
           setActiveWordIndex(newIndex);
           onStopRequestRef.current?.();
        }
      } else {
        // Not complete, just commit index
        currentWordIndexRef.current = newIndex;
        setActiveWordIndex(newIndex);
      }
    } else {
      // Only update preview if we moved forward
      if (newIndex > currentWordIndexRef.current) {
        setActiveWordIndex(newIndex);
      }
    }
  }, [autoReset]); // Add autoReset dependency

  return {
    activeWordIndex,
    processTranscript
  };
}
