import { shouldNudgeToday } from './nudge';
import type { Session } from '@stacks/domain';

const session = (readOn: string): Session => ({
  id: readOn,
  userBookId: 'ub1',
  readOn,
  pageStart: null,
  pageEnd: null,
  minutes: 20,
  mood: null,
  note: null,
});

it('nudges when today has no session', () => {
  expect(shouldNudgeToday([session('2026-09-08')], new Date('2026-09-09T20:00:00'))).toBe(true);
});

it('stays quiet when today already has one', () => {
  expect(shouldNudgeToday([session('2026-09-09')], new Date('2026-09-09T20:00:00'))).toBe(false);
});

it('nudges a reader with no sessions at all', () => {
  expect(shouldNudgeToday([], new Date('2026-09-09T20:00:00'))).toBe(true);
});
