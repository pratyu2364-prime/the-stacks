---
id: t05-auth-books-sessions
title: Auth, add-a-book, log-a-session
status: todo
depends_on: [t04-supabase]
attempts: 0
---

- Email + password signup/login/logout, session persisted, protected routes
  redirecting to /login, and /login redirecting signed-in users to /dashboard.
- Open Library adapter in `src/data/openLibrary.ts`: search.json with the fields
  from spec §5, 350ms debounce, abort on keystroke, typed result. MSW contract
  tests over captured payloads incl. missing page counts and a 500.
- `/books`: your library, filter by status and genre, add-a-book search panel.
  Adding upserts `books` by ol_work_key then inserts `user_books` with the
  bucketed genre (user-overridable in the form). Missing page count prompts.
  Manual-entry fallback when search fails.
- `/books/:id`: cover, progress, the session thread oldest to newest, add-session
  form: date defaults today, page_start prefilled from the last session's
  page_end, note field focused, saves in under 20 seconds keyboard-only.

Acceptance: Playwright E2E — signup, add a book, log a session, see it on the
book thread. Green in CI.
