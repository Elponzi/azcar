import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AZKAR_DATA, AzkarCategory, AzkarItem } from '../data';

// Storage keys
const STORAGE_KEYS = {
  theme: 'azkar:theme',
  language: 'azkar:language',
  showTranslation: 'azkar:showTranslation',
  showNote: 'azkar:showNote',
  driveMode: 'azkar:driveMode',
} as const;

interface AzkarState {
  currentCategory: AzkarCategory;
  currentIndex: number;
  counts: Record<number, number>; // id -> count
  filteredAzkar: AzkarItem[];
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  isSettingsOpen: boolean;
  showTranslation: boolean;
  showNote: boolean;
  isDriveModeEnabled: boolean;
  isSmartReadingEnabled: boolean;
  activeWordIndex: number;
  isHydrated: boolean;

  // Actions
  setCategory: (category: AzkarCategory) => void;
  nextZeker: () => void;
  prevZeker: () => void;
  incrementCount: () => void;
  resetCurrentCount: () => void;
  resetCategoryCounts: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setShowTranslation: (show: boolean) => void;
  setShowNote: (show: boolean) => void;
  setDriveMode: (enabled: boolean) => void;
  setSmartReadingEnabled: (enabled: boolean) => void;
  setActiveWordIndex: (index: number) => void;
  hydrate: () => Promise<void>;
}

export const useAzkarStore = create<AzkarState>((set, get) => ({
  currentCategory: 'Morning',
  currentIndex: 0,
  counts: {},
  filteredAzkar: AZKAR_DATA['Morning'],
  theme: 'dark', // Default from mockup
  language: 'en',
  isSettingsOpen: false,
  showTranslation: false,
  showNote: false,
  isDriveModeEnabled: Platform.OS !== 'web',
  isSmartReadingEnabled: false,
  activeWordIndex: -1,
  isHydrated: false,

  setCategory: (category) => {
    set({
      currentCategory: category,
      currentIndex: 0,
      filteredAzkar: AZKAR_DATA[category],
      activeWordIndex: -1
    });
  },

  nextZeker: () => {
    const { currentIndex, filteredAzkar } = get();
    if (currentIndex < filteredAzkar.length - 1) {
      set({ currentIndex: currentIndex + 1, activeWordIndex: -1 });
    }
  },

  prevZeker: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, activeWordIndex: -1 });
    }
  },

  incrementCount: () => {
    const { filteredAzkar, currentIndex, counts } = get();
    const currentZeker = filteredAzkar[currentIndex];
    const currentCount = counts[currentZeker.id] || 0;

    // Optional: Stop at target or keep going? Mockup implies keep going but color changes.
    // We'll just increment.
    set({
      counts: {
        ...counts,
        [currentZeker.id]: currentCount + 1
      }
    });
  },

  resetCurrentCount: () => {
    const { filteredAzkar, currentIndex, counts } = get();
    const currentZeker = filteredAzkar[currentIndex];
    set({
      counts: {
        ...counts,
        [currentZeker.id]: 0
      }
    });
  },

  resetCategoryCounts: () => {
    const { filteredAzkar, counts } = get();
    const newCounts = { ...counts };
    
    // Reset counts for all items in the current category
    filteredAzkar.forEach(item => {
      if (newCounts[item.id]) {
        newCounts[item.id] = 0;
      }
    });

    set({ counts: newCounts });
  },

  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem(STORAGE_KEYS.theme, theme);
  },

  setLanguage: (language) => {
    set({ language });
    AsyncStorage.setItem(STORAGE_KEYS.language, language);
  },

  setSettingsOpen: (isOpen: boolean) => set({ isSettingsOpen: isOpen }),

  setShowTranslation: (show: boolean) => {
    set({ showTranslation: show });
    AsyncStorage.setItem(STORAGE_KEYS.showTranslation, JSON.stringify(show));
  },

  setShowNote: (show: boolean) => {
    set({ showNote: show });
    AsyncStorage.setItem(STORAGE_KEYS.showNote, JSON.stringify(show));
  },

  setDriveMode: (enabled: boolean) => {
    set({ isDriveModeEnabled: enabled });
    AsyncStorage.setItem(STORAGE_KEYS.driveMode, JSON.stringify(enabled));
  },

  setSmartReadingEnabled: (enabled: boolean) => {
    set({ isSmartReadingEnabled: enabled });
    if (!enabled) {
      set({ activeWordIndex: -1 });
    }
  },

  setActiveWordIndex: (index: number) => {
    set({ activeWordIndex: index });
  },

  hydrate: async () => {
    try {
      const [theme, language, showTranslation, showNote, driveMode] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.theme),
        AsyncStorage.getItem(STORAGE_KEYS.language),
        AsyncStorage.getItem(STORAGE_KEYS.showTranslation),
        AsyncStorage.getItem(STORAGE_KEYS.showNote),
        AsyncStorage.getItem(STORAGE_KEYS.driveMode),
      ]);

      set({
        ...(theme && { theme: theme as 'light' | 'dark' }),
        ...(language && { language: language as 'en' | 'ar' }),
        ...(showTranslation !== null && { showTranslation: JSON.parse(showTranslation) }),
        ...(showNote !== null && { showNote: JSON.parse(showNote) }),
        ...(driveMode !== null && { isDriveModeEnabled: JSON.parse(driveMode) }),
        isHydrated: true,
      });
    } catch (error) {
      console.warn('Failed to hydrate settings:', error);
      set({ isHydrated: true });
    }
  },
}));

