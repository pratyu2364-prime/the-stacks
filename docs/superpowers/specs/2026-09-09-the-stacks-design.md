# The Stacks — design

**Date:** 2026-09-09
**Status:** awaiting review
**Repo:** `pratyu2364-prime/the-stacks` (public)
**Live:** `https://pratyu2364-prime.github.io/the-stacks/`

---

## 1. What this is

A reading-habit tracker whose payoff is a first-person 3D library you can walk
through. You log what you read; the library is built out of those rows. An empty
shelf is an honest report on your month.

Two surfaces over one database:

- **The app (2D)** does the work — sign up, add a book, log a session, write what
  you thought, see your progress.
- **The world (3D)** is the reward — every book you logged stands on a shelf with
  its title on the spine, in the room for its genre. Beyond your rooms lie *the
  Stacks*: dim, untitled Open Library stock you have not claimed.

The world is a **read-only view** of your data in V1. Nothing is created by
walking; walking is for seeing what you built.

### Why it exists

The user reads daily and wants (a) a low-friction record of the habit, including
the thought-flow after a session, and (b) something that makes the record worth
revisiting. Spreadsheet trackers fail on (b). Goodreads fails on (a) — its unit
is the book, not the sitting.

### Who uses it

Multi-user from day one: anyone can sign up, and each account gets its own
library. There is no social layer in V1 — no following, no public profiles, no
shared reviews. Ratings and reviews shown during discovery come from Open
Library, not from this site's users.

---

## 2. Scope

### V1 — what gets built

1. Email + password auth (Supabase), session persisted, protected routes.
2. Add a book: search Open Library, pick an edition, it lands in your library
   with an auto-assigned genre you can override.
3. Log a session against a book: date, page start/end, minutes, mood, free-text
   note. The note is the "thought flow" — it is the point, not a nice-to-have.
4. Book page: the chronological thread of your sessions on that book.
5. Dashboard: current streak, pages this week, minutes this week, books finished
   per month, books in progress.
6. The world: Reading Room + one hex room per genre you own books in, populated
   from your rows, titled spines, walkable, book info on look-at.
7. Deployed to GitHub Pages from `main` via Actions.

### V2 — explicitly not now

- Pulling a book out of the Stacks to add it (V1 adds via the 2D search).
- Visual consequence of habit: dust on neglected books, lamp brightness by
  streak, wear on re-reads.
- Public profile pages / sharing a library link.
- Import from Goodreads CSV.
- Mobile touch controls for the world (V1: world is desktop; the 2D app is
  responsive and works on a phone).
- Highlights/quotes as a separate entity.

### Non-goals, permanently

- Our own ratings and reviews system. Cold-start makes it worthless, and
  moderation is a job nobody here wants.
- Reading DRM'd ebooks in-app. This tracks reading; it is not a reader.

---

## 3. Architecture

```
┌────────────────────────────────────────────┐
│  Browser (static bundle on GitHub Pages)   │
│                                            │
│  React + TS  ──────────  src/world/ (three)│
│   routes, forms,          imperative, owns │
│   dashboard               its render loop  │
│        │                        ▲          │
│        │  plain data (no React) │          │
│        └────────► worldModel ───┘          │
│                       ▲                    │
│                  src/domain/  (pure TS)    │
│                       ▲                    │
│                  src/data/  (supabase-js)  │
└───────────────────────┼────────────────────┘
                        │ HTTPS + JWT
              ┌─────────▼─────────┐      ┌──────────────────┐
              │ Supabase          │      │ Open Library API │
              │ Postgres + Auth   │◄─────┤ search, covers,  │
              │ RLS on every table│ cache│ subjects         │
              └───────────────────┘      └──────────────────┘
```

### Layers and their rules

| Layer | Owns | May import | Must not |
|---|---|---|---|
| `src/domain/` | streaks, aggregation, genre bucketing, shelf packing — pure functions | nothing | touch supabase, three, React, `window` |
| `src/data/` | supabase client, queries, Open Library fetch + cache | domain, supabase-js | touch three or React components |
| `src/world/` | scene graph, materials, camera, movement, spine textures | domain, three | touch supabase or React |
| `src/ui/` | routes, forms, dashboard, world mount point | all of the above | contain business rules |

Enforced by ESLint `no-restricted-imports`. The reason is testability: every
rule that decides *what the library looks like* lives in `src/domain/` and is
unit-tested without a browser, a GPU, or a network.

### The world's input contract

`src/world/` never queries anything. It is handed a `WorldModel`:

```ts
type WorldModel = {
  rooms: Array<{
    genre: Genre;                 // one hex room per genre owned
    shelves: Array<Array<{        // 25 boards: 5 walls x 5, in wall order,
                                  // each packed left to right
      id: string;
      title: string;
      author: string;
      pages: number;
      spineWidth: number;         // derived from pages, in metres
      status: 'reading' | 'finished' | 'abandoned';
    }>>;
  }>;
  reading: BookRef[];             // on the desk in the Reading Room
  streak: number;
};
```

Built by `domain/buildWorldModel.ts` from raw rows. This is the seam: the world
can be developed and screenshot-tested against a fixture with zero Supabase.

---

## 4. Data model

```sql
-- global book cache, filled on first touch from Open Library
books (
  id            uuid primary key default gen_random_uuid(),
  ol_work_key   text unique not null,        -- e.g. "/works/OL27448W"
  title         text not null,
  author        text not null,
  pages         int,                          -- null when OL has none; UI asks
  cover_id      int,                          -- OL cover id, may be null
  subjects      text[] not null default '{}',
  created_at    timestamptz not null default now()
)

profiles (
  id            uuid primary key references auth.users on delete cascade,
  handle        text unique,
  display_name  text,
  created_at    timestamptz not null default now()
)

user_books (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  book_id       uuid not null references books on delete restrict,
  status        text not null check (status in ('want','reading','finished','abandoned')),
  genre         text not null,                -- one of the six room slugs
  rating        int check (rating between 1 and 5),
  added_at      timestamptz not null default now(),
  finished_at   timestamptz,
  unique (user_id, book_id)
)

sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  user_book_id  uuid not null references user_books on delete cascade,
  read_on       date not null,
  page_start    int,
  page_end      int,
  minutes       int check (minutes between 0 and 1440),
  mood          text,                         -- free text, short
  note          text,                         -- the thought flow
  created_at    timestamptz not null default now()
)
```

Indexes: `sessions(user_id, read_on desc)`, `sessions(user_book_id, read_on)`,
`user_books(user_id, genre)`.

### RLS

Enabled on all four tables. No table is reachable without a policy.

- `profiles` — select/update where `id = auth.uid()`; insert on signup trigger.
- `user_books`, `sessions` — full CRUD where `user_id = auth.uid()`, nothing else.
  Verified by pgTAP: a second user's JWT sees zero rows.
- `books` — `select` to `anon` and `authenticated`; `insert` to `authenticated`;
  no update, no delete. It is a shared cache, so anyone may add to it and nobody
  may edit what someone else cached. Conflicts resolve on `ol_work_key` via
  `on conflict do nothing`.

`user_id` is never sent by the client. It is `default auth.uid()` on both owned
tables, and the `with check` clauses reject anything else.

### Derived values are computed, never stored

Streak, pages/week, books/month are functions of `sessions`. Storing them
invites drift. They are computed in `src/domain/stats.ts` over the rows already
fetched for the dashboard; at personal-library scale (thousands of sessions,
worst case) this is microseconds, and it keeps the schema honest.

---

## 5. Open Library integration

- **Search:** `GET https://openlibrary.org/search.json?q=…&limit=12&fields=key,title,author_name,number_of_pages_median,cover_i,subject`
- **Cover:** `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`
- No key, no quota, CORS-open, so the browser calls it directly.

Rules:

1. Search results are transient. Nothing is written until the user adds a book.
2. On add: upsert into `books` by `ol_work_key`, then insert `user_books`. The
   world and the dashboard read only from `books` — after the add, Open Library
   being down changes nothing.
3. `pages` missing from OL: the add form asks for it, because spine width is
   page count and a missing number makes an ugly shelf. Default 300 if skipped.
4. Requests are debounced 350ms and abort on keystroke.
5. If search fails, the add form offers manual entry (title, author, pages).
   Never a dead end because a third party is down.

### Genre bucketing

Six rooms, fixed: `fiction`, `philosophy`, `science`, `history`, `arts`,
`practical`.

`domain/genre.ts` maps OL `subject[]` to a room by ordered keyword rules, first
match wins, `fiction` as the fallback for anything with a fiction marker,
`practical` for the rest. The mapping is a table in one file, unit-tested with
~30 real OL subject arrays. The user can override the genre per book, and the
override always wins — the table only has to be right often enough to not annoy.

---

## 6. The world

### Layout

- **Reading Room** — the hex you spawn in. No shelves. A desk holding the books
  you are currently reading (status `reading`), a hanging lamp, a light shaft,
  dust. Six arches, one per genre; an arch is walled off if you own no books in
  that genre yet, so the room visibly opens up as your reading widens.
- **Genre rooms** — one hex per genre, reached down a lit corridor. Five shelved
  walls × five boards. Capacity ≈ 350 books per room; past that the room grows a
  second hex behind it (V2 concern, but the model must not preclude it).
- **The Stacks** — dim, untitled instanced stock lining both walls of the
  corridor between the Reading Room and each genre room, so you walk through the
  unclaimed catalogue to reach your own. Scenery in V1; interactive in V2.

### Rules that make it readable without UI

- Your books are lit, titled, saturated. The Stacks are dim, untitled, desaturated.
- Spine width is page count (0.09m–0.25m). A fat spine is a long book, always.
- Shelves fill left to right and stop at a bookend. The empty space to the right
  of the bookend is the truth about how much you have read.
- Currently-reading books are on the desk, not the shelf. They shelve themselves
  when marked finished.

### Movement and collision

Pointer lock, WASD, shift to hurry, Esc to release. Head height 1.62m with a
gentle bob.

Collision is **region-based, not mesh-based**: a position is legal if it is
inside the home hex, inside a corridor rectangle, or inside a genre hex.
Adjacent regions must **overlap** — the v0 prototype had a 0.3m gap between the
end of the corridor and the start of the room, which was an invisible wall in
every doorway. The region test is a pure function in `domain/regions.ts` with a
unit test that walks a straight line from the Reading Room into every genre room
and asserts no illegal point along the path.

### Performance budget

- Titled books: individual meshes, one canvas spine texture each. Budget 400 on
  screen; beyond that the far rooms drop to instanced untitled stock.
- The Stacks: `InstancedMesh` per room, one draw call, per-instance colour.
- Lights: ≤ 14 point lights, no shadow maps. Bloom is the only post pass.
- Target 60fps at 1080p on integrated graphics; a `?lite` flag halves pixel
  ratio and disables bloom.

### Loading

The world mounts behind a route (`/library`). It fetches rows once, builds the
`WorldModel`, then builds the scene. A progress line ("shelving 34 books…") is
shown while textures are generated, because 300 canvas draws is not instant.

---

## 7. The 2D app

Routes:

| Route | Contents |
|---|---|
| `/` | Landing: what it is, one screenshot of the world, sign in / sign up |
| `/dashboard` | Streak, pages this week, minutes, books in progress, recent sessions, "log a session" |
| `/books` | Your library: grid, filter by status and genre, add-a-book search |
| `/books/:id` | One book: cover, progress bar, the session thread oldest→newest, add session |
| `/library` | The 3D world |
| `/login`, `/signup` | Auth |

The log-session form is the most-used screen in the product and is designed as
such: it opens with the date defaulted to today, the book pre-selected if you
came from a book page, page-start pre-filled from your last session's page-end,
and the note field focused. Target: a logged session in under 20 seconds,
keyboard only.

Design language follows the world — dark, warm, paper and lamplight, serif for
book titles, mono for numbers. Not a generic dashboard.

---

## 8. Testing

| Level | Tool | What |
|---|---|---|
| Unit | Vitest | `domain/`: streak edge cases (timezone, gaps, same-day double sessions), page-delta maths, genre bucketing table, shelf packing, region collision |
| Contract | Vitest + MSW | Open Library adapter: real captured payloads, missing fields, 500s, aborts |
| Database | pgTAP | Every RLS policy, including "user B cannot read user A's sessions" and "nobody can update someone else's cached book" |
| E2E | Playwright | signup → add book → log session → dashboard shows streak 1 → `/library` renders and the new spine exists in the scene graph |
| Visual | Playwright screenshot | One canvas screenshot of the Reading Room against a fixture model, tolerance-compared, to catch "the world went black" regressions |

CI runs unit + contract + pgTAP + E2E on every PR. Deploy runs only on `main`
after CI is green.

---

## 9. Deployment

- Public repo, `main` is protected, work lands via PR.
- `ci.yml`: install, typecheck, lint, unit, contract, pgTAP (Supabase CLI local),
  Playwright.
- `deploy.yml`: on push to `main` — `supabase db push` against the production
  project, then `vite build` with `--base=/the-stacks/`, then Pages deploy.
  Migrations run before the bundle ships, and are forward-only.
- Secrets in GitHub: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`,
  `SUPABASE_PROJECT_REF`.
- Client config is **not** secret: `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` are baked into the public bundle by design. Safety
  comes from RLS, not from hiding the key. The service-role key is never used
  by this project and must never enter the repo or the Actions environment.

### Prerequisite the user must do once

Create a Supabase project (free tier) and hand over the project URL, the anon
key, the project ref, and the DB password. Nothing else about the build can be
finished without it, so it is the first blocking item.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| The world is a demo, not a habit | The 2D log flow is the product; the world must never be the only way to do anything |
| 200+ books makes a room look like a warehouse | Capacity is designed per room, and rooms multiply rather than shelves growing |
| Canvas spine textures blow memory | One texture per titled book, 128×384, capped at 400 on screen; the rest are instanced |
| Open Library metadata is patchy | Page count prompt on add, manual entry fallback |
| GitHub Pages serves from a subpath | `--base=/the-stacks/` and a hash-free router with a 404.html fallback |
| Streaks computed client-side disagree with the user's timezone | Sessions carry a `date`, not a timestamp; the day boundary is the user's local day at entry time |

---

## 11. Decisions already made

- Open Library, not Google Books: no key, no quota, no referrer games in a
  static bundle.
- Session-per-book is the atom; a day is a rollup of sessions, not its own row.
- The world reads, the app writes. One direction, V1.
- Vanilla three.js in its own module, not react-three-fiber: the render loop
  stays out of React's hands and the world layer stays portable.
- No own-reviews system, ever.
