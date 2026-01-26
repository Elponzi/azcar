import { AzkarItem, AzkarCategory, AzkarItemBase } from './types';
import { MORNING_AZKAR } from './morning';
import { EVENING_AZKAR } from './evening';

export type { AzkarItem, AzkarCategory, AzkarItemBase };

// Add category to each item when combining
export const AZKAR_DATA: Record<AzkarCategory, AzkarItem[]> = {
  Morning: MORNING_AZKAR.map(item => ({ ...item, category: 'Morning' as const })),
  Evening: EVENING_AZKAR.map(item => ({ ...item, category: 'Evening' as const })),
  // Placeholders for new categories - reusing content for demo
  WakingUp: MORNING_AZKAR.map(item => ({ ...item, category: 'WakingUp' as const })),
  Sleep: EVENING_AZKAR.map(item => ({ ...item, category: 'Sleep' as const })),
  Prayer: MORNING_AZKAR.map(item => ({ ...item, category: 'Prayer' as const })),
  Mosque: MORNING_AZKAR.map(item => ({ ...item, category: 'Mosque' as const })),
  Travel: MORNING_AZKAR.map(item => ({ ...item, category: 'Travel' as const })),
  Food: MORNING_AZKAR.map(item => ({ ...item, category: 'Food' as const })),
  Home: MORNING_AZKAR.map(item => ({ ...item, category: 'Home' as const })),
  Hajj: MORNING_AZKAR.map(item => ({ ...item, category: 'Hajj' as const })),
  Quran: MORNING_AZKAR.map(item => ({ ...item, category: 'Quran' as const })),
  Praises: MORNING_AZKAR.map(item => ({ ...item, category: 'Praises' as const })),
};

// Helper to get flat array (for backwards compatibility if needed)
export const getAllAzkar = (): AzkarItem[] => [
  ...AZKAR_DATA.Morning,
  ...AZKAR_DATA.Evening,
  ...AZKAR_DATA.WakingUp,
  ...AZKAR_DATA.Sleep,
  ...AZKAR_DATA.Prayer,
  ...AZKAR_DATA.Mosque,
  ...AZKAR_DATA.Travel,
  ...AZKAR_DATA.Food,
  ...AZKAR_DATA.Home,
  ...AZKAR_DATA.Hajj,
  ...AZKAR_DATA.Quran,
  ...AZKAR_DATA.Praises,
];

export const CATEGORIES: AzkarCategory[] = [
  'Morning', 'Evening', 'WakingUp', 'Sleep', 'Prayer', 'Mosque', 
  'Travel', 'Food', 'Home', 'Hajj', 'Quran', 'Praises'
];
