import { create } from 'zustand';
import { AZKAR_DATA, Category } from '../constants/AzkarData';

interface AzkarStore {
  currentCategory: Category;
  currentIndex: number;
  counts: Record<string, number>; // Map of ID -> Count
  theme: 'dark' | 'light';
  language: 'en' | 'ar';

  // Actions
  increment: () => void;
  resetCurrent: () => void;
  next: () => void;
  prev: () => void;
  setCategory: (cat: Category) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  
  // Computed helpers could be here or selectors
  getCurrentZeker: () => typeof AZKAR_DATA[0];
}

export const useAzkarStore = create<AzkarStore>((set, get) => ({
  currentCategory: 'Morning',
  currentIndex: 0,
  counts: {},
  theme: 'dark',
  language: 'en',

  getCurrentZeker: () => {
    const { currentCategory, currentIndex } = get();
    const filtered = AZKAR_DATA.filter((z) => z.category === currentCategory);
    return filtered[currentIndex] || filtered[0];
  },

  increment: () => {
    const { currentCategory, currentIndex, counts } = get();
    const filtered = AZKAR_DATA.filter((z) => z.category === currentCategory);
    const zeker = filtered[currentIndex];
    
    if (!zeker) return;

    const currentCount = counts[zeker.id] || 0;
    // Optional: Stop incrementing if target reached? PRD says "Visual Feedback... Counter turns Green", doesn't explicitly say stop.
    // Usually Azkar apps allow going over, but let's stick to simple increment.
    
    set({
      counts: {
        ...counts,
        [zeker.id]: currentCount + 1,
      },
    });
  },

  resetCurrent: () => {
    const { currentCategory, currentIndex, counts } = get();
    const filtered = AZKAR_DATA.filter((z) => z.category === currentCategory);
    const zeker = filtered[currentIndex];

    if (!zeker) return;

    set({
      counts: {
        ...counts,
        [zeker.id]: 0,
      },
    });
  },

  next: () => {
    const { currentCategory, currentIndex } = get();
    const filtered = AZKAR_DATA.filter((z) => z.category === currentCategory);
    
    let nextIndex = currentIndex + 1;
    if (nextIndex >= filtered.length) {
      nextIndex = 0; // Loop back to start
    }

    set({ currentIndex: nextIndex });
  },

  prev: () => {
    const { currentCategory, currentIndex } = get();
    const filtered = AZKAR_DATA.filter((z) => z.category === currentCategory);
    
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = filtered.length - 1; // Loop to end
    }

    set({ currentIndex: prevIndex });
  },

  setCategory: (cat) => {
    set({ currentCategory: cat, currentIndex: 0 });
  },

  setTheme: (theme) => set({ theme }),
  setLanguage: (lang) => set({ language: lang }),
}));
