import React, { useEffect, useRef } from 'react';
import { useWindowDimensions, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import { YStack, XStack, H4, Text, Button, ScrollView } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { useAzkarStore } from '@/store/azkarStore';
import { TRANSLATIONS } from '@/constants/Translations';
import { THEME } from '@/constants/Theme';
import { AzkarCategory } from '@/data/types';

interface CategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AzkarCategory[];
  onSelect: (category: AzkarCategory) => void;
}

export default function CategorySheet({ isOpen, onClose, categories, onSelect }: CategorySheetProps) {
  const { height } = useWindowDimensions();
  const { theme, language, currentCategory } = useAzkarStore();
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  
  const colors = THEME[theme];

  const opacity = useRef(new Animated.Value(0)).current;
  const translation = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, { 
            toValue: 1, 
            duration: 200, 
            useNativeDriver: true 
        }),
        Animated.timing(translation, { 
            toValue: 0, 
            duration: 250, 
            easing: Easing.out(Easing.cubic), 
            useNativeDriver: true 
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { 
            toValue: 0, 
            duration: 150, 
            useNativeDriver: true 
        }),
        Animated.timing(translation, { 
            toValue: height, 
            duration: 200, 
            easing: Easing.in(Easing.cubic), 
            useNativeDriver: true 
        })
      ]).start();
    }
  }, [isOpen, height]);

  // If closed and opacity is 0 (we need to track state or assume initial render is closed)
  // Since we don't have a state for "animation finished", we can rely on isOpen prop for rendering 
  // but better to keep it mounted until animation finishes? 
  // For simplicity, we'll return null if !isOpen AND we are not animating out?
  // Or just rely on pointerEvents and opacity. The original code returned null if opacity.value === 0.
  // We can't easily check animated value synchronously. 
  // We'll let it render but use pointerEvents. If performance is issue, we'd add state.
  
  // Actually, standard optimization:
  // if (!isOpen) we might want to unmount after delay.
  // But let's stick to pointerEvents logic for now or just standard rendering.
  // The original had: if (!isOpen && opacity.value === 0) return null;
  // We can approximate this by not rendering if !isOpen (but that breaks exit animation).
  // So we should keep it mounted.

  const handleCategorySelect = (cat: AzkarCategory) => {
    onSelect(cat);
    onClose();
  };

  return (
    <YStack 
      position="absolute" 
      top={0} 
      left={0} 
      right={0} 
      bottom={0} 
      zIndex={9999}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={{
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity
          }} 
        />
      </TouchableWithoutFeedback>

      {/* Panel */}
      <Animated.View
        style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.modalBg,
            height: '60%',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 20,
            padding: 20,
            borderTopWidth: 1,
            borderColor: colors.borderColor,
            transform: [{ translateY: translation }]
        }}
      >
        <YStack space="$4" f={1}>
            {/* Header */}
            <XStack jc="space-between" ai="center" pb="$2" bbw={1} bbc={colors.borderColor}>
                <H4 fontSize={18} fontWeight="700" color={colors.textPrimary}>
                  {isRTL ? "اختر الأذكار" : "Select Category"}
                </H4>
                <Button 
                    size="$3" 
                    circular 
                    chromeless 
                    onPress={onClose}
                    icon={<Ionicons name="close" size={24} color={colors.textSecondary} />}
                />
            </XStack>

            {/* Categories Grid */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <XStack flexWrap="wrap" gap="$3" jc="center" pb="$6">
                {categories.map((cat) => {
                   const key = (cat.charAt(0).toLowerCase() + cat.slice(1)) as keyof typeof t;
                   const label = t[key] || cat;
                   const isActive = currentCategory === cat;

                   return (
                     <Button
                        key={cat}
                        w="47%" // Approx 2 columns
                        h="$6"
                        bg={isActive ? colors.accentDim : 'transparent'}
                        bw={isActive ? 2 : 1}
                        bc={isActive ? colors.accent : colors.borderColor}
                        br="$4"
                        onPress={() => handleCategorySelect(cat)}
                        pressStyle={{ opacity: 0.8 }}
                     >
                       <Text 
                          color={isActive ? colors.accent : colors.textPrimary} 
                          fontWeight={isActive ? "700" : "400"}
                       >
                         {label}
                       </Text>
                     </Button>
                   );
                })}
              </XStack>
            </ScrollView>
        </YStack>
      </Animated.View>
    </YStack>
  );
}
