export type AzkarCategory = 
  | 'Morning' 
  | 'Evening'
  | 'AfterPrayer'
  | 'Tasbeeh'
  | 'Sleep'
  | 'Weakening'

// Base item without category (used in category files)
export interface AzkarItemBase {
  id: number;
  arabic: string;
  note: string;
  translation: string;
  target: number;
}

// Full item with category (used in store/components)
export interface AzkarItem extends AzkarItemBase {
  category: AzkarCategory;
}