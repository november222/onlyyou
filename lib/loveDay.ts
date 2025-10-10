import AsyncStorage from '@react-native-async-storage/async-storage';

const REL_START_KEY = 'relationshipStartAt';

export async function getRelationshipStart(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REL_START_KEY);
  } catch {
    return null;
  }
}

export async function setRelationshipStart(iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(REL_START_KEY, iso);
  } catch {
    // noop
  }
}

export function daysBetween(startISO: string, nowDate: Date = new Date()): number {
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return 0;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const diffMs = nowDay.getTime() - startDay.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

