import { useState, useCallback, useEffect } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

export function useSmartTrack() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  // Monitor Speech Events
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event: any) => {
    // Handling different event structures just in case
    const text = event?.results?.[0]?.transcript || event?.transcript || "";
    setTranscript(text);
  });
  useSpeechRecognitionEvent("error", (event: any) => {
    console.log("Speech recognition error:", event);
    setIsListening(false);
  });

  const requestPermissions = useCallback(async () => {
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  const startRecognition = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      ExpoSpeechRecognitionModule.start({
        lang: "ar-SA",
        interimResults: true,
        continuous: true,
      });
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  }, [requestPermissions]);

  const stopRecognition = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.error("Failed to stop speech recognition:", e);
    }
  }, []);

  return {
    isListening,
    transcript,
    permissionStatus,
    startRecognition,
    stopRecognition,
  };
}
