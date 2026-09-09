---
id: t03-world
title: The 3D world, built from a WorldModel
status: todo
depends_on: [t02-domain]
attempts: 0
---

`src/world/` — vanilla three.js, imperative, no React inside the render loop.
Entry point `createWorld(canvas, model: WorldModel): { dispose(): void }`.

Reference implementation to port (geometry, palette, lighting all proven):
`/tmp/claude-1000/-home-pratyush/c94da3ee-e22a-43c1-af7c-1e61f6e89d12/scratchpad/brainstorm/.superpowers/brainstorm/771-1788950786/content/hex-3d-v2.html`
Read it. Keep its look exactly — lamplit oak, warm point lights, sconces down
every corridor, pendant in every neighbour room, dust, bloom. Do NOT keep its
collision code; use `domain/regions.ts`.

- Reading Room hex: desk with the `model.reading` books, hanging lamp, light
  shaft, dust. Six arches; an arch is bricked up for a genre with no room.
- One genre hex per `model.rooms` entry, down a lit corridor, five shelved walls
  x five boards, packed by `domain/shelves.ts`.
- Titled spines: canvas texture per book, title + author, gilt rules, cloth
  grain. Spine width from the model. Bookend after the last book on each board.
- The Stacks: one `InstancedMesh` of dim untitled stock per genre room.
- Pointer lock, WASD, shift, Esc. Crosshair look-at shows title/author/pages.
- Split across files, each under 300 lines: `scene.ts`, `rooms.ts`, `books.ts`,
  `lighting.ts`, `controls.ts`, `spineTexture.ts`.
- `?lite` query flag: pixel ratio 1, bloom off.
- Mounted at `/library` by a React component that owns only the canvas element
  and calls `createWorld` in an effect, disposing on unmount.

Until t05 lands, `/library` feeds `createWorld` a fixture model from
`src/world/fixture.ts` (~30 books across 3 genres).

Acceptance: `pnpm dev`, visit /library, walk from the Reading Room into every
genre room and back with no invisible walls; spines legible at 1m; 60fps at
1080p; no console errors; `pnpm test` still green.
