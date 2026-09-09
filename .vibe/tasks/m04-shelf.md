---
id: m04-shelf
title: Shelf and book screens
status: todo
depends_on: [m03-mobile-auth]
attempts: 0
---

Implements **Task 4** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

useLibrary hook over loadLibrary(supabase), streak from @stacks/domain, SectionList shelf grouped by status, book detail with its sessions.

Acceptance: library.test.ts green (shelf + streak), empty state present, rows route to /book/[id].
