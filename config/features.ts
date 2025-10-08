export const features = {
  chat: false,
  touch: true,
  buzz: true,
  calendar: true,
  sharedGallery: true,
  dailyPing: true,
  timeline: true,
  album: false,
  privacyLock: true,
  premiumMock: true,
  simpleCallLink: true, // thay VoIP bằng tel:/facetime:
} as const;

export type FeatureKey = keyof typeof features;

export function isFeatureEnabled(key: FeatureKey) {
  return Boolean(features[key]);
}

export default features;
