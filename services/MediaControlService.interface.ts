export interface MediaMetadata {
  title: string;
  artist: string;
  artwork?: any; // ImageSource or URL
}

export interface MediaControlServiceInterface {
  setupPlayer(): Promise<void>;
  updateMetadata(metadata: MediaMetadata): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  destroy(): void;
  registerRemoteEvents(
    onNext: () => void,
    onPrevious: () => void,
    onPlay: () => void,
    onPause: () => void
  ): void;
}
