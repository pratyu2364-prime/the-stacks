---
id: m08-delete-account
title: Account deletion edge function
status: todo
depends_on: [m07-nudge]
attempts: 0
---

Implements **Task 8** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

supabase/functions/delete-account: verify caller JWT, delete with service role, cascade. Settings button behind a confirm dialog.

Acceptance: 204 for a valid JWT and the auth.users row plus sessions gone; 401 with no header. Service-role key never leaves the function env.
