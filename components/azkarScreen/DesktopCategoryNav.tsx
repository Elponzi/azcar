import React from 'react';
import { View, ScrollView } from 'tamagui';
import { AzkarCategory } from '@/data/types';
import { CategoryButton } from './ScreenControls';
import { ThemeColors } from '@/constants/Theme';

interface DesktopCategoryNavProps {
  categories: AzkarCategory[];
  currentCategory: AzkarCategory;
  onCategoryChange: (category: AzkarCategory) => void;
  colors: ThemeColors;
  t: any;
}

export const DesktopCategoryNav = ({ 
  categories, 
  currentCategory, 
  onCategoryChange, 
  colors, 
  t
}: DesktopCategoryNavProps) => {
  return (
    <View f={1} mx="$2" overflow="hidden">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ 
          gap: 8, 
          paddingHorizontal: 4, 
          alignItems: 'center'
        }}
      >
        {categories.map((cat) => {
          const key = (cat.charAt(0).toLowerCase() + cat.slice(1)) as keyof typeof t;
          const label = t[key] || cat;
          
          return (
            <CategoryButton 
              key={cat}
              label={label} 
              isActive={currentCategory === cat} 
              onPress={() => onCategoryChange(cat)} 
              colors={colors}
              isDesktop={true}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};
