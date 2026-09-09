---
id: m01-workspace
title: Workspace split: apps/web + packages/domain
status: todo
depends_on: []
attempts: 0
---

Implements **Task 1** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

Move-only restructure. pnpm workspace, packages/domain, apps/web, eslint package boundaries, CI paths.

Acceptance: same test count as before, `pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm build` green, `apps/web/dist` exists, zero behaviour change in the web app.
