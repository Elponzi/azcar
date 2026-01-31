import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useAzkarMatcher } from './useAzkarMatcher';

interface UseSmartTrackProps {
  targetText?: string;
  onComplete?: () => void;
}

export function useSmartTrack({ targetText = "", onComplete }: UseSmartTrackProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  
  const webRecognitionRef = useRef<any>(null);

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
    onStopRequest: stopRecognition
  });

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
        recognition.onerror = (e: any) => { console.error("Web Speech Error:", e); setIsListening(false); };
        
        recognition.onresult = (event: any) => {
           for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              const text = res[0].transcript;
              const isFinal = res.isFinal;
              setTranscript(text);
              processTranscript(text, isFinal);
           }
        };
        
        webRecognitionRef.current = recognition;
        setPermissionStatus('granted'); 
      } else {
        console.warn("Web Speech API not supported in this browser.");
      }
    }
  }, [processTranscript]);

  // Native Events
  if (Platform.OS !== 'web') {
    useSpeechRecognitionEvent("start", () => setIsListening(true));
    useSpeechRecognitionEvent("end", () => setIsListening(false));
    
    useSpeechRecognitionEvent("result", (event: any) => {
      const text = event?.results?.[0]?.transcript || event?.transcript || "";
      const isFinal = event?.isFinal || false;
      
      setTranscript(text);
      processTranscript(text, isFinal);
    });

    useSpeechRecognitionEvent("error", (event: any) => {
      console.log("Speech recognition error:", event);
      setIsListening(false);
    });
  }

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
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
    transcript,
    permissionStatus,
    activeWordIndex,
    startRecognition,
    stopRecognition,
  };
}
