// Keep Metro config simple and compatible with Expo + RN 0.76
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
