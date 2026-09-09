---
id: t06-dashboard
title: Dashboard
status: todo
depends_on: [t05-auth-books-sessions]
attempts: 0
---

`/dashboard` using `domain/stats.ts` only — no stats logic in the component.
Current streak (with the lamp motif), pages this week, minutes this week, books
finished per month as a hand-rolled SVG bar chart (no chart library), books in
progress, recent sessions list, and a prominent "log a session" entry point.

Responsive to phone width. Follows the world's palette: dark, warm, serif titles,
mono numerals.

Acceptance: Playwright — after one logged session the dashboard shows streak 1
and the correct page count. Unit tests already cover the maths.
