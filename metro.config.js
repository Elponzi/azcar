const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'mp3'
);

// Enable package exports for React 19 / ESM compatibility on Web
config.resolver.unstable_enablePackageExports = true;

module.exports = config;