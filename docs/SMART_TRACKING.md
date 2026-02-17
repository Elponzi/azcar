# Smart Tracking Feature Documentation

## Overview
The **Smart Tracking** feature allows users to read Azkar while the application listens to their voice in real-time. As the user speaks, the application highlights the corresponding words in the Azkar text, similar to a karaoke effect. This feature is designed to work on Android, iOS, and Web platforms.

## Architecture

The feature is built using a clean separation of concerns across three main layers:

1.  **State & Logic (`useSmartTrack` hook):** Manages microphone permissions, speech recognition events, and the core matching algorithm.
2.  **Visual Presentation (`AzkarTextDisplay` & `AzkarWord`):** Handles text rendering, animations, and visual state mapping.
3.  **Utilities (`utils/normalize-arabic.ts`):** Provides pure functions for text normalization and tokenization.

---

## Core Algorithm

### 1. Tokenization & Normalization
*   **Tokenization:** The target text is split into tokens using whitespace. We use a custom helper `tokenizeArabicText` to ensure consistency between the matching logic and the visual display.
*   **Normalization:** Before comparison, both the target word and the spoken word are passed through `normalizeArabic`. This strips:
    *   Tashkeel (Diacritics).
    *   Tatweel (Kashida).
    *   Non-Arabic characters (punctuation).
    *   Unifies variations of Alef, Hamza, Taa Marbuta, etc.

### 2. Fuzzy Matching Logic (`calculateMatchIndex`)
The matching engine does not require 100% accuracy. It uses a robust "look-ahead" strategy:

*   **Current Word Check:** It first checks if the spoken word matches the *current* expected word (Exact or Fuzzy).
*   **Look-Ahead (Skip Logic):** If the current word doesn't match, it looks ahead up to `MAX_SKIP` (currently 3) words. This handles cases where:
    *   The user reads too fast.
    *   The speech engine misses a word.
    *   The user skips a word or pauses.
*   **Levenshtein Distance:** Fuzzy matching is calculated using Levenshtein distance with dynamic thresholds:
    *   Word length < 3: Exact match required.
    *   Word length <= 5: 1 edit allowed.
    *   Word length > 5: 2 edits allowed.

---

## UI/UX Implementation

### Visual States
Words transition between three states:
1.  **Upcoming:** Opacity `0.6`, Text Primary color.
2.  **Current:** Opacity `1.0`, Accent color, Glow shadow, Scaled/Bold (via font).
3.  **Read:** Opacity `1.0`, Text Primary color.

### Animations (`react-native-reanimated`)
*   **Smooth Transitions:** We use `useSharedValue` and `interpolateColor` to transition colors smoothly between states.
*   **Trailing Effect:** When a word moves from `Current` to `Read`, the color transitions slowly (800ms duration), creating a temporary "trail" where recently read words remain accented for a moment before fading back to the primary color.
*   **Safety:** Colors are pre-calculated on the Javascript thread and passed as static strings to the UI thread (worklet) to prevent crashes on native platforms.

---

## Platform Specifics

### Native (iOS/Android)
*   Uses `expo-speech-recognition` module.
*   Handles permissions via standard OS dialogs.
*   Optimized for continuous listening.

### Web
*   Uses the browser's native `SpeechRecognition` or `webkitSpeechRecognition` API.
*   Includes a polyfill/wrapper in `useSmartTrack` to map Web Speech API events to the hook's internal state.
*   **Note:** Requires a supported browser (Chrome, Edge, Safari).

---

## Areas for Improvement

1.  **Logic Decoupling:**
    *   The `useSmartTrack` hook is currently handling both *Speech Recognition Lifecycle* (permissions, start/stop) and *Text Matching Logic*.
    *   **Proposal:** Extract `useAzkarMatcher` as a separate hook that takes `transcript` as input and returns `activeWordIndex`.

2.  **Performance:**
    *   While `AzkarWord` is memoized, passing the `colors` object as a prop might cause shallow comparison failures if the theme object reference changes unnecessarily.
    *   **Proposal:** Flatten color props passed to `AzkarWord`.

3.  **Auto-Scroll:**
    *   For longer Azkar that exceed the screen height, the user currently has to scroll manually.
    *   **Proposal:** Implement auto-scrolling to keep the `activeWordIndex` vertically centered in the ScrollView.

4.  **State Management:**
    *   The logic relies on `currentWordIndexRef` and `activeWordIndex` state. Synchronizing these two (one for logic, one for UI) is tricky.
    *   **Proposal:** Use a reducer or a state machine (XState) to make the transitions deterministic and easier to debug.

---

## Known Issues

1.  **Web Browser Compatibility:**
    *   The feature relies on the Web Speech API. Firefox support is limited/behind a flag. Safari support can be strict about user activation (requires a click to start, which we have via the button).

2.  **Text Layout Shifts (Resolved but fragile):**
    *   We preserve newlines `
` explicitly. If the backend data uses different newline characters (e.g., `
`), the tokenizer might split differently than the visual renderer.
    *   **Current Fix:** Explicit splitting by `(
)` regex.

3.  **Punctuation Handling:**
    *   The `normalizeArabic` function strips punctuation. If the tokenizer in `AzkarTextDisplay` splits differently than the tokenizer in `useSmartTrack` (e.g., due to attached punctuation like "word,"), indices will misalign.
    *   **Current Fix:** Both use `tokenizeArabicText` helper to ensure consistency.

4.  **Opacity Rendering:**
    *   Applying `opacity` style directly to text caused issues in some contexts.
    *   **Current Fix:** We use RGBA color interpolation.
