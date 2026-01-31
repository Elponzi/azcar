/**
 * Comprehensive Arabic text normalizer.
 *
 * Handles the many orthographic variations that cause identical-sounding
 * Arabic words to differ in their written Unicode representation.
 * Applied symmetrically to both the reference paragraph and the speech
 * recogniser output so that comparisons are forgiving of surface differences.
 *
 * Pipeline (order matters):
 *  1. Strip diacritics / tashkeel
 *  2. Strip tatweel (kashida)
 *  3. Normalise Hamza carriers  →  bare seat
 *  4. Normalise Alef variants   →  plain Alef
 *  5. Normalise Taa Marbuta      →  Haa
 *  6. Normalise Alef Maksura     →  Yaa
 *  7. Normalise Waw / Yaa Hamza  →  Waw / Yaa
 *  8. Strip non-Arabic characters (punctuation, digits, Latin, etc.)
 */

// ── 1. Diacritics (tashkeel) ───────────────────────────────────────────
// Fathatan .. Hamza-below  (U+064B–U+065F)
// Small-Fatha .. Small-Damma (U+0610–U+061A)
// Superscript-Alef (U+0670)
// Extended Arabic diacritics (U+06D6–U+06ED)
const DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

// ── 2. Tatweel / Kashida ───────────────────────────────────────────────
const TATWEEL = /\u0640/g;

// ── 3-7. Character-level replacements ──────────────────────────────────
//
// Map every variant to a single canonical form.
// Grouped by linguistic category so the intent is clear.

const CHAR_MAP: Record<string, string> = {
  // Alef variants  →  bare Alef  ا
  '\u0622': '\u0627', // آ  Alef-Madda
  '\u0623': '\u0627', // أ  Alef-Hamza-Above
  '\u0625': '\u0627', // إ  Alef-Hamza-Below
  '\u0671': '\u0627', // ٱ  Alef-Wasla

  // Hamza carriers  →  plain Hamza  ء  (then stripped if desired, but
  // keeping it lets us distinguish hamza-words from non-hamza-words)
  '\u0624': '\u0648', // ؤ  Waw-Hamza   → و
  '\u0626': '\u064A', // ئ  Yaa-Hamza   → ي

  // Taa Marbuta  →  Haa
  '\u0629': '\u0647', // ة → ه

  // Alef Maksura  →  Yaa
  '\u0649': '\u064A', // ى → ي
};

// Build a single regex that matches any key in the map
const CHAR_MAP_RE = new RegExp(
  `[${Object.keys(CHAR_MAP).join('')}]`,
  'g',
);

// ── 8. Non-Arabic strip ────────────────────────────────────────────────
// Keep only characters in the core Arabic block (U+0621-U+064A without
// diacritics, which were already removed) and Arabic supplement ranges.
// This drops punctuation, Latin, digits, etc.
const NON_ARABIC =
  /[^\u0621-\u064A\u0660-\u0669\u066E-\u066F\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;

/**
 * Normalise a single Arabic word (or short phrase) for comparison.
 *
 * Returns the canonical form: no diacritics, no tatweel, unified letter
 * shapes, no punctuation.
 */
export function normalizeArabic(text: string): string {
  let out = text;

  // 1 + 2  –  strip diacritics and tatweel first so later regex is simpler
  out = out.replace(DIACRITICS, '');
  out = out.replace(TATWEEL, '');

  // 3-7  –  character-level normalisation
  out = out.replace(CHAR_MAP_RE, (ch) => CHAR_MAP[ch] ?? ch);

  // 8  –  drop anything that isn't Arabic script
  out = out.replace(NON_ARABIC, '');
  
  return out;
}

/**
 * Strip diacritics and tatweel from Arabic text.
 */
export function removeTashkeel(text: string): string {
  return text.replace(DIACRITICS, '').replace(TATWEEL, '');
}

/**
 * Split Arabic text into tokens using whitespace, filtering out empty strings.
 */
export function tokenizeArabicText(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}