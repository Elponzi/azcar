import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

/**
 * A wrapper around expo-keep-awake that catches promise rejections.
 * This prevents crashes on devices where keep-awake might fail.
 */
export function useKeepAwake() {
  useEffect(() => {
    const activate = async () => {
      try {
        await activateKeepAwakeAsync();
      } catch (e) {
        if (__DEV__) {
          console.warn('KeepAwake: Failed to activate', e);
        }
      }
    };

    activate();

    return () => {
      deactivateKeepAwake().catch(() => {
        // Ignore errors on deactivation
      });
    };
  }, []);
}
