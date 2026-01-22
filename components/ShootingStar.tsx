import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay, 
  Easing
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Configuration
const MIN_TRAIL_LENGTH = 100;
const MAX_TRAIL_LENGTH = 200;
const STAR_SIZE = 2; // Thickness of the head
const MIN_DELAY = 8000; // Minimum time between stars (ms)
const MAX_DELAY = 25000; // Maximum time between stars (ms)
const ANIMATION_DURATION = 1500; // Slower, more graceful movement

export const ShootingStar = () => {
  // Animation Values
  const translateX = useSharedValue(-MAX_TRAIL_LENGTH);
  const translateY = useSharedValue(-MAX_TRAIL_LENGTH);
  const opacity = useSharedValue(0);
  const currentTrailLength = useSharedValue(MIN_TRAIL_LENGTH);

  const triggerAnimation = () => {
    // 1. Randomize Start Position
    const startX = Math.random() * width + (width * 0.1); 
    const startY = Math.random() * (height * 0.2); // Top 20%
    
    // 2. Calculate End Position
    // Shortened travel distance so it stays within a "sector" of the sky
    const travelDist = Math.random() * 200 + 300; 
    const endX = startX - travelDist; 
    const endY = startY + travelDist; 

    // Randomize length for this instance
    currentTrailLength.value = Math.random() * (MAX_TRAIL_LENGTH - MIN_TRAIL_LENGTH) + MIN_TRAIL_LENGTH;

    // Reset
    translateX.value = startX;
    translateY.value = startY;
    opacity.value = 0;

    // 3. Run Animation Sequence
    // Fade In (10%) -> Visible (60%) -> Burn out/Fade Out (30%)
    // This ensures it disappears while still moving
    opacity.value = withSequence(
      withTiming(0.8, { duration: 200 }), // Fade in to 80% opacity
      withDelay(ANIMATION_DURATION * 0.4, withTiming(0, { duration: ANIMATION_DURATION * 0.4 })) // Start fading out halfway through
    );

        // Move X & Y

        const movementConfig = { 

          duration: ANIMATION_DURATION, 

          easing: Easing.out(Easing.quad) // Standard ease-out

        };

    

        translateX.value = withTiming(endX, movementConfig);

        translateY.value = withTiming(endY, movementConfig);

      };

    

      useEffect(() => {

        let timeoutId: NodeJS.Timeout;

    

        const scheduleNext = () => {

          const nextDelay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;

          timeoutId = setTimeout(() => {

            triggerAnimation();

            scheduleNext(); // Recursive loop

          }, nextDelay);

        };

    

        // Initial trigger

        timeoutId = setTimeout(() => {

            triggerAnimation();

            scheduleNext();

        }, 2000);

    

        return () => clearTimeout(timeoutId);

      }, []);

    

      const animatedStyle = useAnimatedStyle(() => ({

        opacity: opacity.value,

        width: currentTrailLength.value,

        transform: [

          { translateX: translateX.value },

          { translateY: translateY.value },

          { rotate: '135deg' }

        ],

      }));

    

      const animatedSvgProps = useAnimatedStyle(() => ({

        width: currentTrailLength.value,

      }));

    

      return (

        <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">

           <Svg height={STAR_SIZE} width={MAX_TRAIL_LENGTH}>

            <Defs>

              <LinearGradient id="tail" x1="0" y1="0" x2="1" y2="0">

                <Stop offset="0" stopColor="transparent" stopOpacity="0" />

                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />

              </LinearGradient>

            </Defs>

            <Rect x="0" y="0" width="100%" height={STAR_SIZE} fill="url(#tail)" />

          </Svg>

        </Animated.View>

      );

    };

    

    const styles = StyleSheet.create({

      container: {

        position: 'absolute',

        top: 0,

        left: 0,

        height: STAR_SIZE,

        zIndex: 0, 

        // Add a very subtle glow to the head of the star

        shadowColor: '#FFF',

        shadowOffset: { width: 0, height: 0 },

        shadowOpacity: 0.5,

        shadowRadius: 2,

      },

    });