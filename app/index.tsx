import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { YStack, XStack, Text, Button, Theme, useTheme, Separator, Spacer } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAzkarStore } from '../store/azkarStore';
import { CounterRing } from '../components/CounterRing';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Helper for dynamic font size
const getFontSize = (length: number) => {
  if (length < 50) return 32;
  if (length < 100) return 24;
  if (length < 200) return 20;
  return 18;
};

const translations = {
  en: {
    morning: 'Morning',
    evening: 'Evening',
    driveMode: 'Drive Mode',
    azkarDrive: 'Azkar Drive',
  },
  ar: {
    morning: 'الصباح',
    evening: 'المساء',
    driveMode: 'وضع القيادة',
    azkarDrive: 'أذكار درايف',
  },
};

export default function AzkarDriveScreen() {
  const { 
    currentCategory, 
    getCurrentZeker, 
    increment, 
    next, 
    prev, 
    counts,
    resetCurrent,
    setCategory,
    theme: appTheme, // 'dark' | 'light'
    language,
  } = useAzkarStore();

  const t = translations[language];
  const isRTL = language === 'ar';

  const zeker = getCurrentZeker();
  const currentCount = counts[zeker?.id || ''] || 0;
  const target = zeker?.target || 33;
  const progress = Math.min((currentCount / target) * 100, 100);
  const theme = useTheme();

  // Dynamic Font Size
  const arabicFontSize = getFontSize(zeker?.arabic.length || 0);

  // Handle Tab Switch
  const handleTabPress = (cat: 'Morning' | 'Evening') => {
    setCategory(cat);
  };

  return (
    <Theme name={appTheme}>
      <YStack f={1} backgroundColor="$background">
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <XStack ai="center" jc="space-between" px="$4" py="$3" flexDirection={isRTL ? 'row-reverse' : 'row'}>
            <Text fontSize="$5" fontWeight="bold">📿 {t.azkarDrive}</Text>
            
            <XStack backgroundColor="$color4" borderRadius="$4" p="$1" flexDirection={isRTL ? 'row-reverse' : 'row'}>
              <Pressable onPress={() => handleTabPress('Morning')} style={currentCategory === 'Morning' ? styles.activeTab : styles.tab}>
                 <Text color={currentCategory === 'Morning' ? '$color' : '$color10'} fontWeight="600">{t.morning}</Text>
              </Pressable>
              <Pressable onPress={() => handleTabPress('Evening')} style={currentCategory === 'Evening' ? styles.activeTab : styles.tab}>
                 <Text color={currentCategory === 'Evening' ? '$color' : '$color10'} fontWeight="600">{t.evening}</Text>
              </Pressable>
            </XStack>

            <Button size="$3" circular icon={<FontAwesome name="cog" size={20} />} onPress={() => router.push('/modal')} chromeless />
          </XStack>

          <Separator />

          {/* Main Content */}
          <YStack f={1} px="$4" py="$4" ai="center" jc="center" gap="$4">
            
            {/* Azkar Text */}
            <YStack f={1} ai="center" jc="center">
              <Text 
                textAlign="center" 
                fontFamily="SpaceMono" 
                fontWeight="700" 
                lineHeight={arabicFontSize * 1.5}
                fontSize={arabicFontSize}
                color="$color"
              >
                {zeker?.arabic}
              </Text>
              <Spacer size="$4" />
              <Text textAlign="center" color="$color10" fontSize="$3">
                {zeker?.translation}
              </Text>
            </YStack>

            {/* Counter Section */}
            <YStack ai="center" jc="center" mb="$4" onPress={increment}>
              <Pressable onPress={increment} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <CounterRing progress={progress} size={240} strokeWidth={15} />
                <YStack position="absolute" ai="center" jc="center">
                  <Text fontSize={64} fontWeight="800" color={progress >= 100 ? '$green10' : '$color'}>{currentCount}</Text>
                  <Text fontSize="$4" color="$color10">/ {target}</Text>
                  
                  {currentCount > 0 && (
                     <Button 
                       size="$3" 
                       circular 
                       icon={<FontAwesome name="refresh" size={16} color="red" />} 
                       chromeless 
                       onPress={(e) => {
                         e.stopPropagation();
                         resetCurrent();
                       }}
                       mt="$2"
                     />
                  )}
                </YStack>
              </Pressable>
            </YStack>

            {/* Controls Footer */}
            <XStack w="100%" ai="center" jc="space-between" px="$6" mb="$2" flexDirection={isRTL ? 'row-reverse' : 'row'}>
              <Button size="$6" circular icon={<FontAwesome name={isRTL ? "step-forward" : "step-backward"} size={24} />} onPress={isRTL ? next : prev} />
              
              <YStack ai="center">
                 <Text fontSize="$2" color="$color10" textTransform="uppercase" letterSpacing={1}>{t.driveMode}</Text>
              </YStack>

              <Button size="$6" circular icon={<FontAwesome name={isRTL ? "step-backward" : "step-forward"} size={24} />} onPress={isRTL ? prev : next} />
            </XStack>

          </YStack>
        </SafeAreaView>
      </YStack>
    </Theme>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#34D399', // Custom accent color or use theme token if accessed properly
  }
});
