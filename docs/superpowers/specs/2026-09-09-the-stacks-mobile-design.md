# The Stacks — Android companion app

Date: 2026-09-09
Status: approved design, ready for an implementation plan
Related: `docs/superpowers/specs/2026-09-09-the-stacks-design.md` (V1 web design)

## 1. Purpose

The web app's payoff is the walkable hex library: books you have read stand on
the shelf of their genre, and the empty shelf space is the honest part. That
payoff is a desktop experience. The habit that fills those shelves is not — it
happens on a train, in bed, in the ten minutes before sleep.

The Android app is the **capture and nudge surface** for that habit. It does not
render the world. It gets a reading session logged in two taps, and it asks you
once a day whether you read.

Success: a reading session logged from the phone appears on the shelf in the web
world with no further action, and a day of not reading produces exactly one
notification.

## 2. Scope

In v1:

- Email + password sign-in, the same accounts as the web app.
- Shelf: the reader's `user_books`, grouped by status.
- Book detail: that book's sessions, and a button to log another.
- Log sheet: pages read, minutes, optional mood and note.
- Add a book: Open Library search, reusing the web app's search and cache path.
- One daily local notification at a chosen time, skipped if the day already has
  a session.
- Settings: notification time, sign out, delete account.

Deliberately not in v1:

- Home-screen widget.
- Running session timer as an ongoing notification.
- The 3D world on the phone.
- Offline book search.
- Goodreads import.
- Google sign-in. The web app uses email and password; adding a second identity
  provider risks one reader owning two accounts, for no benefit at this size.
- Play Store release. Distribution is a sideloaded APK.

## 3. Architecture

### 3.1 Repository layout

The repo becomes a pnpm workspace with shared packages:

```
the-stacks/
  packages/
    domain/          # moved verbatim from src/domain
    data/            # supabase client, queries, Open Library
  apps/
    web/             # today's src/, minus domain and data
    mobile/          # new Expo app
```

`packages/domain` is pure: it imports nothing but its own modules, and its
existing tests move with it unchanged. Streak counts, stats, genre assignment
and shelf layout are computed here and only here, so the phone and the website
can never disagree about whether a streak is alive.

`packages/data` holds the Supabase client, the queries, and the Open Library
client. Its one platform seam is session storage: `createClient` takes a storage
adapter, web passes `localStorage`, mobile passes `expo-secure-store`. Open
Library access is plain `fetch` and needs no adaptation.

The eslint rule that enforced layering inside `src/` is replaced by package
boundaries: `domain` depends on nothing, `data` depends on `domain`, apps depend
on both, and neither package may import from an app.

The restructure ships as its own move-only pull request, with the web app's
behavior and the live site unchanged, before any mobile code is written. A
failing test in that PR means the move broke something.

### 3.2 Client and database

One Supabase project serves both clients: the same tables, the same row level
security policies, the same rows. The phone introduces no new tables, no new
policies, and no server code beyond the account deletion function in §6.

Reads go through `packages/data` and are filtered by RLS, not by client-side
`user_id` predicates. The shelf is one join from `user_books` to `books`. Streaks
and stats are computed in `packages/domain` over the fetched sessions; there is
no new SQL.

## 4. Writing sessions offline

Reading happens where the network does not. A logged session that is silently
lost to a tunnel is the fastest way to lose the reader's trust in the log, so
writes are queued locally rather than attempted once.

The `sessions` row id is generated on the client. That makes the insert
idempotent: a retry of the same row conflicts on the primary key and is
discarded, so a flush can safely run twice.

The flow:

1. The reader submits the log sheet. The row is written to a local outbox
   (`expo-sqlite`) and rendered immediately.
2. If the device is online, the insert is attempted at once.
3. On success the outbox row is marked sent.
4. On failure it stays queued, and the queue is flushed on the next app
   foreground and on regained connectivity.

The outbox holds session inserts only. Adding a book requires the Open Library
lookup and therefore the network; it fails loudly instead of queueing.

## 5. The nudge

The notification is entirely local: one daily trigger scheduled through
`expo-notifications` at the reader's chosen time. There is no push service, no
device token, and no server process to run or pay for.

On app foreground the app checks whether today already has a session, and
cancels the day's pending notification if it does. Tapping the notification
opens the log sheet for the most recently read book with status `reading`.

## 6. Account deletion

Settings offers account deletion, which calls a Supabase edge function that
deletes the `auth.users` row. The existing `on delete cascade` foreign keys
remove profiles, shelved books, and sessions. Distribution is a sideloaded APK
and no store policy compels this, but data belonging to the handful of people
using it should not be undeletable.

## 7. Testing

- `packages/domain`: vitest, as today. Unchanged by this work.
- `packages/data`: vitest against a local Supabase stack, covering that RLS
  actually blocks another reader's rows.
- Outbox: vitest. This is the only genuinely new logic, and it is tested hard —
  the queue survives a restart, a double flush produces one row, a failed flush
  retries, and a force quit loses nothing.
- Screens: React Native Testing Library, one path per screen — sign in, shelf
  renders, log writes. Behavior, not pixels.
- One manual smoke test on a real device per release.

## 8. Distribution

Builds run on the EAS free tier: `eas build -p android --profile preview`
produces a download URL to pass to the handful of installers, who allow install
from unknown sources once.

The signing keystore is generated and held by EAS and must stay the same for the
life of the app — a different key makes every upgrade fail to install. It is
backed up outside EAS.

Version bumps and builds are manual. Releases are rare and cloud builds are
slow, so a CI build lane is not worth its maintenance yet.

## 9. Risks

- **The restructure touches every import in the web app.** Mitigated by shipping
  it alone, as a move without behavior change, verified by the existing tests
  and the live site.
- **Secure storage of the session.** Tokens live in `expo-secure-store`, backed
  by the Android Keystore, not in plain app storage.
- **Password reset has no mobile path.** The reset email links to the website.
  Accepted for v1; a deep link is the fix when it becomes annoying.
- **EAS free tier build limits.** If they bind, `expo prebuild` plus a local
  Gradle release build is the escape hatch.
