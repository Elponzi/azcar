# Smart Tracking & Auto-Count: Issues & Performance Analysis

## Table of Contents

1. [Potential Issues in Smart Tracking](#1-potential-issues-in-smart-tracking)
2. [Potential Issues in Auto-Count](#2-potential-issues-in-auto-count)
3. [Performance Analysis](#3-performance-analysis)
4. [Improvement Recommendations](#4-improvement-recommendations)

---

## 1. Potential Issues in Smart Tracking

### 1.1 Recognition Not Stopped on Navigation

**Severity: High**
**Files:** `app/[category].tsx:92-104`, `hooks/useSmartTrack.ts`

When the user navigates to a different category or a different zeker (via nav buttons, URL change, or category sheet), speech recognition continues running against the new target text.

```typescript
// app/[category].tsx:92-104
useEffect(() => {
  if (categoryParam) {
    const match = CATEGORIES.find(c => c.toLowerCase() === categoryParam.toLowerCase());
    if (match && match !== currentCategory) {
      setCategory(match); // changes filteredAzkar + resets currentIndex
    }
  }
}, [categoryParam]);
// recognition is never stopped here
```

**What goes wrong:**
- `setCategory()` changes `filteredAzkar` and resets `currentIndex` to 0.
- `useSmartTrack` receives a new `targetText` (from `currentZeker?.arabic`).
- `useAzkarMatcher` resets its `targetWordsRef` and index to 0.
- Recognition is still actively sending transcripts.
- The next incoming transcript gets matched against the **new** prayer's words.
- If partial words happen to match, it could trigger a false `onComplete` and auto-increment the wrong prayer.

The same applies when the user taps next/prev nav buttons while recognition is active.

---

### 1.2 Conditional Hook Call Violates Rules of Hooks

**Severity: High**
**File:** `hooks/useSmartTrack.ts:74-90`

```typescript
// Native Events
if (Platform.OS !== 'web') {
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event: any) => { ... });
  useSpeechRecognitionEvent("error", (event: any) => { ... });
}
```

React hooks (`useSpeechRecognitionEvent`) are called inside a conditional block. This violates React's rules of hooks: hooks must be called unconditionally and in the same order on every render.

**What goes wrong:**
- `Platform.OS` is a constant at runtime, so in practice this doesn't crash because the condition never changes between renders.
- However, it is technically invalid React code. Linters will flag it, and any future refactor that makes the condition dynamic will break.

---

### 1.3 Web SpeechRecognition Object Recreated When `processTranscript` Changes

**Severity: Medium**
**File:** `hooks/useSmartTrack.ts:42-71`

```typescript
useEffect(() => {
  if (Platform.OS === 'web') {
    const SpeechRecognition = (window as any).SpeechRecognition || ...;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      // ... configure ...
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          // ...
          processTranscript(text, isFinal);
        }
      };
      webRecognitionRef.current = recognition;
    }
  }
}, [processTranscript]); // dependency on processTranscript
```

The effect depends on `processTranscript`, which comes from `useAzkarMatcher`. If `processTranscript` is recreated (its dependency is `autoReset`, which is stable, so this is low risk currently), the entire `SpeechRecognition` instance is thrown away and recreated.

**What goes wrong:**
- If the user is actively speaking and the effect re-runs, the old recognition instance is silently abandoned (never `.stop()`ed).
- The new instance is not started (`.start()` is only called in `startRecognition()`).
- The user sees `isListening` flip to `false` and must press the button again.
- The abandoned recognition instance may continue running in the background (browser manages lifetime), causing a resource leak.

**Missing cleanup:** The effect has no cleanup function to call `.stop()` on the old instance.

---

### 1.4 No Error Recovery or Retry

**Severity: Medium**
**Files:** `hooks/useSmartTrack.ts:53, 86-89`

```typescript
// Web
recognition.onerror = (e: any) => {
  console.error("Web Speech Error:", e);
  setIsListening(false);
};

// Native
useSpeechRecognitionEvent("error", (event: any) => {
  console.log("Speech recognition error:", event);
  setIsListening(false);
});
```

On error, the feature silently stops. The user sees the mic button flip back to inactive with no feedback about what went wrong.

Common error scenarios:
- `no-speech`: User hasn't spoken for too long (Web Speech API timeout).
- `network`: Network-dependent recognition fails (common on Android).
- `not-allowed`: Microphone permission revoked mid-session.
- `audio-capture`: Microphone is in use by another app.

The user has no indication of why it stopped and must manually retry.

---

### 1.5 `processTranscript` Stale Closure Over `autoReset`

**Severity: Low**
**File:** `hooks/useAzkarMatcher.ts:95-131`

```typescript
const processTranscript = useCallback((transcriptText: string, isFinal: boolean) => {
  // ... uses autoReset ...
}, [autoReset]); // only dependency
```

`processTranscript` closes over `autoReset` as its only dependency. This is correct for now since `autoReset` is always `true` in the app. But if `autoReset` were ever toggled dynamically (e.g., a settings toggle), the web speech recognition effect would need to re-run to bind the new `processTranscript`, which re-creates the entire `SpeechRecognition` instance (see issue 1.3).

---

### 1.6 Web Speech API Browser Compatibility

**Severity: Medium**
**File:** `hooks/useSmartTrack.ts:44`

```typescript
const SpeechRecognition = (window as any).SpeechRecognition
  || (window as any).webkitSpeechRecognition;
```

The Web Speech API is not available in Firefox, and Safari has partial support. The app falls through to `console.warn("Web Speech API not supported")` but provides no user-facing fallback or notification.

---

### 1.7 Arabic Speech Recognition Accuracy

**Severity: Medium** (design limitation)
**File:** `hooks/useAzkarMatcher.ts:17-60`

The matching algorithm assumes the speech recognizer returns reasonably accurate Arabic text. In practice, Arabic speech recognition (especially for Quranic/prayer text with classical Arabic phonetics) has known accuracy issues:

- Modern Standard Arabic vs. dialectal pronunciation.
- Classical Arabic vocabulary may not be in the recognizer's language model.
- Background noise in a car amplifies errors.
- `ar-SA` locale may not suit non-Saudi Arabic speakers.

The fuzzy matching (Levenshtein) helps, but the tolerance window (max 2 edits for long words) may not be enough for heavily misrecognized words.

---

## 2. Potential Issues in Auto-Count

### 2.1 Multiple `setTimeout` Calls Stack on Rapid Completions

**Severity: Medium**
**File:** `app/[category].tsx:67-89`

```typescript
onComplete: () => {
  incrementCount();

  const state = useAzkarStore.getState();
  const activeZeker = state.filteredAzkar[state.currentIndex];
  const currentCount = state.counts[activeZeker.id] || 0;

  if (currentCount >= activeZeker.target) {
    player.seekTo(0);
    player.play();

    setTimeout(() => {
      if (state.currentIndex < state.filteredAzkar.length - 1) {
        nextZeker();
      } else {
        stopRecognition();
      }
    }, 600);
  }
}
```

When `autoReset` resets the matcher to index 0, the user can immediately begin speaking again. If the target is, say, 3, and the user finishes the third recitation, `onComplete` fires and schedules `setTimeout(nextZeker, 600)`. But because `autoReset` already reset the index, if the speech API fires another quick `isFinal` before the 600ms elapses, a **second** `onComplete` fires:

- `incrementCount()` runs again (count now exceeds target).
- `currentCount >= target` is still true.
- Another `setTimeout(nextZeker, 600)` is scheduled.
- Two `nextZeker()` calls execute, **skipping a prayer**.

**Impact:** Prayers can be skipped if the speech API is fast enough to detect another completion within the 600ms window.

---

### 2.2 `onComplete` Callback Uses Stale `state` Snapshot Inside `setTimeout`

**Severity: Medium**
**File:** `app/[category].tsx:71-87`

```typescript
onComplete: () => {
  incrementCount();

  const state = useAzkarStore.getState(); // snapshot taken NOW

  if (currentCount >= activeZeker.target) {
    setTimeout(() => {
      // 600ms later, uses the SAME snapshot
      if (state.currentIndex < state.filteredAzkar.length - 1) {
        nextZeker();
      }
    }, 600);
  }
}
```

The `state` variable is captured at the moment `onComplete` fires. Inside the `setTimeout` (600ms later), `state.currentIndex` may be outdated if:

- The user manually navigated during the 600ms window.
- Another `onComplete` already called `nextZeker()`.

The `nextZeker()` call itself is safe (it reads fresh state internally), but the **guard condition** (`state.currentIndex < ...length - 1`) uses the stale snapshot. This means the guard might pass when it shouldn't, or fail when it should pass.

---

### 2.3 Count Can Exceed Target Indefinitely

**Severity: Low**
**File:** `store/azkarStore.ts:79-92`

```typescript
incrementCount: () => {
  const { filteredAzkar, currentIndex, counts } = get();
  const currentZeker = filteredAzkar[currentIndex];
  const currentCount = counts[currentZeker.id] || 0;
  set({
    counts: { ...counts, [currentZeker.id]: currentCount + 1 }
  });
},
```

`incrementCount` has no guard against exceeding target. Both manual taps and auto-count can increment past the target. With auto-count + `autoReset`, the count will keep rising as long as the user keeps speaking and recognition is active.

This isn't necessarily a bug (the comment in the store says "keep going"), but during auto-count it creates confusion: the counter shows 0 remaining, yet the user is still being counted.

---

### 2.4 Sound Overlap on Repeated Target Hits

**Severity: Low**
**File:** `app/[category].tsx:77-78`

```typescript
player.seekTo(0);
player.play();
```

If `onComplete` fires multiple times quickly (see issue 2.1), `seekTo(0)` + `play()` are called on the same `player` instance. The second call interrupts the first, causing an audible glitch (cut-off and restart). This happens because `seekTo(0)` resets the playhead mid-playback.

---

### 2.5 `onComplete` Callback Identity

**Severity: Low**
**File:** `app/[category].tsx:64-90`

The `onComplete` callback is an inline arrow function passed to `useSmartTrack`. It is recreated on every render of `CategoryScreen`. Inside `useSmartTrack`, it's passed to `useAzkarMatcher`, which syncs it to a ref:

```typescript
// useAzkarMatcher.ts:79-82
useEffect(() => {
  onCompleteRef.current = onComplete;
  onStopRequestRef.current = onStopRequest;
}, [onComplete, onStopRequest]);
```

This effect runs every render because `onComplete` is a new function reference each time. The ref sync itself is cheap, but it's unnecessary churn. More importantly, if the effect had side effects beyond ref assignment, this would cause real problems.

---

### 2.6 Manual and Auto-Count Navigation Conflict

**Severity: Medium**
**File:** `app/[category].tsx:266-277` and `app/[category].tsx:67-89`

Manual counter's `onComplete` is `nextZeker`:

```typescript
<AzkarCounter
  onComplete={nextZeker} // called after manual tap completes target
/>
```

Auto-count also calls `nextZeker()` inside its `setTimeout`. If the user completes the target via a mix of manual taps and auto-count, both paths could trigger navigation:

1. Auto-count calls `onComplete` → calls `incrementCount()` → count reaches target → schedules `setTimeout(nextZeker, 600)`.
2. Within the 600ms, the manual counter's `onPress` detects `isCompleting` (count+1 >= target) → calls `onComplete()` which is `nextZeker()`.
3. Manual `nextZeker()` fires immediately.
4. 600ms later, auto-count's `setTimeout(nextZeker)` fires again → **skips a prayer**.

This conflict exists because both paths independently check for target completion and independently trigger navigation.

---

## 3. Performance Analysis

### 3.1 Normalization Runs on Every Transcript (Hot Path)

**File:** `hooks/useAzkarMatcher.ts:95-103`, `utils/normalize-arabic.ts:74-88`

```typescript
const processTranscript = useCallback((transcriptText: string, isFinal: boolean) => {
  const spokenWords = tokenizeArabicText(transcriptText);
  // ...
  const newIndex = calculateMatchIndex(spokenWords, targetWordsRef.current, ...);
}, [autoReset]);
```

Inside `calculateMatchIndex`:

```typescript
for (const spoken of spokenWords) {
  const normalizedSpoken = normalizeArabic(spoken); // called per word, per transcript
  // ...
}
```

`normalizeArabic` runs **4 regex replacements** on every spoken word, on every transcript event. With `interimResults: true`, the speech API fires dozens of events per second. Each event contains the **full cumulative transcript**, not just the new words.

**Cost analysis for a 20-word prayer being recited:**
- Speech API fires ~5-10 interim events per second.
- Each event contains all words spoken so far (e.g., 10 words midway).
- Per event: `tokenizeArabicText` (1 regex split) + `normalizeArabic` * 10 words (4 regexes each) = 41 regex operations.
- Per second: ~200-400 regex operations.

This is not catastrophic, but it's wasteful because:
- The same words are re-normalized on every event (the transcript is cumulative).
- Target words are already pre-normalized (stored in `targetWordsRef`), but spoken words are not cached.

---

### 3.2 Levenshtein Distance Is O(m*n) Per Word

**File:** `utils/levenshtein.ts:6-33`

```typescript
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // O(m * n) DP
}
```

Levenshtein is computed when exact match fails. For Arabic words (average 4-8 characters), this is ~16-64 operations per call. But the look-ahead loop (up to `MAX_SKIP=2`) means up to **3 Levenshtein calls per spoken word** (current position + 2 look-ahead):

- Per unmatched word: up to 3 * O(m*n) = ~192 operations.
- Per transcript event with 10 words: up to ~1920 operations in the worst case.

This is still fast in absolute terms, but it adds up with high-frequency interim events.

---

### 3.3 `AzkarWord` Component Renders on Every `activeWordIndex` Change

**File:** `components/azkarScreen/AzkarTextDisplay.tsx:110-133, 164-186`

```typescript
const wordsWithLogicalIndex = useMemo(() => {
  // tokenization + normalization per word
}, [currentZeker.arabic]);
```

The `wordsWithLogicalIndex` memo is keyed on `currentZeker.arabic`, so it doesn't re-compute on index changes. But the **render function** (lines 164-186) runs on every `activeWordIndex` change:

```typescript
wordsWithLogicalIndex.map((item, index) => {
  let status: 'read' | 'current' | 'upcoming' = 'upcoming';
  if (item.logicalIndex < activeWordIndex) status = 'read';
  else if (item.logicalIndex === activeWordIndex) status = 'current';

  return <AzkarWord key={...} status={status} ... />;
});
```

**What happens on each `activeWordIndex` change (every interim transcript):**
1. Parent `AzkarTextDisplay` re-renders.
2. All `AzkarWord` components are mapped.
3. `AzkarWord` is wrapped in `memo`, so only words whose `status` prop changed will re-render internally.
4. Typically only 1-2 words change status per index increment.

**The issue:** `memo` shallow-compares props. The `textPrimary`, `accent`, and `accentGlow` props are strings derived from `THEME[theme]`. These are stable across renders (same string values), so `memo` works correctly. This is actually well-optimized.

**However:** On every `activeWordIndex` update, the parent component still runs the full `.map()` to produce the React element tree. For a 50-word prayer, this creates 50 React elements on every speech event (5-10 times per second). React's reconciliation handles this efficiently, but it's not free.

---

### 3.4 `normalizeArabic` Called Redundantly in `AzkarTextDisplay`

**File:** `components/azkarScreen/AzkarTextDisplay.tsx:124`

```typescript
const normalized = normalizeArabic(word);
const isValid = normalized.length > 0;
```

This runs during the `useMemo` computation for `wordsWithLogicalIndex`. Since the memo is keyed on `currentZeker.arabic`, it only runs once per prayer change, not per transcript. This is fine.

---

### 3.5 Cumulative Transcript Re-Processing

**File:** `hooks/useAzkarMatcher.ts:95-103`

The speech API sends cumulative transcripts with `interimResults: true`. Example sequence:

```
Event 1: "سبحان"                    (interim)
Event 2: "سبحان الله"               (interim)
Event 3: "سبحان الله وبحمده"         (interim)
Event 4: "سبحان الله وبحمده"         (final)
```

Each event processes ALL words from the beginning:

```typescript
const spokenWords = tokenizeArabicText(transcriptText);
// Event 3: ["سبحان", "الله", "وبحمده"] - 3 words all processed

const newIndex = calculateMatchIndex(
  spokenWords,
  targetWordsRef.current,
  currentWordIndexRef.current // starts from where we left off
);
```

The `startIndex` parameter mitigates re-processing of already-matched target words, but spoken words are still iterated from the beginning. For a 30-word prayer near completion, every interim event processes ~30 spoken words even though only the last 1-2 are new.

---

### 3.6 `setState` Called on Interim Results

**File:** `hooks/useSmartTrack.ts:60, 82`

```typescript
// Web
setTranscript(text);
processTranscript(text, isFinal);

// Native
setTranscript(text);
processTranscript(text, isFinal);
```

`setTranscript(text)` triggers a React state update on every speech event. The `transcript` state is exposed in the hook's return value but is **never used** by any consumer in `[category].tsx`:

```typescript
const { isListening, transcript, startRecognition, stopRecognition, activeWordIndex }
  = useSmartTrack({ ... });
// `transcript` is destructured but never referenced in JSX or effects
```

Every `setTranscript` call triggers a re-render of `CategoryScreen` for a value that isn't displayed. At 5-10 events/second, this is 5-10 unnecessary re-renders per second.

---

### 3.7 Spreading `counts` Object on Every Increment

**File:** `store/azkarStore.ts:86-91`

```typescript
set({
  counts: {
    ...counts, // spreads entire counts object
    [currentZeker.id]: currentCount + 1
  }
});
```

Each `incrementCount()` call creates a new object by spreading all existing counts. If the user has counted across many prayers, this object grows. With auto-count firing on each completion (potentially dozens of times per session), this creates garbage for the GC.

In practice, the `counts` object is small (< 50 entries), so this is a minor concern.

---

### 3.8 `useAudioPlayer` Hook on Every Render

**File:** `app/[category].tsx:62`

```typescript
const player = useAudioPlayer(require('@/assets/sounds/switch.mp3'));
```

This hook is called on every render of `CategoryScreen`. Expo Audio's `useAudioPlayer` should internally memoize the player instance, but it depends on the implementation. If it creates a new player on each render, it would leak audio resources.

Additionally, both `CategoryScreen` and `AzkarCounter` create separate `useAudioPlayer` instances for the same sound file:

```typescript
// app/[category].tsx:62
const player = useAudioPlayer(require('@/assets/sounds/switch.mp3'));

// components/azkarScreen/AzkarCounter.tsx:64
const player = useAudioPlayer(require('@/assets/sounds/switch.mp3'));
```

Two player instances for the same sound. Only one is needed.

---

## 4. Improvement Recommendations

### 4.1 Stop Recognition on Navigation (fixes 1.1, 2.6)

Add cleanup when the prayer changes:

```typescript
// app/[category].tsx
const prevZekerIdRef = useRef(currentZeker?.id);

useEffect(() => {
  if (prevZekerIdRef.current !== currentZeker?.id) {
    if (isListening) {
      stopRecognition();
    }
    prevZekerIdRef.current = currentZeker?.id;
  }
}, [currentZeker?.id]);
```

Or more broadly, stop on category change:

```typescript
useEffect(() => {
  return () => stopRecognition(); // cleanup on unmount/category change
}, [currentCategory]);
```

---

### 4.2 Guard Against Double Navigation (fixes 2.1, 2.2)

Use a ref-based flag to prevent overlapping navigation:

```typescript
const isNavigatingRef = useRef(false);

onComplete: () => {
  incrementCount();

  const state = useAzkarStore.getState();
  const activeZeker = state.filteredAzkar[state.currentIndex];
  const currentCount = state.counts[activeZeker.id] || 0;

  if (currentCount >= activeZeker.target && !isNavigatingRef.current) {
    isNavigatingRef.current = true;
    player.seekTo(0);
    player.play();

    setTimeout(() => {
      const freshState = useAzkarStore.getState(); // fresh state
      if (freshState.currentIndex < freshState.filteredAzkar.length - 1) {
        nextZeker();
      } else {
        stopRecognition();
      }
      isNavigatingRef.current = false;
    }, 600);
  }
}
```

---

### 4.3 Remove Unused `transcript` State (fixes 3.6)

If `transcript` is not displayed anywhere in the UI, remove the `setTranscript` calls to avoid unnecessary re-renders:

```typescript
// hooks/useSmartTrack.ts
// Remove: const [transcript, setTranscript] = useState("");
// Remove: setTranscript(text); from both web and native handlers
// Remove: transcript from return object
```

If transcript display is planned for the future, gate it behind a flag or move it to a ref:

```typescript
const transcriptRef = useRef("");
// In handlers:
transcriptRef.current = text;
```

---

### 4.4 Cache Normalized Spoken Words (fixes 3.1, 3.5)

Since interim transcripts are cumulative, cache previously normalized words:

```typescript
const normalizedCacheRef = useRef<Map<string, string>>(new Map());

function normalizeWithCache(word: string): string {
  const cached = normalizedCacheRef.current.get(word);
  if (cached !== undefined) return cached;
  const normalized = normalizeArabic(word);
  normalizedCacheRef.current.set(word, normalized);
  return normalized;
}
```

Apply in `calculateMatchIndex`:

```typescript
for (const spoken of spokenWords) {
  const normalizedSpoken = normalizeWithCache(spoken);
  // ...
}
```

Clear the cache when target text changes.

---

### 4.5 Process Only New Words from Interim Transcripts (fixes 3.5)

Track the last processed word count and skip already-processed words:

```typescript
const lastProcessedCountRef = useRef(0);

const processTranscript = useCallback((transcriptText: string, isFinal: boolean) => {
  const spokenWords = tokenizeArabicText(transcriptText);
  if (spokenWords.length === 0) return;

  // Only process new words for interim results
  const wordsToProcess = isFinal
    ? spokenWords
    : spokenWords.slice(Math.max(0, lastProcessedCountRef.current - MAX_SKIP));

  const newIndex = calculateMatchIndex(
    wordsToProcess,
    targetWordsRef.current,
    currentWordIndexRef.current
  );

  if (!isFinal) {
    lastProcessedCountRef.current = spokenWords.length;
  } else {
    lastProcessedCountRef.current = 0; // reset for next utterance
  }

  // ... rest of logic
}, [autoReset]);
```

---

### 4.6 Early Exit in Levenshtein (fixes 3.2)

Add a max-distance bail-out to avoid full computation when the distance already exceeds the threshold:

```typescript
export function levenshtein(a: string, b: string, maxDist?: number): number {
  const m = a.length;
  const n = b.length;

  // Quick length-based rejection
  if (maxDist !== undefined && Math.abs(m - n) > maxDist) return maxDist + 1;

  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0]; // track minimum in current row
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
      rowMin = Math.min(rowMin, curr[j]);
    }
    // Early exit: if every cell in this row exceeds maxDist, result will too
    if (maxDist !== undefined && rowMin > maxDist) return maxDist + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}
```

Usage:

```typescript
const currentMaxDist = maxAllowedDistance(currentRef.length);
if (currentMaxDist > 0 && levenshtein(normalizedSpoken, currentRef, currentMaxDist) <= currentMaxDist) {
  idx++;
  continue;
}
```

---

### 4.7 Add Cleanup to Web SpeechRecognition Effect (fixes 1.3)

```typescript
useEffect(() => {
  if (Platform.OS !== 'web') return;

  const SpeechRecognition = (window as any).SpeechRecognition
    || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  // ... configure ...
  webRecognitionRef.current = recognition;

  return () => {
    recognition.stop(); // cleanup on re-run
    webRecognitionRef.current = null;
  };
}, [processTranscript]);
```

---

### 4.8 Deduplicate Audio Player Instances (fixes 3.8)

Remove the player from `AzkarCounter` and pass a callback from the parent instead, or lift the player to a shared context. Currently two `useAudioPlayer` instances load the same `switch.mp3`:

- `app/[category].tsx:62` (used by auto-count)
- `components/azkarScreen/AzkarCounter.tsx:64` (used by manual count)

Consolidate to one instance owned by the parent, and pass `playSuccessSound` as a prop to `AzkarCounter`.

---

### 4.9 Move Conditional Hooks Behind Platform-Specific Components (fixes 1.2)

Instead of conditionally calling hooks:

```typescript
// Before (violation)
if (Platform.OS !== 'web') {
  useSpeechRecognitionEvent("start", ...);
}
```

Either always call the hooks and no-op on web:

```typescript
// Option A: always call, ignore on web
useSpeechRecognitionEvent("start", Platform.OS !== 'web' ? () => setIsListening(true) : () => {});
```

Or split into platform-specific hook files:

```typescript
// Option B: separate files
// hooks/useSmartTrack.web.ts
// hooks/useSmartTrack.native.ts
```

---

### Summary Table

| Issue | Severity | Category | Fix Complexity |
|-------|----------|----------|----------------|
| 1.1 Recognition not stopped on navigation | High | Correctness | Low |
| 1.2 Conditional hook calls | High | React rules | Low |
| 1.3 Web SpeechRecognition no cleanup | Medium | Resource leak | Low |
| 1.4 No error recovery | Medium | UX | Medium |
| 1.5 `processTranscript` stale closure | Low | Correctness | N/A (future risk) |
| 1.6 Browser compatibility | Medium | Compatibility | Medium |
| 1.7 Arabic recognition accuracy | Medium | Design | High |
| 2.1 Stacked `setTimeout` calls | Medium | Correctness | Low |
| 2.2 Stale state in `setTimeout` | Medium | Correctness | Low |
| 2.3 Count exceeds target | Low | Design | Low |
| 2.4 Sound overlap | Low | UX | Low |
| 2.5 Callback identity churn | Low | Performance | Low |
| 2.6 Manual + auto navigation conflict | Medium | Correctness | Low |
| 3.1 Normalization on every transcript | -- | Performance | Low |
| 3.2 Levenshtein without early exit | -- | Performance | Low |
| 3.3 AzkarWord renders per index change | -- | Performance | N/A (already optimized) |
| 3.5 Cumulative transcript re-processing | -- | Performance | Medium |
| 3.6 Unused `transcript` state re-renders | -- | Performance | Low |
| 3.7 Spreading counts object | -- | Performance | N/A (negligible) |
| 3.8 Duplicate audio player instances | -- | Resource | Low |
