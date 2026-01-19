# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Azkar Drive is a cross-platform Islamic prayer (Azkar) app designed for safe hands-free use while driving. It provides large controls, morning/evening prayer categories, and a counter system with progress tracking.

## Development Commands

```bash
npm start          # Start Expo dev server (all platforms)
npm run web        # Start web version
npm run android    # Start Android version
npm run ios        # Start iOS version
```

No test or lint commands are currently configured.

## Architecture

### Tech Stack
- **Framework**: Expo 54 + React Native 0.81 with Expo Router (file-based routing)
- **UI**: Tamagui (cross-platform component library with XStack, YStack, Button, Text)
- **State**: Zustand (single store pattern)
- **Animations**: React Native Reanimated

### Key Directories
- `app/` - Expo Router screens (`_layout.tsx` is root, `(tabs)/index.tsx` is main dashboard)
- `store/azkarStore.ts` - Single Zustand store managing all app state
- `constants/` - Static data and configuration:
  - `AzkarData.ts` - Prayer content with Arabic text, translations, and target counts
  - `Translations.ts` - UI strings for Arabic/English
  - `Theme.ts` - Light/dark color palettes
  - `Config.ts` - App metadata and SEO config
- `components/` - Reusable components (ProgressRing, SettingsModal, etc.)

### State Management Pattern
The app uses a single Zustand store (`useAzkarStore`) containing:
- UI state: `theme`, `language`, `isSettingsOpen`
- Content state: `currentCategory`, `currentIndex`, `counts`, `filteredAzkar`
- Actions: `setCategory`, `nextZeker`, `prevZeker`, `incrementCount`, etc.

### RTL Support
The app fully supports Arabic RTL layout. Check `language === 'ar'` and use `isRTL` to conditionally set `flexDirection` (`'row-reverse'` for RTL).

### Responsive Design
Desktop/mobile layout switch happens at `width > 768`:
- Desktop: Card-based layout with side control panel
- Mobile: Full-screen with stacked controls

### Keyboard Controls (Web)
- Spacebar: Increment counter
- Arrow keys: Navigate between prayers
