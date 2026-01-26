import TrackPlayer, { 
  Capability, 
  Event,
  RepeatMode,
} from 'react-native-track-player';
import { MediaControlServiceInterface, MediaMetadata } from './MediaControlService.interface';

// The silent audio file
const SILENT_TRACK = {
  id: 'silent_drive',
  url: require('@/assets/sounds/silent.mp3'),
  title: 'Azkar Drive',
  artist: 'Azkar',
  duration: 1 // 1 second
};

class MediaControlServiceNative implements MediaControlServiceInterface {
  private isSetup = false;
  private listeners: any[] = [];

  async setupPlayer() {
    if (this.isSetup) return;

    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
      });

      await TrackPlayer.add([SILENT_TRACK]);
      await TrackPlayer.setRepeatMode(RepeatMode.Track); // Track loop
      this.isSetup = true;
    } catch (e) {
      // Player might already be set up
      this.isSetup = true;
    }
  }

  async updateMetadata(metadata: MediaMetadata) {
    if (!this.isSetup) return;
    
    // We update the current track's metadata
    // TrackPlayer doesn't have a direct "updateMetadata" for the *session* independent of the track 
    // in the same way web does, but we can update the track info in the queue.
    await TrackPlayer.updateMetadataForTrack(0, {
      title: metadata.title,
      artist: metadata.artist,
      artwork: metadata.artwork,
    });
  }

  async play() {
    if (!this.isSetup) return;
    await TrackPlayer.play();
  }

  async pause() {
    if (!this.isSetup) return;
    await TrackPlayer.pause();
  }

  registerRemoteEvents(
    onNext: () => void, 
    onPrevious: () => void,
    onPlay: () => void,
    onPause: () => void
  ) {
    this.cleanupListeners();

    this.listeners.push(TrackPlayer.addEventListener(Event.RemoteNext, onNext));
    this.listeners.push(TrackPlayer.addEventListener(Event.RemotePrevious, onPrevious));
    this.listeners.push(TrackPlayer.addEventListener(Event.RemotePlay, () => {
        onPlay();
        TrackPlayer.play();
    }));
    this.listeners.push(TrackPlayer.addEventListener(Event.RemotePause, () => {
        onPause();
        TrackPlayer.pause();
    }));
  }

  destroy() {
    this.cleanupListeners();
    // We generally don't destroy the player instance in RN-TrackPlayer unless strictly needed
  }

  private cleanupListeners() {
    this.listeners.forEach(sub => sub.remove());
    this.listeners = [];
  }
}

export const MediaControlService = new MediaControlServiceNative();
