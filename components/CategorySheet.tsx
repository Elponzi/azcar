import React, { useEffect } from 'react';
import { useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import { YStack, XStack, H4, Text, Button, ScrollView } from 'tamagui';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useAzkarStore } from '@/store/azkarStore';
import { TRANSLATIONS } from '@/constants/Translations';
import { THEME } from '@/constants/Theme';
import { AzkarCategory } from '@/data/types';
import { CategoryButton } from './azkarScreen/ScreenControls';

interface CategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AzkarCategory[];
}

export default function CategorySheet({ isOpen, onClose, categories }: CategorySheetProps) {
  const { height } = useWindowDimensions();
  const { theme, language, currentCategory, setCategory } = useAzkarStore();
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  
  const colors = THEME[theme];

  const opacity = useSharedValue(0);
  const translation = useSharedValue(height);

  useEffect(() => {
    if (isOpen) {
      opacity.value = withTiming(1, { duration: 200 });
      translation.value = withTiming(0, { 
        duration: 250, 
        easing: Easing.out(Easing.cubic) 
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translation.value = withTiming(height, { 
        duration: 200, 
        easing: Easing.in(Easing.cubic) 
      });
    }
  }, [isOpen, height]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translation.value }],
  }));

  if (!isOpen && opacity.value === 0) return null;

  const handleCategorySelect = (cat: AzkarCategory) => {
    setCategory(cat);
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
          style={[
            { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
            animatedBackdropStyle
          ]} 
        />
      </TouchableWithoutFeedback>

      {/* Panel */}
      <Animated.View
        style={[
          {
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
          },
          animatedPanelStyle
        ]}
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
