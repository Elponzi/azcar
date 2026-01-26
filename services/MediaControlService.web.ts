import { MediaControlServiceInterface, MediaMetadata } from './MediaControlService.interface';
import { Asset } from 'expo-asset';

class MediaControlServiceWeb implements MediaControlServiceInterface {
  private audio: HTMLAudioElement | null = null;

  async setupPlayer() {
    if (this.audio) return;

    try {
      const asset = Asset.fromModule(require('@/assets/sounds/silent.mp3'));
      await asset.downloadAsync(); // Ensure we have the URI
      
      this.audio = new Audio(asset.uri);
      this.audio.loop = true;
      this.audio.volume = 0.2; // Not strictly 0, or browsers might think it's not "playing"

      // Attempt to play immediately? 
      // Browsers often block this. We might need a user interaction wrapper.
      // But we will try.
      try {
        await this.audio.play();
      } catch (e) {
        console.log('Autoplay blocked. User interaction required.');
      }

      this.setupMediaSession();

    } catch (e) {
      console.error('Failed to setup web player', e);
    }
  }

  private setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
      // Default placeholder
      this.updateMetadata({
        title: 'Azkar Drive',
        artist: 'Azkar',
      });
    }
  }

  async updateMetadata(metadata: MediaMetadata) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        artwork: metadata.artwork ? [
            // If artwork is a number (require), we might need to resolve it.
            // For now, let's assume it's omitted or handled if we provide a URL.
            // A placeholder URL is safest for now.
            { src: '/icon.png', sizes: '192x192', type: 'image/png' }
        ] : []
      });
    }
  }

  async play() {
    if (this.audio) {
        await this.audio.play();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    }
  }

  async pause() {
    if (this.audio) {
        this.audio.pause();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
  }

  registerRemoteEvents(
    onNext: () => void, 
    onPrevious: () => void,
    onPlay: () => void,
    onPause: () => void
  ) {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ['previoustrack', onPrevious],
        ['nexttrack', onNext],
        ['play', async () => {
            onPlay();
            await this.play();
        }],
        ['pause', () => {
            onPause();
            this.pause();
        }],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`The media session action "${action}" is not supported yet.`);
      }
    }
  }

  destroy() {
    if (this.audio) {
        this.audio.pause();
        this.audio = null;
    }
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
    }
  }
}

export const MediaControlService = new MediaControlServiceWeb();
