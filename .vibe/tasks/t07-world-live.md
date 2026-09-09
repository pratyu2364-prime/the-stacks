---
id: t07-world-live
title: Wire the world to real data, and ship V1
status: todo
depends_on: [t03-world, t06-dashboard]
attempts: 0
---

- `/library` fetches the signed-in user's rows once, builds the WorldModel via
  `domain/buildWorldModel.ts`, and hands it to `createWorld`. Fixture is kept
  for tests only.
- Loading state while spine textures generate ("shelving 34 books...").
- Empty state: a new account gets the Reading Room with every arch bricked up
  and a line pointing at /books.
- Landing page gets a real screenshot of the world.
- Playwright: sign in, add a book, open /library, assert the scene graph
  contains a mesh whose userData.title matches the added book.
- Visual regression screenshot of the Reading Room against the fixture.

Acceptance: full E2E green in CI; deployed; the live site works end to end from
signup to walking past your own book.
