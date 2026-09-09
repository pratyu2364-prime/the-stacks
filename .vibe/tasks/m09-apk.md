---
id: m09-apk
title: EAS preview APK
status: todo
depends_on: [m08-delete-account]
attempts: 0
---

Implements **Task 9** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

apps/mobile/eas.json preview profile (buildType apk, internal). Build, back up the EAS keystore, smoke test the whole path on a real device.

Acceptance: installable APK URL; sign in, add, log offline, reconnect, nudge all work on device. NOTE: `eas login` is interactive and must be run by the user.
