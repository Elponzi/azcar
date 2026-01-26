import TrackPlayer from 'react-native-track-player';

export const setupNativePlayer = () => {
  TrackPlayer.registerPlaybackService(() => require('./playbackService').PlaybackService);
};
