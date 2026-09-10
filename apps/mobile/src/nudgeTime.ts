import * as SecureStore from 'expo-secure-store';

export const NUDGE_TIME_KEY = 'nudge-time';
export const DEFAULT_NUDGE_TIME = { hour: 20, minute: 0 } as const;

export type NudgeTime = { hour: number; minute: number };

export async function readNudgeTime(): Promise<NudgeTime> {
  const raw = await SecureStore.getItemAsync(NUDGE_TIME_KEY);
  if (!raw) return { ...DEFAULT_NUDGE_TIME };
  try {
    const parsed = JSON.parse(raw) as Partial<NudgeTime>;
    const hour = typeof parsed.hour === 'number' ? parsed.hour : DEFAULT_NUDGE_TIME.hour;
    const minute = typeof parsed.minute === 'number' ? parsed.minute : DEFAULT_NUDGE_TIME.minute;
    return { hour, minute };
  } catch {
    return { ...DEFAULT_NUDGE_TIME };
  }
}

export async function writeNudgeTime(time: NudgeTime): Promise<void> {
  await SecureStore.setItemAsync(NUDGE_TIME_KEY, JSON.stringify(time));
}