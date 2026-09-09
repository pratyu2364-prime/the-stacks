---
id: t02-domain
title: Pure domain layer — stats, genre, shelves, regions
status: todo
depends_on: [t01-scaffold]
attempts: 0
---

All pure TypeScript in `src/domain/`, zero imports outside the layer, all
unit-tested with Vitest. Types first, in `src/domain/types.ts`, matching spec §4
and §3 (Book, UserBook, Session, Genre, WorldModel).

1. `genre.ts` — `bucketGenre(subjects: string[]): Genre` over the six slugs
   fiction | philosophy | science | history | arts | practical. Ordered keyword
   table, first match wins, fiction marker beats everything, practical is the
   fallback. Test with at least 20 realistic Open Library subject arrays.
2. `stats.ts` — from `Session[]`:
   - `currentStreak(sessions, today)` — consecutive local days with >=1 session,
     today or yesterday keeps it alive; two sessions same day count once.
   - `pagesInRange`, `minutesInRange`, `booksFinishedByMonth`.
   Tests must cover: empty input, gap of one day, gap of two days, two sessions
   on one day, sessions out of chronological order.
3. `shelves.ts` — `spineWidth(pages)` mapping 0..850pp to 0.09..0.25m clamped,
   and `packShelves(books, boardsPerRoom, boardSpan)` filling boards left to
   right, returning boards plus the leftover gap per board. Deterministic.
4. `regions.ts` — `isInsideWorld(p, layout)` region test: home hex, corridor
   rectangles, genre hexes. Regions MUST overlap; include a test that walks a
   straight line in 5cm steps from the Reading Room centre into every genre room
   and asserts every point is legal (this is the doorway bug from the prototype).
5. `buildWorldModel.ts` — rows in, `WorldModel` out, using the above.

Acceptance: `pnpm test` green, coverage of these five files is meaningful (each
exported function has at least one failing-edge test), nothing outside
`src/domain/` touched.
