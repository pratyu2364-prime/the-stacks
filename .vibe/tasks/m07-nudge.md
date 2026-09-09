---
id: m07-nudge
title: Daily local nudge
status: todo
depends_on: [m06-add-book]
attempts: 0
---

Implements **Task 7** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

shouldNudgeToday pure fn, scheduleDailyNudge/cancelNudges/syncNudge over expo-notifications, settings screen with nudge time in secure store, notification tap routes to the log sheet.

Acceptance: three nudge tests green, exactly one notification scheduled, cancelled once the day has a session.
