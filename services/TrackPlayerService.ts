import TrackPlayer, { Event } from 'react-native-track-player';
import { useAzkarStore } from '../store/azkarStore';

export const PlaybackService = async function() {

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    useAzkarStore.getState().increment();
    // Keep playing to maintain session
    TrackPlayer.play(); 
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    useAzkarStore.getState().increment();
    // Resume playing immediately to "trick" the system
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    useAzkarStore.getState().next();
    updateTrackMetadata();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    useAzkarStore.getState().prev();
    updateTrackMetadata();
  });
  
  // Optional: Handle other events to keep it alive
  TrackPlayer.addEventListener(Event.RemoteDuck, () => {
     TrackPlayer.play();
  });
};

export async function updateTrackMetadata() {
  const zeker = useAzkarStore.getState().getCurrentZeker();
  if (!zeker) return;

  await TrackPlayer.updateNowPlayingMetadata({
    title: zeker.category === 'Morning' ? 'Morning Azkar' : 'Evening Azkar',
    artist: 'Azkar Drive',
    album: zeker.arabic, // Show Arabic text in album field if title is short
    artwork: require('../assets/images/icon.png'), // Ensure this exists
  });
}
