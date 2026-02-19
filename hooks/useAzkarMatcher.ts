import { useState, useCallback, useEffect, useRef } from 'react';
import { normalizeArabic, levenshtein, tokenizeArabicText } from '@/utils';

const MAX_SKIP = 2;
const MIN_FUZZY_LENGTH = 3;

function maxAllowedDistance(length: number): number {
  if (length < MIN_FUZZY_LENGTH) return 0;
  if (length <= 4) return 1; // "الله" (4) vs "والله" (5) is 1 error.
  if (length <= 8) return 2;
  return 3;
}

/**
 * Pure matching logic.
 * Returns the number of full completions and the current index within the target.
 * Wraps around when the end of the target is reached, counting each completion.
 */
function calculateMatchIndex(
  spokenWords: string[],
  targetWords: string[],
  startIndex: number
): { completions: number; currentIndex: number } {
  let idx = startIndex;
  const total = targetWords.length;
  let completions = 0;

  if (total === 0) return { completions: 0, currentIndex: 0 };

  for (const spoken of spokenWords) {
    // Wrap around if we completed the target
    // We check this at the start of loop for each word
    if (idx >= total) {
      completions++;
      idx = 0;
    }

    // 1. Exact match at current position
    if (spoken === targetWords[idx]) {
      idx++;
      continue;
    }

    // 2. Fuzzy match at current position
    const currentRef = targetWords[idx];
    // Use the maximum of reference or spoken length for fuzzy thresholding
    const refLen = currentRef.length;
    const currentMaxDist = maxAllowedDistance(refLen);
    
    if (currentMaxDist > 0 && levenshtein(spoken, currentRef, currentMaxDist) <= currentMaxDist) {
      idx++;
      continue;
    }

    // 3. Look-ahead for skipped words (slight stutter or missed word)
    const maxLook = Math.min(MAX_SKIP, total - idx - 1);
    let matchedInLookahead = false;
    for (let skip = 1; skip <= maxLook; skip++) {
      const candidate = targetWords[idx + skip];
      const isExact = spoken === candidate;
      const candidateMaxDist = maxAllowedDistance(candidate.length);
      const isFuzzy =
        !isExact && candidateMaxDist > 0 &&
        levenshtein(spoken, candidate, candidateMaxDist) <= candidateMaxDist;

      if (isExact || isFuzzy) {
        idx = idx + skip + 1;
        matchedInLookahead = true;
        break;
      }
    }
    
    if (matchedInLookahead) continue;
  }

  // Final boundary check after loop
  if (idx >= total) {
    completions++;
    idx = 0;
  }

  return { completions, currentIndex: idx };
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
  const completionsFiredRef = useRef(0);
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
    completionsFiredRef.current = 0;
  }, [targetText]);

  const processTranscript = useCallback((transcriptText: string, isFinal: boolean) => {
    const spokenWords = tokenizeArabicText(transcriptText).map(normalizeArabic);
    if (spokenWords.length === 0) return;

    if (autoReset) {
      // --- autoReset path: cumulative transcript, wrap-around counting ---
      const { completions, currentIndex } = calculateMatchIndex(
        spokenWords,
        targetWordsRef.current,
        currentWordIndexRef.current
      );

      // Fire onComplete only for NEW completions (delta from what we already fired)
      const newCompletions = completions - completionsFiredRef.current;
      for (let i = 0; i < newCompletions; i++) {
        onCompleteRef.current?.();
      }
      completionsFiredRef.current = completions;

      // Update visual highlight to show wrap-around progress
      // Within an interim segment, we only move highlight FORWARD to avoid flickering
      // if the speech recognition engine re-evaluates and regresses.
      if (completions > 0 || currentIndex > activeWordIndex) {
         setActiveWordIndex(currentIndex);
      }

      if (isFinal) {
        // Speech segment ended — commit position and reset completion tracking
        currentWordIndexRef.current = currentIndex;
        completionsFiredRef.current = 0;
        // On final result, always sync the highlight
        setActiveWordIndex(currentIndex);
      }
    } else {
      // --- non-autoReset path: original behavior (complete once, then stop) ---
      const { completions, currentIndex } = calculateMatchIndex(
        spokenWords,
        targetWordsRef.current,
        currentWordIndexRef.current
      );

      if (isFinal) {
        if (completions > 0) {
          onCompleteRef.current?.();
          currentWordIndexRef.current = currentIndex;
          setActiveWordIndex(currentIndex);
          onStopRequestRef.current?.();
        } else {
          currentWordIndexRef.current = currentIndex;
          setActiveWordIndex(currentIndex);
        }
      } else {
        // Preview: update highlight if we moved forward or completed
        if (completions > 0 || currentIndex > activeWordIndex) {
          setActiveWordIndex(currentIndex);
        }
      }
    }
  }, [autoReset, activeWordIndex]);

  return {
    activeWordIndex,
    processTranscript
  };
}
