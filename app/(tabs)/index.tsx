import React, { useEffect } from 'react';
import { Platform, useWindowDimensions, Pressable } from 'react-native';
import { View, Text, YStack, XStack, Button, ScrollView, H4, Paragraph, Separator } from 'tamagui';
import { useAzkarStore } from '@/store/azkarStore';
import { ProgressRing } from '@/components/ProgressRing';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Mockup Colors
const MOCKUP_THEME = {
  dark: {
    bgBody: '#121212',
    bgCard: '#1E1E1E',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    accent: '#34D399',
    accentDim: 'rgba(52, 211, 153, 0.1)',
    borderColor: '#333333',
  },
  light: {
    bgBody: '#E5E7EB',
    bgCard: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    accent: '#059669',
    accentDim: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#E5E7EB',
  }
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const {
    currentCategory,
    currentIndex,
    filteredAzkar,
    counts,
    incrementCount,
    nextZeker,
    prevZeker,
    setCategory,
    resetCurrentCount,
    theme,
  } = useAzkarStore();

  const colors = MOCKUP_THEME[theme];
  const currentZeker = filteredAzkar[currentIndex];
  const count = counts[currentZeker?.id] || 0;
  const progress = Math.min((count / currentZeker?.target) * 100, 100);

  // Dynamic Font Size
  const getDynamicFontSize = (text: string) => {
    const len = text.length;
    if (len < 50) return isDesktop ? 48 : 32;
    if (len < 100) return isDesktop ? 36 : 24;
    if (len < 200) return isDesktop ? 28 : 20;
    if (len < 300) return isDesktop ? 24 : 18;
    return isDesktop ? 20 : 16;
  };

  // Keyboard controls for Web "Car Mode"
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          incrementCount();
        } else if (e.code === 'ArrowRight') {
          nextZeker();
        } else if (e.code === 'ArrowLeft') {
          prevZeker();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [incrementCount, nextZeker, prevZeker]);

  if (!currentZeker) return <View><Text>Loading...</Text></View>;

  return (
    <YStack f={1} bg={colors.bgBody} padding="$4" jc="center" ai="center">
      
      {/* Main Card */}
      <YStack 
        w="100%" 
        maw={1000} 
        h={isDesktop ? "80%" : "100%"} 
        bg={colors.bgCard} 
        br={24} 
        overflow="hidden"
        elevation={isDesktop ? "$4" : "$0"}
        bc={colors.borderColor}
        bw={1}
      >
        {/* Header */}
        <XStack p="$4" jc="space-between" ai="center" bbw={1} bbc={colors.borderColor}>
          <H4 fontWeight="bold" color={colors.textPrimary}>📿 Azkar Drive</H4>
          
          <XStack bg={colors.bgBody} p="$1" br="$4">
            <Button 
              size="$3" 
              bg={currentCategory === 'Morning' ? colors.accent : 'transparent'}
              color={currentCategory === 'Morning' ? '#FFFFFF' : colors.textSecondary}
              onPress={() => setCategory('Morning')}
              chromeless={currentCategory !== 'Morning'}
              pressStyle={{ opacity: 0.8 }}
            >
              Morning
            </Button>
            <Button 
              size="$3" 
              bg={currentCategory === 'Evening' ? colors.accent : 'transparent'}
              color={currentCategory === 'Evening' ? '#FFFFFF' : colors.textSecondary}
              onPress={() => setCategory('Evening')}
              chromeless={currentCategory !== 'Evening'}
              pressStyle={{ opacity: 0.8 }}
            >
              Evening
            </Button>
          </XStack>

          <Button 
            size="$3" 
            circular 
            bg="transparent"
            color={colors.textSecondary}
            icon={<Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />} 
            onPress={() => router.push('/modal')}
            hoverStyle={{ bg: colors.borderColor }}
          />
        </XStack>

        {/* Content Body */}
        <XStack f={1} fd={isDesktop ? 'row' : 'column'}>
          
          {/* Text Section */}
          <YStack f={1} p="$6" jc="center" ai="center" space="$4">
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
              showsVerticalScrollIndicator={false}
            >
              <Text 
                fontFamily="System" 
                fontWeight="700" 
                fontSize={getDynamicFontSize(currentZeker.arabic)} 
                textAlign="center" 
                lineHeight={isDesktop ? 50 : 36}
                color={colors.textPrimary}
                maw={isDesktop ? 600 : '100%'}
              >
                {currentZeker.arabic}
              </Text>
              <Paragraph 
                mt="$4" 
                fontSize={18} 
                color={colors.textSecondary} 
                textAlign="center"
                maw={500}
              >
                {currentZeker.translation}
              </Paragraph>
            </ScrollView>
          </YStack>

          {/* Separator */}
          {isDesktop ? <Separator vertical bc={colors.borderColor} /> : <Separator bc={colors.borderColor} />}

          {/* Controls Section */}
          <YStack 
            w={isDesktop ? 400 : '100%'}
            bg={isDesktop ? colors.bgBody : colors.bgCard} 
            p="$6" 
            jc="center" 
            ai="center" 
            space="$6"
            blc={colors.borderColor}
            blw={isDesktop ? 1 : 0}
            btc={colors.borderColor}
            btw={!isDesktop ? 1 : 0}
          >
            {/* Counter Ring */}
            <Pressable onPress={incrementCount} style={{ alignItems: 'center', justifyContent: 'center' }}>
               <ProgressRing 
                  radius={isDesktop ? 140 : 110} 
                  stroke={12} 
                  progress={progress} 
                  color={colors.accent}
                  bgColor={colors.accentDim} 
               >
                 <YStack ai="center">
                   <Text fontSize={64} fontWeight="800" color={progress >= 100 ? colors.accent : colors.textPrimary}>
                     {count}
                   </Text>
                   <Text fontSize={20} color={colors.textSecondary}>/ {currentZeker.target}</Text>
                   
                   {count > 0 && (
                     <Button 
                        size="$2" 
                        circular 
                        chromeless 
                        icon={<Ionicons name="refresh" size={20} color="#EF4444" />} 
                        onPress={(e) => {
                          e.stopPropagation();
                          resetCurrentCount();
                        }}
                        mt="$2"
                     />
                   )}
                 </YStack>
               </ProgressRing>
            </Pressable>

            {/* Nav Controls */}
            <XStack space="$6">
              <Button 
                size="$6" 
                circular 
                bg={colors.bgCard}
                bc={colors.borderColor}
                bw={1}
                color={colors.textPrimary}
                icon={<Ionicons name="chevron-back" size={32} color={colors.textPrimary} />} 
                onPress={prevZeker} 
                pressStyle={{ bg: colors.borderColor }}
              />
              <Button 
                size="$6" 
                circular 
                bg={colors.bgCard}
                bc={colors.borderColor}
                bw={1}
                color={colors.textPrimary}
                icon={<Ionicons name="chevron-forward" size={32} color={colors.textPrimary} />} 
                onPress={nextZeker} 
                pressStyle={{ bg: colors.borderColor }}
              />
            </XStack>
          </YStack>

        </XStack>
      </YStack>
    </YStack>
  );
}
