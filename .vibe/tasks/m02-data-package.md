---
id: m02-data-package
title: Platform-neutral @stacks/data
status: todo
depends_on: [m01-workspace]
attempts: 0
---

Implements **Task 2** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

Move src/data into packages/data. createStacksClient({url,anonKey,storage}) factory; every query takes the SupabaseClient as first arg; no import.meta.env or localStorage in the package. Web gets apps/web/src/supabase.ts.

Acceptance: client.test.ts passes (injected storage used, empty url throws), whole workspace green, web E2E sign-in -> shelve -> log still passes.
