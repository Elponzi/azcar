import { AzkarItem, AzkarCategory, AzkarItemBase } from './types';
import { MORNING_AZKAR } from './morning';
import { EVENING_AZKAR } from './evening';
import { AFTER_PRAYER_AZKAR } from './afterPrayer';
import { TASBEEH_AZKAR } from './tasbeeh';
import { SLEEP_AZKAR } from './sleep';
import { WEAKING_AZKAR } from './weaking';

export type { AzkarItem, AzkarCategory, AzkarItemBase };

// Add category to each item when combining
export const AZKAR_DATA: Record<AzkarCategory, AzkarItem[]> = {
  Morning: MORNING_AZKAR.map(item => ({ ...item, category: 'Morning' as const })),
  Evening: EVENING_AZKAR.map(item => ({ ...item, category: 'Evening' as const })),
  AfterPrayer: AFTER_PRAYER_AZKAR.map(item => ({ ...item, category: 'AfterPrayer' as const })),
  Tasbeeh: TASBEEH_AZKAR.map(item => ({ ...item, category: 'Tasbeeh' as const })),
  Sleep: SLEEP_AZKAR.map(item => ({ ...item, category: 'Sleep' as const })),
  Weakening: WEAKING_AZKAR.map(item => ({ ...item, category: 'Weakening' as const })),
};

// Helper to get flat array (for backwards compatibility if needed)
export const getAllAzkar = (): AzkarItem[] => [
  ...AZKAR_DATA.Morning,
  ...AZKAR_DATA.Evening,
  ...AZKAR_DATA.AfterPrayer,
  ...AZKAR_DATA.Tasbeeh,
  ...AZKAR_DATA.Sleep,
  ...AZKAR_DATA.Weakening,
];

export const CATEGORIES: AzkarCategory[] = [
  'Morning', 'Evening', 'AfterPrayer', 'Tasbeeh', 'Sleep', 'Weakening'
];