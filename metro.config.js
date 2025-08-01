const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for WebRTC
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-webrtc': 'react-native-webrtc/lib/index.js',
};

module.exports = config;