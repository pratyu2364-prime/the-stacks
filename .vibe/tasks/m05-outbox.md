---
id: m05-outbox
title: Offline outbox and the log sheet
status: todo
depends_on: [m04-shelf]
attempts: 0
---

Implements **Task 5** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

expo-sqlite outbox, client-generated uuid, idempotent upsert flush, flush on foreground, log sheet writes locally first.

Acceptance: all four outbox tests green (sends+marks, keeps on failure, double flush writes one row, survives restart). Manual: log in airplane mode, reconnect, row reaches the website.
