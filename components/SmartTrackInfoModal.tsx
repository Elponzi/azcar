import React, { useEffect } from 'react';
import { useWindowDimensions, TouchableWithoutFeedback, Platform } from 'react-native';
import { YStack, XStack, H4, Text, Button, Paragraph } from 'tamagui';
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

interface SmartTrackInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartTrackInfoModal = ({ isOpen, onClose }: SmartTrackInfoModalProps) => {
  const { theme, language } = useAzkarStore();
  const t = (TRANSLATIONS as any)[language];
  const colors = THEME[theme];

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isOpen) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { 
        duration: 250, 
        easing: Easing.out(Easing.back(1.5)) 
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [isOpen]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isOpen && opacity.value === 0) return null;

  return (
    <YStack 
      position="absolute" 
      top={0} 
      left={0} 
      right={0} 
      bottom={0} 
      zIndex={10000}
      jc="center"
      ai="center"
      pointerEvents={isOpen ? 'auto' : 'none'}
      px="$4"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={[
            { 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.6)' 
            },
            animatedBackdropStyle
          ]} 
        />
      </TouchableWithoutFeedback>

      <Animated.View style={[{ width: '100%', maxWidth: 400 }, animatedContentStyle]}>
        <YStack 
            bg={colors.modalBg} 
            p="$6" 
            br="$6" 
            space="$4"
            bc={colors.borderColor}
            bw={1}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 10 }}
            shadowOpacity={0.25}
            shadowRadius={20}
            elevation={10}
        >
          <XStack jc="space-between" ai="center">
             <H4 
                fontSize={18} 
                fontWeight="700" 
                color={colors.textPrimary}
             >
               {t.smartTrackInfoTitle}
             </H4>
             <Button 
                size="$2" 
                circular 
                chromeless 
                onPress={onClose}
                icon={<Ionicons name="close" size={20} color={colors.textSecondary} />}
             />
          </XStack>

          <YStack ai="center" py="$2">
             <YStack 
                bg={colors.cardBg} 
                p="$4" 
                br={100}
                bc={colors.borderColor}
                bw={1}
             >
                <Ionicons name="mic" size={32} color={colors.accent} />
             </YStack>
          </YStack>

          <Paragraph 
            color={colors.textSecondary} 
            fontSize={15} 
            lineHeight={24}
            ta="center"
          >
            {t.smartTrackInfoDesc}
          </Paragraph>

          <Button 
            bg={colors.accent} 
            color="#fff" 
            fontWeight="600"
            onPress={onClose}
            pressStyle={{ opacity: 0.8 }}
          >
            {t.done}
          </Button>
        </YStack>
      </Animated.View>
    </YStack>
  );
}
