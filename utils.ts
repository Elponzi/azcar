/**
 * Remove Arabic diacritical marks (tashkeel/harakat)
 */
export const removeTashkeel = (text: string): string => {
  return text.replace(/[\u0617-\u061A\u064B-\u065F\u0670\u0671\u06D6-\u06DC\u06DE-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9]/g, '');
};

/**
 * Normalize Arabic text for comparison:
 * - Remove tashkeel (diacritical marks)
 * - Normalize alif variants (أ إ آ ا) → ا
 * - Normalize ta marbuta (ة) → ه
 * - Normalize alif maksura (ى) → ي
 * - Remove tatweel (ـ)
 */
export const normalizeArabicText = (text: string): string => {
  let normalized = removeTashkeel(text);

  // Normalize alif variants to plain alif
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');

  // Normalize ta marbuta to ha
  normalized = normalized.replace(/ة/g, 'ه');

  // Normalize alif maksura to ya
  normalized = normalized.replace(/ى/g, 'ي');

  // Remove tatweel (kashida)
  normalized = normalized.replace(/ـ/g, '');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
};

/**
 * Split Arabic text into words for matching
 * Handles punctuation and special characters
 */
export const splitIntoWords = (text: string): string[] => {
  // Remove common Arabic punctuation and symbols
  const cleaned = text
    .replace(/[،؛؟!:«»""''().٭۞﴾﴿]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.split(' ').filter(word => word.length > 0);
};

/**
 * Fuzzy match two Arabic words
 * Returns a confidence score from 0 to 1
 */
export const fuzzyMatchArabicWord = (spoken: string, expected: string): number => {
  const normalizedSpoken = normalizeArabicText(spoken);
  const normalizedExpected = normalizeArabicText(expected);

  // Exact match after normalization
  if (normalizedSpoken === normalizedExpected) {
    return 1.0;
  }

  // One contains the other (handles partial recognition)
  if (normalizedExpected.includes(normalizedSpoken) || normalizedSpoken.includes(normalizedExpected)) {
    const ratio = Math.min(normalizedSpoken.length, normalizedExpected.length) /
                  Math.max(normalizedSpoken.length, normalizedExpected.length);
    if (ratio > 0.6) {
      return ratio;
    }
  }

  // Levenshtein distance for close matches
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);

  if (maxLen === 0) return 0;

  const similarity = 1 - (distance / maxLen);
  return similarity > 0.7 ? similarity : 0;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array for dynamic programming
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
};

/**
 * Check if a word matches with threshold
 */
export const isWordMatch = (spoken: string, expected: string, threshold = 0.7): boolean => {
  return fuzzyMatchArabicWord(spoken, expected) >= threshold;
};