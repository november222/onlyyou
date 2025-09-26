const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver configuration
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'cjs', 'mjs'],
  assetExts: [...config.resolver.assetExts],
};

// Ensure compatibility with Expo Go
config.transformer.minifierConfig = {
  mangle: false,
  keep_fnames: true,
};

module.exports = config;