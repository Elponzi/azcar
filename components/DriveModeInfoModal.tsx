import React, { useEffect, useRef } from 'react';
import { useWindowDimensions, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import { YStack, XStack, H4, Text, Button, Paragraph } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useAzkarStore } from '@/store/azkarStore';
import { TRANSLATIONS } from '@/constants/Translations';
import { THEME } from '@/constants/Theme';

interface DriveModeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DriveModeInfoModal({ isOpen, onClose }: DriveModeInfoModalProps) {
  const { theme, language } = useAzkarStore();
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const colors = THEME[theme];

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, { 
            toValue: 1, 
            duration: 200, 
            useNativeDriver: true 
        }),
        Animated.timing(scale, { 
            toValue: 1, 
            duration: 250, 
            easing: Easing.out(Easing.back(1.5)), 
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
        Animated.timing(scale, { 
            toValue: 0.9, 
            duration: 150, 
            useNativeDriver: true 
        })
      ]).start();
    }
  }, [isOpen]);

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
          style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.6)',
              opacity
          }} 
        />
      </TouchableWithoutFeedback>

      <Animated.View style={{ 
          width: '100%', 
          maxWidth: 400,
          opacity,
          transform: [{ scale }]
      }}>
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
                textAlign={isRTL ? 'right' : 'left'}
             >
               {t.driveModeInfoTitle}
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
                <Ionicons name="car-sport" size={32} color={colors.accent} />
             </YStack>
          </YStack>

          <Paragraph 
            color={colors.textSecondary} 
            fontSize={15} 
            lineHeight={24}
            textAlign={isRTL ? 'right' : 'left'}
          >
            {t.driveModeInfoDesc}
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