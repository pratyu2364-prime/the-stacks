---
id: t04-supabase
title: Schema, RLS, and the data layer
status: todo
depends_on: [t01-scaffold]
attempts: 0
---

Supabase migrations in `supabase/migrations/`, exactly the schema in spec §4:
books, profiles, user_books, sessions, with the stated indexes.

- RLS enabled on all four. Policies per spec §4: books world-readable and
  insert-only for authenticated; profiles/user_books/sessions owner-only via
  `auth.uid()`. `user_id` defaults to `auth.uid()` and `with check` rejects
  anything else, so the client never sends it.
- Signup trigger creating a `profiles` row.
- pgTAP tests in `supabase/tests/`: every policy, including user B reading zero
  of user A's sessions and nobody updating a cached book.
- `src/data/`: typed supabase client from `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY`, plus query functions (listLibrary, addBook,
  logSession, listSessions). No React, no three.
- `.env.example` with both vars. Never commit real values.

Acceptance: `supabase db reset` applies cleanly and pgTAP passes locally.
