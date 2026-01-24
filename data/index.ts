import { AzkarItem, AzkarCategory, AzkarItemBase } from './types';
import { MORNING_AZKAR } from './morning';
import { EVENING_AZKAR } from './evening';

export type { AzkarItem, AzkarCategory, AzkarItemBase };

// Add category to each item when combining
export const AZKAR_DATA: Record<AzkarCategory, AzkarItem[]> = {
  Morning: MORNING_AZKAR.map(item => ({ ...item, category: 'Morning' as const })),
  Evening: EVENING_AZKAR.map(item => ({ ...item, category: 'Evening' as const })),
};

// Helper to get flat array (for backwards compatibility if needed)
export const getAllAzkar = (): AzkarItem[] => [
  ...AZKAR_DATA.Morning,
  ...AZKAR_DATA.Evening,
];
