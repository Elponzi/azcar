import { isExpoGo } from '@/utils';

export const setupNativePlayer = () => {
  if (!isExpoGo) {
    const TrackPlayer = require('react-native-track-player').default;
    TrackPlayer.registerPlaybackService(() => require('./playbackService').PlaybackService);
  }
};
