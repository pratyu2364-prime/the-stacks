import * as Notifications from 'expo-notifications';
import { dayKey, type Session } from '@stacks/domain';

export function shouldNudgeToday(sessions: Session[], today: Date): boolean {
  const key = dayKey(today);
  return !sessions.some((s) => s.readOn === key);
}

export async function cancelNudges(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleDailyNudge(hour: number, minute: number): Promise<void> {
  await cancelNudges();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'The Stacks', body: 'Read anything today?', data: { route: '/log' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function syncNudge(
  sessions: Session[],
  today: Date,
  time: { hour: number; minute: number },
): Promise<void> {
  if (shouldNudgeToday(sessions, today)) await scheduleDailyNudge(time.hour, time.minute);
  else await cancelNudges();
}
