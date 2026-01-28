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
    // 1. Initialize Player if needed (idempotent)
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
    } catch (e) {
      // Player already setup, ignore
    }

    // 2. Prepare Session (Reset to clear old state, then add track)
    try {
      if (this.isSetup) {
         await TrackPlayer.reset();
      }
      await TrackPlayer.add([SILENT_TRACK]);
      await TrackPlayer.setRepeatMode(RepeatMode.Track);
      this.isSetup = true;
    } catch (e) {
      console.warn('MediaControlService: Setup failed', e);
    }
  }

  async updateMetadata(metadata: MediaMetadata) {
    if (!this.isSetup) return;
    
    // We update the current track's metadata
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

  async destroy() {
    this.cleanupListeners();
    try {
      await TrackPlayer.reset(); // Stops playback and clears the notification
    } catch (e) {
      // Ignore
    }
    this.isSetup = false;
  }

  private cleanupListeners() {
    this.listeners.forEach(sub => sub.remove());
    this.listeners = [];
  }
}

export const MediaControlService = new MediaControlServiceNative();
