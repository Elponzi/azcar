import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { View } from 'react-native';
import { EFFECTS_CONFIG } from '@/constants/EffectsConfig';
import { useAzkarStore } from '@/store/azkarStore';

interface DivineLightProps {
  color?: string;
  size?: number;
}

const DivineLightComponent = ({ color = '#FFD700', size = 200 }: DivineLightProps) => {
  const currentTheme = useAzkarStore(state => state.theme);

  if (!EFFECTS_CONFIG.masterEnabled || !EFFECTS_CONFIG.divineLight.enabled) return null;
  if (!EFFECTS_CONFIG.divineLight.themes.includes(currentTheme)) return null;

  return (
    <View 
      style={{ 
        position: 'absolute', 
        justifyContent: 'center', 
        alignItems: 'center',
        width: size,
        height: size,
        pointerEvents: 'none'
      }}
    >
      <Svg height="100%" width="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient
            id="grad"
            cx="50"
            cy="50"
            rx="50"
            ry="50"
            fx="50"
            fy="50"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={color} stopOpacity="0.25" />
            <Stop offset="0.5" stopColor={color} stopOpacity="0.08" />
            <Stop offset="1" stopColor="transparent" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#grad)" />
      </Svg>
    </View>
  );
};

export default React.memo(DivineLightComponent);