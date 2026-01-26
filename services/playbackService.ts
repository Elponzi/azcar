import TrackPlayer, { Event } from 'react-native-track-player';

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    // These events are listened to in the UI code (hooks) as well,
    // but the service needs to be registered.
    // We can emit custom events or just let the hook handle it if the app is active.
    // Since we only care about control when the app is "active" (or at least the session is),
    // we mostly need this to prevent the service from crashing.
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    // Handled in hook
  });
}
