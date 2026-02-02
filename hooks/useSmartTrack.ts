import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useAzkarMatcher } from './useAzkarMatcher';

interface UseSmartTrackProps {
  targetText?: string;
  onComplete?: () => void;
  autoReset?: boolean;
}

export function useSmartTrack({ targetText = "", onComplete, autoReset = false }: UseSmartTrackProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const webRecognitionRef = useRef<any>(null);

  const clearPermissionError = useCallback(() => {
    setPermissionError(null);
  }, []);

  // Define stop first so we can pass it to matcher
  const stopRecognition = useCallback(() => {
    if (Platform.OS === 'web') {
        webRecognitionRef.current?.stop();
        return;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (e) {
      console.error("Failed to stop:", e);
    }
  }, []);

  // Use the decoupled matcher hook
  const { activeWordIndex, processTranscript } = useAzkarMatcher({
    targetText,
    onComplete,
    onStopRequest: stopRecognition,
    autoReset
  });

  // Keep processTranscript in a ref so the web effect doesn't re-run when it changes
  const processTranscriptRef = useRef(processTranscript);
  processTranscriptRef.current = processTranscript;

  // Web Initialization
  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e: any) => {
          console.error("Web Speech Error:", e);
          if (e.error === 'not-allowed') {
            setPermissionError('mic_denied');
          }
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
           for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              const text = res[0].transcript;
              const isFinal = res.isFinal;
              processTranscriptRef.current(text, isFinal);
           }
        };

        webRecognitionRef.current = recognition;
      } else {
        console.warn("Web Speech API not supported in this browser.");
      }

      return () => {
        webRecognitionRef.current?.stop();
      };
    }
  }, []);

  // Native Events (safe to call unconditionally — on web the native events never fire)
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));

  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event?.results?.[0]?.transcript || event?.transcript || "";
    const isFinal = event?.isFinal || false;

    processTranscript(text, isFinal);
  });

  useSpeechRecognitionEvent("error", (event: any) => {
    console.log("Speech recognition error:", event);
    setIsListening(false);
  });

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (status !== 'granted') {
      setPermissionError('mic_denied');
      return false;
    }
    return true;
  }, []);

  const startRecognition = useCallback(async () => {
    if (Platform.OS === 'web') {
        try {
          webRecognitionRef.current?.start();
        } catch(e) { console.error(e); }
        return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: "ar-SA",
        interimResults: true,
        continuous: true,
      });
    } catch (e) {
      console.error("Failed to start:", e);
      setIsListening(false);
    }
  }, [requestPermissions]);

  return {
    isListening,
    activeWordIndex,
    startRecognition,
    stopRecognition,
    permissionError,
    clearPermissionError,
  };
}
