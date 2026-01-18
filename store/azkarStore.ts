import { create } from 'zustand';
import { AZKAR_DATA, AzkarCategory, AzkarItem } from '../constants/AzkarData';

interface AzkarState {
  currentCategory: AzkarCategory;
  currentIndex: number;
  counts: Record<number, number>; // id -> count
  filteredAzkar: AzkarItem[];
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  
  // Actions
  setCategory: (category: AzkarCategory) => void;
  nextZeker: () => void;
  prevZeker: () => void;
  incrementCount: () => void;
  resetCurrentCount: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
}

export const useAzkarStore = create<AzkarState>((set, get) => ({
  currentCategory: 'Morning',
  currentIndex: 0,
  counts: {},
  filteredAzkar: AZKAR_DATA.filter(z => z.category === 'Morning'),
  theme: 'dark', // Default from mockup
  language: 'en',

  setCategory: (category) => {
    set({
      currentCategory: category,
      currentIndex: 0,
      filteredAzkar: AZKAR_DATA.filter(z => z.category === category)
    });
  },

  nextZeker: () => {
    const { currentIndex, filteredAzkar } = get();
    const nextIndex = (currentIndex + 1) % filteredAzkar.length;
    set({ currentIndex: nextIndex });
  },

  prevZeker: () => {
    const { currentIndex, filteredAzkar } = get();
    const prevIndex = currentIndex === 0 ? filteredAzkar.length - 1 : currentIndex - 1;
    set({ currentIndex: prevIndex });
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

  setTheme: (theme) => set({ theme }),
  setLanguage: (lang) => set({ language })
}));
