# Smart Tracking: Code Quality Review

An honest assessment of the implementation's cleanliness, simplicity, and readability.

## Table of Contents

1. [Overall Verdict](#1-overall-verdict)
2. [What's Done Well](#2-whats-done-well)
3. [What Needs Work](#3-what-needs-work)
4. [File-by-File Review](#4-file-by-file-review)
5. [Structural Problems](#5-structural-problems)
6. [Suggestions](#6-suggestions)

---

## 1. Overall Verdict

The feature works and the core idea behind the architecture (decoupled matching from speech recognition) is sound. But the implementation shows signs of rapid iteration — logic is in the wrong places, types are missing, the screen component does too much, and there are patterns that make the code harder to follow than it needs to be.

The utilities (`normalize-arabic.ts`, `levenshtein.ts`) are the cleanest part. The hooks are decent but carry unnecessary complexity. The screen file (`[category].tsx`) is where quality drops — it's a god component that owns business logic that doesn't belong in a render function.

---

## 2. What's Done Well

### 2.1 Decoupled Hook Architecture

Splitting `useSmartTrack` (speech I/O) from `useAzkarMatcher` (matching logic) was the right call. The matcher is pure logic — it takes words in, returns an index. It doesn't know about microphones or platforms. This makes the matching testable in isolation and keeps each hook focused.

### 2.2 `normalize-arabic.ts` is Excellent

This is the best file in the feature. It's well-documented, the pipeline is clearly ordered and explained, every regex is named and commented with Unicode references, and the exported API is minimal (`normalizeArabic`, `removeTashkeel`, `tokenizeArabicText`). If someone unfamiliar with Arabic text processing reads this file, they'll understand exactly what it does and why.

### 2.3 `calculateMatchIndex` is Readable

The matching function (`useAzkarMatcher.ts:17-60`) reads top-down with clear steps: exact match, fuzzy match, look-ahead. The control flow is straightforward — no nested callbacks, no async, just a loop with early continues. The constants (`MAX_SKIP`, `MIN_FUZZY_LENGTH`) are named and placed at the top.

### 2.4 `AzkarWord` Memoization

Wrapping the word component in `memo` and driving animation through a single `progress` shared value that maps to three states (0=upcoming, 1=current, 2=read) is a clean model. The animation interpolation is elegant — one number controls color, glow, and shadow simultaneously.

### 2.5 `levenshtein.ts` is Minimal

34 lines, single function, standard algorithm, no extras. Exactly what a utility function should look like.

---

## 3. What Needs Work

### 3.1 Type Safety is Absent

Almost every external interaction is typed as `any`:

```typescript
// useSmartTrack.ts:17
const webRecognitionRef = useRef<any>(null);

// useSmartTrack.ts:53
recognition.onerror = (e: any) => { ... };

// useSmartTrack.ts:55
recognition.onresult = (event: any) => { ... };

// useSmartTrack.ts:78
useSpeechRecognitionEvent("result", (event: any) => { ... });

// useSmartTrack.ts:86
useSpeechRecognitionEvent("error", (event: any) => { ... });
```

The native event handler at line 79 shows the cost of this — it chains three fallbacks (`event?.results?.[0]?.transcript || event?.transcript || ""`) because nobody knows the actual event shape. With proper types from `expo-speech-recognition`, this would be a single property access.

The Web Speech API has TypeScript definitions available (`@types/dom-speech-recognition` or the built-in `lib.dom.d.ts` SpeechRecognition types). Using them would catch bugs at compile time instead of runtime.

### 3.2 Business Logic Buried in an Inline Callback

The `onComplete` handler in `[category].tsx:67-89` is a 22-line inline function passed as a hook argument. It contains:

- Store mutation (`incrementCount`)
- State query (`useAzkarStore.getState()`)
- Business rule evaluation (`currentCount >= activeZeker.target`)
- Side effects (sound playback)
- Async scheduling (`setTimeout` with navigation)
- Edge case handling (last prayer check)

This is the most important business logic in the auto-count feature and it's written as an anonymous function inside a hook call. It can't be tested, can't be reused, and is hard to find when debugging.

```typescript
// Currently: logic is an anonymous inline function
const { ... } = useSmartTrack({
  targetText: currentZeker?.arabic,
  autoReset: true,
  onComplete: () => {
    // 22 lines of orchestration logic here
  }
});
```

### 3.3 Dual State for the Same Value

`useAzkarMatcher` tracks the current word position in two places:

```typescript
const [activeWordIndex, setActiveWordIndex] = useState(0);     // for React renders
const currentWordIndexRef = useRef(0);                          // for internal logic
```

Both represent "where the user is in the prayer." The ref is the "committed" truth (only updated on `isFinal`), while the state is the "preview" (updated on interim results too). This distinction is necessary for the preview-vs-commit behavior, but the naming doesn't communicate it. `activeWordIndex` sounds like the real value, but it's actually the optimistic preview. `currentWordIndexRef` sounds like it could be anything, but it's the confirmed position.

Better names would make the duality self-documenting:
- `previewIndex` / `setPreviewIndex` for the state
- `confirmedIndexRef` for the ref

### 3.4 `useSmartTrack` Mixes Two Platforms in One Function

The hook handles web and native in a single 131-line function using `Platform.OS` branches throughout:

- `stopRecognition`: branches at line 21
- Web setup: effect at line 42-71
- Native setup: conditional block at line 74-90
- `requestPermissions`: branches at line 93
- `startRecognition`: branches at line 100

Every function reads as "if web do X, else do Y." This isn't terrible for a small hook, but it means you can't read the web logic or native logic in isolation — they're interleaved. The conditional hook calls at lines 74-90 also violate React's rules of hooks (even if Platform.OS is constant at runtime).

### 3.5 Inconsistent Indentation

The codebase mixes indentation styles within files:

```typescript
// useSmartTrack.ts - 4 spaces in some blocks, 2 in others
  const stopRecognition = useCallback(() => {
    if (Platform.OS === 'web') {
        webRecognitionRef.current?.stop();  // 8 spaces (extra indent)
        return;
    }
```

```typescript
// useAzkarMatcher.ts:110-118 - 3-space indent inside if/else
        if (autoReset) {
           // Reset for next repetition
           currentWordIndexRef.current = 0;    // 11 spaces
           setActiveWordIndex(0);
        } else {
           // Commit final index and request stop
           currentWordIndexRef.current = newIndex;
```

```typescript
// [category].tsx:67-89 - 7-space indent for the callback body
    onComplete: () => {
       incrementCount();

       // Check if target reached
       const state = useAzkarStore.getState();
```

This suggests no formatter (Prettier) is enforced. It's a small thing but it adds visual noise.

### 3.6 Unused Return Values

`useSmartTrack` returns `transcript` and `permissionStatus`, but neither is used by the consumer:

```typescript
// [category].tsx:64
const { isListening, transcript, startRecognition, stopRecognition, activeWordIndex }
  = useSmartTrack({ ... });
// `transcript` is destructured but never appears in JSX or any effect
// `permissionStatus` isn't even destructured
```

`transcript` is also set on every speech event (`setTranscript(text)`) causing re-renders for a value nobody reads.

### 3.7 IIFE in JSX

`AzkarTextDisplay.tsx:147-190` uses an immediately-invoked function expression inside JSX:

```typescript
{(() => {
  const fontSize = getDynamicFontSize(currentZeker.arabic, showTranslation);
  return (
    <Text fontSize={fontSize} ...>
      {activeWordIndex === -1 ? ( ... ) : ( ... )}
    </Text>
  );
})()}
```

The IIFE exists to compute `fontSize` before the JSX. This should just be a variable above the return:

```typescript
const fontSize = getDynamicFontSize(currentZeker.arabic, showTranslation);

return (
  <YStack ...>
    <Text fontSize={fontSize} ...>
```

### 3.8 Thinking-Out-Loud Comments

Some comments read like development notes that were never cleaned up:

```typescript
// [category].tsx:95-98
// Normalize param to match AzkarCategory type (capitalize first letter)
// Assuming URL is like /morning -> Morning
// But if user typed /Morning, it's fine.
// We should be case-insensitive or strict. Let's try to match.
```

```typescript
// azkarStore.ts:84
// Optional: Stop at target or keep going? Mockup implies keep going but color changes.
// We'll just increment.
```

These are decisions that were already made. The comments should either explain *what was decided* concisely or be removed.

### 3.9 Magic Numbers

Timing values are scattered as raw literals:

| Value | Location | Purpose |
|-------|----------|---------|
| `600` | `[category].tsx:87` | Delay before auto-navigation |
| `400` | `AzkarCounter.tsx:112` | Delay before manual navigation |
| `150` | `AzkarTextDisplay.tsx:54` | "Current" word animation duration |
| `300` | `AzkarTextDisplay.tsx:52` | "Upcoming" word animation duration |
| `800` | `AzkarTextDisplay.tsx:56` | "Read" word animation duration |
| `0.6` | `AzkarTextDisplay.tsx:45` | Upcoming word opacity |

These control timing-sensitive behavior (auto-count waits 600ms, manual waits 400ms — why different?). If you need to tune the animation feel, you'd have to hunt across three files.

---

## 4. File-by-File Review

### `utils/normalize-arabic.ts` — Clean

- Clear pipeline with numbered steps.
- Every regex is explained with Unicode references.
- Three focused exports, no unnecessary abstractions.
- Only suggestion: the module-level `CHAR_MAP_RE` regex construction at lines 56-59 could have a comment explaining why it's built dynamically (to stay in sync with `CHAR_MAP` keys).

**Grade: Good.** This is the standard the rest of the feature should match.

### `utils/levenshtein.ts` — Clean

- Single-purpose, 34 lines.
- Standard two-row DP, no frills.
- The `[prev, curr] = [curr, prev]` swap at line 29 is idiomatic.

**Grade: Good.**

### `hooks/useAzkarMatcher.ts` — Mostly Clean, Some Naming Issues

**Good:**
- `calculateMatchIndex` is a pure function at module scope — easy to test.
- Constants are named (`MAX_SKIP`, `MIN_FUZZY_LENGTH`).
- The `processTranscript` callback has clear branching: `isFinal` vs interim, complete vs incomplete.

**Issues:**
- `activeWordIndex` vs `currentWordIndexRef` naming doesn't convey their different roles (preview vs confirmed).
- The callback-ref pattern (lines 75-82) is a standard React pattern but adds 8 lines of boilerplate. Acceptable, just noisy.
- `processTranscript` is a vague name. It processes a transcript... and does what? Something like `matchTranscriptWords` or `advanceMatchPosition` would be more descriptive.

**Grade: Decent.** Core logic is clear, wrapping layer has naming friction.

### `hooks/useSmartTrack.ts` — Messy

**Issues:**
- Platform branching everywhere (5 separate `Platform.OS` checks).
- Conditional hook calls at lines 74-90.
- No cleanup in the web effect (line 42-71).
- `any` types on all external APIs.
- Returns unused values (`transcript`, `permissionStatus`).
- The `stopRecognition` callback is defined before `useAzkarMatcher` (line 20) with a comment explaining why ("Define stop first so we can pass it to matcher"). This ordering dependency is a code smell — it means the hooks are tightly coupled through their call order.

**Grade: Needs refactoring.** The hook works but fights against readability.

### `components/azkarScreen/AzkarTextDisplay.tsx` — Mixed

**Good:**
- `AzkarWord` is well-designed: memoized, animation model is clean.
- `wordsWithLogicalIndex` is properly memoized on `currentZeker.arabic`.
- The two rendering modes (plain text when `activeWordIndex === -1`, word-by-word when active) is a smart optimization.

**Issues:**
- IIFE in JSX (line 147-190) is unnecessary.
- `getDynamicFontSize` is a function that could be a `useMemo`. Currently it's re-called on every render even when inputs haven't changed.
- `withOpacity` helper at line 21-26 does manual hex parsing. React Native / Tamagui likely have a color utility for this. If not, it should at least validate input or handle shorthand hex (`#fff`).
- `withDelay` is imported but unused (line 5).

**Grade: Decent.** The animation design is good, the component structure has minor issues.

### `app/[category].tsx` — Overloaded

This is the weakest file in terms of code organization. A single 383-line component handles:

1. URL parameter syncing (lines 92-110)
2. Speech recognition lifecycle (lines 64-90)
3. Auto-count business logic (lines 67-89, inline)
4. Audio configuration (lines 136-150)
5. Keyboard controls (lines 129-133)
6. Parallax effects (lines 125-126)
7. Layout rendering — desktop and mobile (lines 154-383)
8. Derived state computation (lines 112-122)

The auto-count logic (the core feature) is an inline callback. The mic button (the user-facing control) is inline JSX at lines 289-313. Both are buried in a file that's primarily about layout.

**Grade: Needs decomposition.**

---

## 5. Structural Problems

### 5.1 No Separation Between "What Happens" and "How It Looks"

The auto-count orchestration (increment, check target, play sound, navigate) lives inside `[category].tsx` as an inline callback. The mic button's appearance and behavior are also inline. There's no intermediate layer — the screen component is simultaneously:

- The orchestrator (deciding when to count, when to navigate)
- The presenter (rendering the UI)
- The wiring layer (connecting hooks to components)

A cleaner structure would separate these:

```
Screen (layout + rendering)
  └── uses useAutoCount (orchestration: increment, target check, navigation)
        └── uses useSmartTrack (speech I/O)
              └── uses useAzkarMatcher (matching logic)
```

### 5.2 Two Independent Completion Paths with No Coordination

Manual counting (`AzkarCounter.onComplete → nextZeker`) and auto-counting (`useSmartTrack.onComplete → incrementCount + nextZeker`) are two completely separate code paths that both trigger navigation. They don't know about each other:

```
Manual path:   AzkarCounter.onPress → onIncrement() → detects isCompleting → onComplete() → nextZeker()
Auto path:     useSmartTrack → onComplete → incrementCount() → check target → setTimeout → nextZeker()
```

Both independently decide "is the target met?" and independently call `nextZeker()`. If both fire in the same cycle, the prayer gets skipped. The root cause is that "what to do when a zeker is complete" isn't defined in one place — it's duplicated across two paths.

### 5.3 The Ref-Callback Dance

`useAzkarMatcher` stores `onComplete` and `onStopRequest` in refs (lines 75-82) to avoid stale closures. `useSmartTrack` defines `stopRecognition` before `useAzkarMatcher` specifically so it can pass it as `onStopRequest`. The matcher then calls the ref'd callback to request the speech hook to stop.

This creates a circular dependency:

```
useSmartTrack defines stopRecognition
  → passes it to useAzkarMatcher as onStopRequest
    → useAzkarMatcher stores it in a ref
      → on completion, calls onStopRequestRef.current()
        → which calls stopRecognition from useSmartTrack
```

It works, but it's a loop. The matcher shouldn't need to "request" a stop — it should just signal "I'm done" and let the caller decide what to do. Currently it does both: it calls `onComplete` (signal) AND `onStopRequest` (command). The `onStopRequest` callback is redundant — the consumer of `onComplete` can stop recognition itself if it wants to.

---

## 6. Suggestions

### 6.1 Extract Auto-Count Orchestration Into Its Own Hook

Move the business logic out of the inline callback:

```typescript
// hooks/useAutoCount.ts
function useAutoCount() {
  const { incrementCount, nextZeker, ... } = useAzkarStore();
  const player = useAudioPlayer(require('@/assets/sounds/switch.mp3'));
  const isNavigatingRef = useRef(false);

  const { isListening, startRecognition, stopRecognition, activeWordIndex } = useSmartTrack({
    targetText: currentZeker?.arabic,
    autoReset: true,
    onComplete: handleComplete,
  });

  function handleComplete() {
    incrementCount();
    const state = useAzkarStore.getState();
    // ... target check, sound, navigation ...
  }

  return { isListening, startRecognition, stopRecognition, activeWordIndex };
}
```

This gives the orchestration logic a name, a file, and testability.

### 6.2 Remove `onStopRequest` from the Matcher

The matcher should only signal completion, not command the speech hook to stop. Let the consumer (or orchestration hook) decide:

```typescript
// useAzkarMatcher: just call onComplete, remove onStopRequest entirely
if (newIndex >= targetWordsRef.current.length) {
  onCompleteRef.current?.();
  if (autoReset) {
    currentWordIndexRef.current = 0;
    setActiveWordIndex(0);
  }
}

// useSmartTrack or useAutoCount: decide whether to stop
onComplete: () => {
  if (!autoReset) stopRecognition();
  handleComplete();
}
```

This removes the circular dependency and simplifies `useAzkarMatcher`'s interface.

### 6.3 Split `useSmartTrack` by Platform

Replace the single hook with platform-specific files:

```
hooks/useSmartTrack.ts          → shared interface + useAzkarMatcher call
hooks/useSmartTrack.web.ts      → Web Speech API implementation
hooks/useSmartTrack.native.ts   → Expo Speech Recognition implementation
```

Or at minimum, extract the web and native setup into helper functions so the main hook reads as a clean orchestration:

```typescript
export function useSmartTrack(props) {
  const matcher = useAzkarMatcher({ ... });

  if (Platform.OS === 'web') {
    useWebSpeechRecognition(matcher.processTranscript, ...);
  } else {
    useNativeSpeechRecognition(matcher.processTranscript, ...);
  }
}
```

### 6.4 Add Types

Define or import proper types for the speech recognition APIs:

```typescript
interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

// For web
interface WebSpeechResultEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
```

### 6.5 Unify the Completion Path

Both manual and auto counting should converge to a single "zeker completed" handler:

```typescript
function handleZekerCompleted() {
  player.seekTo(0);
  player.play();

  setTimeout(() => {
    const state = useAzkarStore.getState();
    if (state.currentIndex < state.filteredAzkar.length - 1) {
      nextZeker();
    }
  }, NAV_DELAY_MS);
}
```

Then:
- `AzkarCounter.onComplete` calls this.
- Auto-count `onComplete` calls this after incrementing.

One path, one definition, no duplication, no conflict.

### 6.6 Define Timing Constants

```typescript
// constants/SmartTrackConfig.ts
export const SMART_TRACK = {
  NAV_DELAY_MS: 600,
  WORD_ANIMATION: {
    UPCOMING_MS: 300,
    CURRENT_MS: 150,
    READ_MS: 800,
  },
  MATCHING: {
    MAX_SKIP: 2,
    MIN_FUZZY_LENGTH: 3,
  },
  UPCOMING_OPACITY: 0.6,
} as const;
```

### 6.7 Remove Unused Exports from `useSmartTrack`

Drop `transcript` and `permissionStatus` from the return object. If they're needed later, add them back. Dead code paths that trigger state updates (`setTranscript`) should be removed too.

---

## Summary

| Area | Verdict |
|------|---------|
| `normalize-arabic.ts` | Clean, well-documented, good API |
| `levenshtein.ts` | Clean, minimal |
| `calculateMatchIndex` | Clear algorithm, good readability |
| `useAzkarMatcher` hook wrapper | Decent, naming could improve |
| `useSmartTrack` | Messy — platform mixing, no types, no cleanup |
| `AzkarTextDisplay` | Good animation model, minor JSX issues |
| `AzkarWord` | Clean, good use of memo + shared values |
| `[category].tsx` | Overloaded — business logic, layout, and wiring all in one |
| Auto-count orchestration | Works but is an inline anonymous function with no coordination with manual counting |

The foundation is solid (decoupled hooks, good normalization, clean matching algorithm). The gaps are in the wiring layer: the screen component does too much, business logic lives in anonymous callbacks, platform code is interleaved, and types are missing. These are all fixable without rethinking the architecture.
