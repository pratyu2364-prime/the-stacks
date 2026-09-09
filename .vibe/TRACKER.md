# The Stacks — tracker

Spec: `docs/superpowers/specs/2026-09-09-the-stacks-design.md`
Loop: `ship` skill, autopilot (self-merge on green CI).

| id | title | status | PR |
|---|---|---|---|
| t01-scaffold | Repo skeleton, CI, Pages deploy | done | #1 |
| t02-domain | Pure domain layer | done | #2 |
| t03-world | The 3D world from a WorldModel | done | #3 |
| t04-supabase | Schema, RLS, data layer | done | #4 |
| t05-auth-books-sessions | Auth, add book, log session | done | #5 |
| t06-dashboard | Dashboard | done | #6 |
| t07-world-live | World on real data, ship V1 | done | #7 |
| (post-V1) | no-db state, CI live build, new-reader fix, better search | done | #8-#11 |

### Mobile (Android companion)
Spec: `docs/superpowers/specs/2026-09-09-the-stacks-mobile-design.md`
Plan: `docs/superpowers/plans/2026-09-09-the-stacks-mobile.md`

| id | title | status | PR |
|---|---|---|---|
| m01-workspace | Workspace split: apps/web + packages/domain | todo | |
| m02-data-package | Platform-neutral @stacks/data | todo | |
| m03-mobile-auth | Expo app + email/password sign-in | todo | |
| m04-shelf | Shelf and book screens | todo | |
| m05-outbox | Offline outbox and the log sheet | todo | |
| m06-add-book | Add a book from Open Library | todo | |
| m07-nudge | Daily local nudge | todo | |
| m08-delete-account | Account deletion edge function | todo | |
| m09-apk | EAS preview APK | todo | |

## Activity
- t01-scaffold · done · PR #1 · attempts 1 · workers unavailable (opencode 500, hermes blocked by sandbox), reviewer implemented · deployed, site live
- t02-domain · done · PR #2 · 64 tests
- t03-world · done · PR #3 · stacks moved to corridors (spec updated); collision via domain/regions
- t04-supabase · done · PR #4 · pgTAP 14/14 in CI; two real bugs caught by the proof (blocked UPDATE raises nothing; throws_ok arg order)
- t05 · done · PR #5 · E2E signup→shelve→log green against a real Supabase stack
- t06 · done · PR #6 · dashboard reads only from domain/stats
- t07 · done · PR #7 · world on real rows; CI caught a real RLS bug: upsert needs an update policy the books cache deliberately lacks

V1 complete. Remaining to go live for real: a hosted Supabase project (supabase login, then link + db push, then the two VITE_ vars as repo secrets).
