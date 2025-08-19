export const features = {
  buzz: true,
  dailyPing: true,
  timeline: true,
  album: true,
  privacyLock: true,
  premiumMock: true,
  simpleCallLink: true, // thay VoIP bằng tel:/facetime:
} as const;

export type FeatureKey = keyof typeof features;

// Helper function to check if feature is enabled
export const isFeatureEnabled = (feature: FeatureKey): boolean => {
  return features[feature];
};