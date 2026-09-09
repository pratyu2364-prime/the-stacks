# The Stacks — tracker

Spec: `docs/superpowers/specs/2026-09-09-the-stacks-design.md`
Loop: `ship` skill, autopilot (self-merge on green CI).

| id | title | status | PR |
|---|---|---|---|
| t01-scaffold | Repo skeleton, CI, Pages deploy | done | #1 |
| t02-domain | Pure domain layer | done | #2 |
| t03-world | The 3D world from a WorldModel | done | #3 |
| t04-supabase | Schema, RLS, data layer | done | #4 |
| t05-auth-books-sessions | Auth, add book, log session | todo | |
| t06-dashboard | Dashboard | todo | |
| t07-world-live | World on real data, ship V1 | todo | |

## Activity
- t01-scaffold · done · PR #1 · attempts 1 · workers unavailable (opencode 500, hermes blocked by sandbox), reviewer implemented · deployed, site live
- t02-domain · done · PR #2 · 64 tests
- t03-world · done · PR #3 · stacks moved to corridors (spec updated); collision via domain/regions
- t04-supabase · done · PR #4 · pgTAP 14/14 in CI; two real bugs caught by the proof (blocked UPDATE raises nothing; throws_ok arg order)
