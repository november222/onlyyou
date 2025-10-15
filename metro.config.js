// React Native 0.76 requires extending '@react-native/metro-config'.
// Merge Expo's defaults with RN's to keep Expo plugins working.
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const rnConfig = getDefaultConfig(projectRoot);
const expoConfig = getExpoDefaultConfig(projectRoot);

const config = mergeConfig(rnConfig, expoConfig);

// Resolver tweaks
config.resolver = {
  ...config.resolver,
  sourceExts: [...new Set([...(config.resolver?.sourceExts || []), 'cjs', 'mjs'])],
};

// Keep function names readable during dev
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: false,
    keep_fnames: true,
  },
};

module.exports = config;
