---
id: m06-add-book
title: Add a book from Open Library
status: todo
depends_on: [m05-outbox]
attempts: 0
---

Implements **Task 6** of `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`. That task's Files, Interfaces and numbered
TDD steps are the specification — follow them exactly, including the test code
given there. Read the plan's Global Constraints before starting.

Reuse the web app's search + cache + user_books insert path from @stacks/data. Debounced search screen, shelf reloads on add.

Acceptance: same data path as web (no second genre rule), network errors shown plainly, typecheck + tests green.
