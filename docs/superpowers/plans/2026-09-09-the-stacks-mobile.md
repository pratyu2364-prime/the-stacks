# The Stacks Android Companion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a sideloadable Android app that logs reading sessions against the same Supabase project as the website, works offline, and nudges once a day.

**Architecture:** The repo becomes a pnpm workspace. `packages/domain` (already pure) and `packages/data` (Supabase + Open Library) move out of the web app so both clients share one implementation of streaks, stats and queries. `apps/web` is today's app minus those directories; `apps/mobile` is a new Expo Router app. Session writes go through a local SQLite outbox so a lost network never loses a log.

**Tech Stack:** pnpm workspaces, TypeScript, vitest, Supabase (supabase-js v2), Expo (SDK resolved by `create-expo-app@latest` at Task 3; record it in that PR), Expo Router, expo-secure-store, expo-sqlite, expo-notifications, React Native Testing Library, EAS Build.

**Spec:** `docs/superpowers/specs/2026-09-09-the-stacks-mobile-design.md`

## Global Constraints

- One Supabase project serves both clients. No new tables and no new RLS policies. The only new server code is the account-deletion edge function in Task 8.
- `packages/domain` imports nothing outside itself — no React, no three, no Supabase, no platform globals.
- `packages/data` may import `packages/domain` and `@supabase/supabase-js` only. It must not reference `import.meta.env`, `localStorage`, `window`, or any React Native module — every platform difference arrives as a constructor argument.
- Neither package may import from `apps/*`.
- Auth is email + password, the same accounts as the web app. No second identity provider.
- Session rows carry a client-generated uuid so inserts are idempotent.
- Notifications are local only. No FCM, no push tokens, no server.
- Every task ends green: `pnpm -r typecheck && pnpm -r lint && pnpm -r test`.
- Commit messages: lowercase `type: subject`, no `Co-Authored-By` trailer unless `.claude/settings.json` sets `attribution.commit`.

---

### Task 1: Workspace skeleton and the domain package

Move-only. The web app must behave identically at the end of this task.

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `packages/domain/package.json`, `packages/domain/tsconfig.json`
- Move: `src/domain/*` → `packages/domain/src/*` (11 files, tests included)
- Create: `apps/web/` — everything currently at the repo root that belongs to the web app: `src/` (minus `domain`), `index.html`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `playwright.config.ts`, `tests/`, `public/`
- Modify: root `package.json`, root `tsconfig.json`, `eslint.config.js`, `.github/workflows/*.yml`

**Interfaces:**
- Consumes: nothing.
- Produces: package `@stacks/domain`, exporting exactly what `src/domain/index.ts` exports today — `GENRES`, `Genre`, `BookStatus`, `Book`, `UserBook`, `Session`, `ShelvedBook`, `WorldModel`, `dayKey(d: Date): string`, `currentStreak(sessions: Session[], today: Date): number`, `pagesInRange(sessions, from, to): number`, `minutesInRange(sessions, from, to): number`, `booksFinishedByMonth(books: UserBook[]): Array<{ month: string; count: number }>`, plus the genre, shelves, regions and world-model functions.

- [ ] **Step 1: Record the baseline**

Run and save the output — this is what "identical behavior" is measured against:

```bash
pnpm test 2>&1 | tail -5
pnpm typecheck && pnpm lint && pnpm build
```

Expected: tests pass (64 domain tests among them), build succeeds.

- [ ] **Step 2: Declare the workspace**

`pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

allowBuilds:
  esbuild: true
```

- [ ] **Step 3: Move the web app under apps/web**

```bash
mkdir -p apps/web
git mv src index.html vite.config.ts tailwind.config.js postcss.config.js playwright.config.ts tests public apps/web/
git mv tsconfig.json apps/web/tsconfig.json
```

- [ ] **Step 4: Move the domain out of the web app**

```bash
mkdir -p packages/domain
git mv apps/web/src/domain packages/domain/src
```

- [ ] **Step 5: Give the domain package a manifest**

`packages/domain/package.json`:

```json
{
  "name": "@stacks/domain",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vitest": "^2.1.2"
  }
}
```

`packages/domain/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Note `"lib": ["ES2022"]` with no DOM. The domain is compiled without browser globals, so a stray `window` becomes a type error rather than a runtime surprise on the phone.

- [ ] **Step 6: Point the web app at the package**

In `apps/web/package.json` (created in Step 7) the dependency is `"@stacks/domain": "workspace:*"`. Rewrite the web app's imports:

```bash
cd apps/web
grep -rl "from '\.\./domain'\|from '\./domain'\|from '\.\./\.\./domain'" src | xargs sed -i "s#from '\(\.\./\)\+domain'#from '@stacks/domain'#g"
grep -rn "domain" src --include=*.ts --include=*.tsx | grep -v "@stacks/domain" | head
```

Expected from the last command: no remaining relative imports of the old directory.

- [ ] **Step 7: Split the root manifest**

`apps/web/package.json` takes everything the web app runs — the current `dependencies` and `devDependencies` from the root manifest, plus `"@stacks/domain": "workspace:*"`:

```json
{
  "name": "@stacks/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@stacks/domain": "workspace:*",
    "@supabase/supabase-js": "^2.116.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "three": "^0.185.1"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@playwright/test": "^1.63.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/three": "^0.185.4",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.12.0",
    "globals": "^15.11.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "typescript-eslint": "^8.8.1",
    "vite": "^5.4.8",
    "vitest": "^2.1.2"
  }
}
```

The root `package.json` keeps only workspace-wide scripts:

```json
{
  "name": "the-stacks",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "pnpm --filter @stacks/web build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

`apps/web/tsconfig.json` keeps its current contents but its `include` becomes `["src", "vite.config.ts"]`.

- [ ] **Step 8: Replace the directory layering rules with package boundaries**

Root `eslint.config.js` — the old `src/domain` and `src/data` entries go away, because a package that cannot resolve React is a stronger guarantee than a lint rule:

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '**/coverage', '**/.expo'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['three', 'react', 'react-dom', '@supabase/*', '@stacks/*', 'expo*', 'react-native*'], message: 'domain depends on nothing — see the mobile design spec, section 3.1.' },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['three', 'react', 'react-dom', 'expo*', 'react-native*', '@stacks/web', '@stacks/mobile'], message: 'data is platform-neutral — inject platform differences, see spec section 3.1.' },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/world/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@supabase/*', 'react', 'react-dom', '@stacks/data'], message: 'world renders a WorldModel and knows nothing else — see the V1 spec, section 3.' }] },
      ],
    },
  },
);
```

- [ ] **Step 9: Fix CI paths**

In `.github/workflows/`, every `run:` that assumed the app was at the root gains a working directory. The build step becomes `pnpm --filter @stacks/web build`, and the Pages upload path becomes `apps/web/dist`. Read each workflow file and update it; do not guess the filenames.

- [ ] **Step 10: Verify nothing changed**

```bash
pnpm install
pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm build
```

Expected: same test count as Step 1, build succeeds, `apps/web/dist` exists.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: split the repo into apps and packages"
```

---

### Task 2: The data package, with the platform seam

`packages/data` currently reads `import.meta.env` and calls `localStorage` through supabase-js defaults. React Native has neither. The client becomes a factory.

**Files:**
- Move: `apps/web/src/data/*` → `packages/data/src/*`
- Create: `packages/data/package.json`, `packages/data/tsconfig.json`, `packages/data/src/client.test.ts`
- Modify: `packages/data/src/client.ts`, `packages/data/src/library.ts`, `packages/data/src/openLibrary.ts` (import path only)
- Create: `apps/web/src/supabase.ts`
- Modify: every web file importing from `../data`

**Interfaces:**
- Consumes: `@stacks/domain` types.
- Produces: package `@stacks/data` exporting
  - `type StacksStorage = { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void>; removeItem(k: string): Promise<void> }`
  - `createStacksClient(config: { url: string; anonKey: string; storage: StacksStorage }): SupabaseClient`
  - `loadLibrary(client: SupabaseClient): Promise<{ books: Book[]; userBooks: UserBook[]; sessions: Session[] }>` and the other query functions, each taking the client as its first argument
  - `searchOpenLibrary(q: string)` unchanged.

- [ ] **Step 1: Write the failing test**

`packages/data/src/client.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createStacksClient } from './client';

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: async (k: string) => map.get(k) ?? null,
    setItem: async (k: string, v: string) => void map.set(k, v),
    removeItem: async (k: string) => void map.delete(k),
    map,
  };
};

describe('createStacksClient', () => {
  it('persists the session through the injected storage, not localStorage', async () => {
    const storage = memoryStorage();
    const client = createStacksClient({
      url: 'http://localhost:54321',
      anonKey: 'anon',
      storage,
    });

    await client.auth.setSession({ access_token: 'a.b.c', refresh_token: 'r' });

    expect([...storage.map.keys()].length).toBeGreaterThan(0);
  });

  it('rejects a missing url instead of silently pointing at localhost', () => {
    expect(() => createStacksClient({ url: '', anonKey: 'anon', storage: memoryStorage() })).toThrow(
      /url/i,
    );
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
pnpm --filter @stacks/data test
```

Expected: FAIL — `packages/data` does not exist yet.

- [ ] **Step 3: Create the package and move the files**

```bash
mkdir -p packages/data
git mv apps/web/src/data/client.ts apps/web/src/data/library.ts apps/web/src/data/openLibrary.ts apps/web/src/data/openLibrary.test.ts apps/web/src/data/index.ts packages/data/src/
```

`packages/data/package.json`:

```json
{
  "name": "@stacks/data",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "@stacks/domain": "workspace:*",
    "@supabase/supabase-js": "^2.116.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vitest": "^2.1.2"
  }
}
```

`packages/data/tsconfig.json` is `packages/domain/tsconfig.json` copied verbatim.

- [ ] **Step 4: Write the client factory**

`packages/data/src/client.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Session storage is a constructor argument because the two clients disagree:
 * the browser has localStorage, the phone has the Android Keystore behind
 * expo-secure-store. The data package must know about neither.
 */
export type StacksStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type StacksClientConfig = {
  url: string;
  anonKey: string;
  storage: StacksStorage;
};

/**
 * The anon key is public by design — it ships in both clients and RLS is what
 * keeps one reader out of another's library. The service-role key is never used
 * by this project and must never reach the repo, CI, or an APK.
 */
export function createStacksClient({ url, anonKey, storage }: StacksClientConfig): SupabaseClient {
  if (!url) throw new Error('supabase url is required');
  if (!anonKey) throw new Error('supabase anon key is required');

  return createClient(url, anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
```

- [ ] **Step 5: Run the test**

```bash
pnpm --filter @stacks/data test
```

Expected: PASS, both cases.

- [ ] **Step 6: Thread the client through the queries**

In `packages/data/src/library.ts`, delete `import { supabase } from './client'`, import `type { SupabaseClient } from '@supabase/supabase-js'`, and give every exported function the client as its first parameter:

```ts
export async function loadLibrary(
  client: SupabaseClient,
): Promise<{ books: Book[]; userBooks: UserBook[]; sessions: Session[] }> {
  const userBookRows = unwrap(await client.from('user_books').select('*').order('added_at'));
  // ...body otherwise unchanged, every `supabase.` becoming `client.`
}
```

Change the domain import at the top of the file from `'../domain'` to `'@stacks/domain'`. Apply the same treatment to every other exported query in the file. Do not change any query's behavior.

- [ ] **Step 7: Give the web app its singleton**

`apps/web/src/supabase.ts`:

```ts
import { createStacksClient, type StacksStorage } from '@stacks/data';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isConfigured = Boolean(url && anonKey);

const browserStorage: StacksStorage = {
  getItem: async (k) => window.localStorage.getItem(k),
  setItem: async (k, v) => window.localStorage.setItem(k, v),
  removeItem: async (k) => window.localStorage.removeItem(k),
};

/**
 * A build with no Supabase vars still has to render the "not open yet" state,
 * so the unconfigured case gets a client that points nowhere rather than a
 * throw at module load.
 */
export const supabase = createStacksClient({
  url: url || 'http://localhost:54321',
  anonKey: anonKey || 'anon',
  storage: browserStorage,
});
```

Then update the web app: import `supabase` and `isConfigured` from `../supabase` instead of `../data`, and pass `supabase` as the first argument at every query call site.

- [ ] **Step 8: Verify the whole workspace**

```bash
pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm build
```

Expected: green. Then run the web E2E suite against a local stack exactly as CI does, and confirm the sign-in → shelve → log path still passes.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: make the data layer platform-neutral"
```

---

### Task 3: The Expo app, signing in

**Files:**
- Create: `apps/mobile/` via `create-expo-app`
- Create: `apps/mobile/src/supabase.ts`, `apps/mobile/src/auth.tsx`
- Create: `apps/mobile/app/_layout.tsx`, `apps/mobile/app/sign-in.tsx`
- Create: `apps/mobile/src/auth.test.tsx`
- Modify: `apps/mobile/app.json`, `apps/mobile/package.json`

**Interfaces:**
- Consumes: `createStacksClient`, `StacksStorage` from `@stacks/data`.
- Produces: `supabase` (a configured `SupabaseClient`) from `apps/mobile/src/supabase.ts`; `AuthProvider`, `useAuth(): { session: Session | null; loading: boolean; signIn(email, password): Promise<void>; signUp(email, password): Promise<void>; signOut(): Promise<void> }` from `apps/mobile/src/auth.tsx`.

- [ ] **Step 1: Scaffold**

```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-router expo-secure-store expo-constants react-native-safe-area-context react-native-screens
pnpm add @stacks/domain@workspace:* @stacks/data@workspace:*
pnpm add -D jest-expo jest @testing-library/react-native @types/jest
```

Record the resolved Expo SDK version in the commit message. Rename the package to `@stacks/mobile` in `apps/mobile/package.json`, and add scripts:

```json
"scripts": {
  "start": "expo start",
  "android": "expo run:android",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "lint": "eslint ."
}
```

Metro must be told the workspace root — `apps/mobile/metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

- [ ] **Step 2: Write the failing test**

`apps/mobile/src/auth.test.tsx`:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from './auth';

jest.mock('./supabase', () => {
  const listeners: Array<(e: string, s: unknown) => void> = [];
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithPassword: jest.fn(async () => ({ error: null })),
      },
    },
  };
});

function Probe() {
  const { session, loading } = useAuth();
  return <Text>{loading ? 'loading' : session ? 'signed-in' : 'signed-out'}</Text>;
}

it('starts loading and settles to signed-out with no stored session', async () => {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
pnpm --filter @stacks/mobile test
```

Expected: FAIL — cannot resolve `./auth`.

- [ ] **Step 4: Write the client and the provider**

`apps/mobile/src/supabase.ts`:

```ts
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createStacksClient, type StacksStorage } from '@stacks/data';

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Tokens live in the Android Keystore, not in plain app storage: a password
 * session readable by anything on the device is the one thing here worth
 * getting right.
 */
const secureStorage: StacksStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createStacksClient({
  url: String(extra.supabaseUrl ?? ''),
  anonKey: String(extra.supabaseAnonKey ?? ''),
  storage: secureStorage,
});
```

`apps/mobile/app.json` gains, inside `expo` — the anon key is the public value already shipped in the website's bundle, recoverable with `gh secret list` context or by reading `VITE_SUPABASE_ANON_KEY` from the deployed bundle:

```json
"extra": {
  "supabaseUrl": "https://ntgdyhsezcfiakujbgdd.supabase.co",
  "supabaseAnonKey": "the same anon key the website ships"
},
"scheme": "thestacks",
"android": { "package": "app.thestacks.companion" }
```

`apps/mobile/src/auth.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthValue = {
  session: Session | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
};

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useAuth outside AuthProvider');
  return value;
}
```

- [ ] **Step 5: Run the test**

```bash
pnpm --filter @stacks/mobile test
```

Expected: PASS.

- [ ] **Step 6: Build the sign-in screen**

`apps/mobile/app/_layout.tsx` wraps the stack in `AuthProvider` and redirects to `/sign-in` when `session` is null and `loading` is false. `apps/mobile/app/sign-in.tsx` is email + password fields, a submit button that calls `signIn`, a toggle to `signUp`, an inline error line, and a note that password resets happen on the website. Keep it plain — a `View`, a `TextInput` with `autoCapitalize="none"` and `keyboardType="email-address"`, a second with `secureTextEntry`, a `Pressable`.

- [ ] **Step 7: See it run**

```bash
pnpm --filter @stacks/mobile android
```

Expected: the app opens on a device or emulator, and signing in with an account created on the website succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(mobile): the app, and signing in"
```

---

### Task 4: The shelf and the book

**Files:**
- Create: `apps/mobile/src/library.ts`, `apps/mobile/src/library.test.ts`
- Create: `apps/mobile/app/index.tsx`, `apps/mobile/app/book/[id].tsx`

**Interfaces:**
- Consumes: `loadLibrary(client)` from `@stacks/data`; `currentStreak`, `Book`, `UserBook`, `Session` from `@stacks/domain`.
- Produces: `useLibrary(): { books, userBooks, sessions, streak, loading, error, reload }` from `apps/mobile/src/library.ts`, where `streak` is `currentStreak(sessions, new Date())`.

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/library.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useLibrary } from './library';

jest.mock('@stacks/data', () => ({
  loadLibrary: jest.fn(async () => ({
    books: [{ id: 'b1', olWorkKey: '/works/OL1W', title: 'Dune', author: 'Herbert', pages: 600, coverId: null, subjects: [] }],
    userBooks: [{ id: 'ub1', bookId: 'b1', status: 'reading', genre: 'fiction', rating: null, addedAt: '2026-09-01', finishedAt: null }],
    sessions: [{ id: 's1', userBookId: 'ub1', readOn: '2026-09-09', pageStart: 1, pageEnd: 20, minutes: 30, mood: null, note: null }],
  })),
}));
jest.mock('./supabase', () => ({ supabase: {} }));

it('exposes the shelf and the streak from the shared domain', async () => {
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.userBooks).toHaveLength(1);
  expect(result.current.streak).toBe(1);
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
pnpm --filter @stacks/mobile test library
```

Expected: FAIL — cannot resolve `./library`.

- [ ] **Step 3: Implement the hook**

`apps/mobile/src/library.ts` calls `loadLibrary(supabase)` in an effect, stores the three arrays, derives `streak` with `currentStreak(sessions, new Date())`, exposes `reload`, and records `error` as a string rather than throwing into the render.

- [ ] **Step 4: Run the test**

```bash
pnpm --filter @stacks/mobile test library
```

Expected: PASS.

- [ ] **Step 5: Build the two screens**

`app/index.tsx`: a `SectionList` of the reader's books grouped by status in the order `reading`, `want`, `finished`, `abandoned`; a header showing the current streak; an empty state that says the shelves are empty rather than showing a spinner forever; a button routing to `/add`; a link to `/settings`. Each row routes to `/book/[id]`.

`app/book/[id].tsx`: title, author, status, the sessions for that book newest first, and a prominent button opening `/log?userBookId=<id>`.

- [ ] **Step 6: Verify on device, then commit**

```bash
pnpm --filter @stacks/mobile test && pnpm --filter @stacks/mobile typecheck
git add -A
git commit -m "feat(mobile): the shelf and the book"
```

---

### Task 5: The outbox and logging a session

The only genuinely new logic in this plan, and the part that is tested hardest.

**Files:**
- Create: `apps/mobile/src/outbox.ts`, `apps/mobile/src/outbox.test.ts`
- Create: `apps/mobile/app/log.tsx`

**Interfaces:**
- Consumes: `supabase` from `./supabase`; `Session` from `@stacks/domain`.
- Produces:
  - `type PendingSession = { id: string; userBookId: string; readOn: string; pageStart: number | null; pageEnd: number | null; minutes: number | null; mood: string | null; note: string | null }`
  - `type Outbox = { enqueue(s: PendingSession): Promise<void>; pending(): Promise<PendingSession[]>; flush(): Promise<{ sent: number; failed: number }> }`
  - `createOutbox(db: OutboxDb, client: SupabaseClient): Outbox`
  - `type OutboxDb` — the two calls used (`runAsync`, `getAllAsync`), so tests pass a fake and the app passes `expo-sqlite`.

- [ ] **Step 1: Write the failing tests**

`apps/mobile/src/outbox.test.ts`:

```ts
import { createOutbox, type PendingSession } from './outbox';

const row = (id: string): PendingSession => ({
  id,
  userBookId: 'ub1',
  readOn: '2026-09-09',
  pageStart: 1,
  pageEnd: 20,
  minutes: 30,
  mood: null,
  note: null,
});

/** A fake standing in for expo-sqlite: same two calls, plain arrays. */
function fakeDb() {
  const rows: Array<PendingSession & { sent: number }> = [];
  return {
    rows,
    async runAsync(sql: string, params: unknown[] = []) {
      if (sql.startsWith('insert')) {
        const [id] = params as string[];
        if (!rows.some((r) => r.id === id)) {
          rows.push({ ...(row(id) as PendingSession), sent: 0 });
        }
      }
      if (sql.startsWith('update')) {
        const [id] = params as string[];
        const found = rows.find((r) => r.id === id);
        if (found) found.sent = 1;
      }
    },
    async getAllAsync() {
      return rows.filter((r) => r.sent === 0);
    },
  };
}

function fakeClient(behavior: 'ok' | 'fail') {
  const inserted: string[] = [];
  return {
    inserted,
    from() {
      return {
        upsert: async (values: { id: string }[]) => {
          if (behavior === 'fail') return { error: { message: 'network' } };
          for (const v of values) if (!inserted.includes(v.id)) inserted.push(v.id);
          return { error: null };
        },
      };
    },
  };
}

it('sends a queued session and marks it sent', async () => {
  const db = fakeDb();
  const client = fakeClient('ok');
  const outbox = createOutbox(db as never, client as never);

  await outbox.enqueue(row('s1'));
  expect(await outbox.pending()).toHaveLength(1);

  const result = await outbox.flush();

  expect(result).toEqual({ sent: 1, failed: 0 });
  expect(await outbox.pending()).toHaveLength(0);
  expect(client.inserted).toEqual(['s1']);
});

it('keeps the row queued when the write fails', async () => {
  const db = fakeDb();
  const outbox = createOutbox(db as never, fakeClient('fail') as never);

  await outbox.enqueue(row('s1'));
  const result = await outbox.flush();

  expect(result).toEqual({ sent: 0, failed: 1 });
  expect(await outbox.pending()).toHaveLength(1);
});

it('flushing twice writes one row, not two', async () => {
  const db = fakeDb();
  const client = fakeClient('ok');
  const outbox = createOutbox(db as never, client as never);

  await outbox.enqueue(row('s1'));
  await outbox.flush();
  await outbox.enqueue(row('s1'));
  await outbox.flush();

  expect(client.inserted).toEqual(['s1']);
});

it('a session queued before a restart is still there after one', async () => {
  const db = fakeDb();
  await createOutbox(db as never, fakeClient('fail') as never).enqueue(row('s1'));

  const afterRestart = createOutbox(db as never, fakeClient('ok') as never);

  expect(await afterRestart.pending()).toHaveLength(1);
  expect(await afterRestart.flush()).toEqual({ sent: 1, failed: 0 });
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm --filter @stacks/mobile test outbox
```

Expected: FAIL — cannot resolve `./outbox`.

- [ ] **Step 3: Implement the outbox**

`apps/mobile/src/outbox.ts`. The table is created once:

```sql
create table if not exists outbox (
  id text primary key,
  user_book_id text not null,
  read_on text not null,
  page_start integer,
  page_end integer,
  minutes integer,
  mood text,
  note text,
  sent integer not null default 0
);
```

`enqueue` inserts with `insert or ignore` — re-queueing the same id must not duplicate. `pending` selects `where sent = 0`. `flush` reads the pending rows, sends them with `client.from('sessions').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })`, and on a null error marks each row `sent = 1`; on an error it leaves them alone and reports them as failed. The client-generated uuid is what makes the retry safe.

- [ ] **Step 4: Run the tests**

```bash
pnpm --filter @stacks/mobile test outbox
```

Expected: PASS, all four.

- [ ] **Step 5: Build the log sheet**

`app/log.tsx` takes `userBookId` from the route, offers pages-from / pages-to / minutes / mood / note, generates the id with `crypto.randomUUID()` (available in the Expo runtime; if it is not in the installed SDK, add `expo-crypto` and use `Crypto.randomUUID()`), calls `enqueue` then `flush`, and navigates back immediately without waiting for the network. The row appears in the list either way.

Wire `flush()` to run on app foreground in `app/_layout.tsx` via `AppState.addEventListener('change', ...)` when the next state is `active`.

- [ ] **Step 6: Verify offline behavior by hand**

Put the device in airplane mode, log a session, confirm it appears; leave airplane mode, foreground the app, and confirm the row reaches the website.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(mobile): log a session, offline or not"
```

---

### Task 6: Adding a book

**Files:**
- Create: `apps/mobile/app/add.tsx`
- Modify: `apps/mobile/src/library.ts` (add `addBook`)

**Interfaces:**
- Consumes: `searchOpenLibrary` and the book-cache insert path from `@stacks/data`; `genreFor` from `@stacks/domain`.
- Produces: `addBook(result: OpenLibraryResult, status: BookStatus): Promise<void>` on the library hook, which reloads the shelf on success.

- [ ] **Step 1: Read the web app's add path**

Open `apps/web/src/ui` and find the screen that adds a book. The mobile screen calls the same `@stacks/data` functions in the same order — search, cache the book, insert the `user_books` row. Do not invent a second path; a divergence here means the phone and the website disagree about a book's genre.

- [ ] **Step 2: Build the screen**

`app/add.tsx`: a search field, debounced by 300ms, a `FlatList` of results showing title and author, and a row tap that shelves the book with status `reading`. Show the network error plainly — this screen requires the network by design and must say so rather than pretending to queue.

- [ ] **Step 3: Verify and commit**

```bash
pnpm --filter @stacks/mobile test && pnpm --filter @stacks/mobile typecheck
git add -A
git commit -m "feat(mobile): add a book from Open Library"
```

---

### Task 7: The nudge

**Files:**
- Create: `apps/mobile/src/nudge.ts`, `apps/mobile/src/nudge.test.ts`
- Create: `apps/mobile/app/settings.tsx`
- Modify: `apps/mobile/app/_layout.tsx`

**Interfaces:**
- Consumes: `dayKey` from `@stacks/domain`; `expo-notifications`.
- Produces:
  - `shouldNudgeToday(sessions: Session[], today: Date): boolean` — pure, lives beside the scheduling code but takes no platform argument
  - `scheduleDailyNudge(hour: number, minute: number): Promise<void>`
  - `cancelNudges(): Promise<void>`
  - `syncNudge(sessions: Session[], today: Date, time: { hour: number; minute: number }): Promise<void>`

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/nudge.test.ts`:

```ts
import { shouldNudgeToday } from './nudge';
import type { Session } from '@stacks/domain';

const session = (readOn: string): Session => ({
  id: readOn,
  userBookId: 'ub1',
  readOn,
  pageStart: null,
  pageEnd: null,
  minutes: 20,
  mood: null,
  note: null,
});

it('nudges when today has no session', () => {
  expect(shouldNudgeToday([session('2026-09-08')], new Date('2026-09-09T20:00:00'))).toBe(true);
});

it('stays quiet when today already has one', () => {
  expect(shouldNudgeToday([session('2026-09-09')], new Date('2026-09-09T20:00:00'))).toBe(false);
});

it('nudges a reader with no sessions at all', () => {
  expect(shouldNudgeToday([], new Date('2026-09-09T20:00:00'))).toBe(true);
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
pnpm --filter @stacks/mobile test nudge
```

Expected: FAIL — cannot resolve `./nudge`.

- [ ] **Step 3: Implement**

```ts
import * as Notifications from 'expo-notifications';
import { dayKey, type Session } from '@stacks/domain';

export function shouldNudgeToday(sessions: Session[], today: Date): boolean {
  const key = dayKey(today);
  return !sessions.some((s) => s.readOn === key);
}

export async function cancelNudges(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleDailyNudge(hour: number, minute: number): Promise<void> {
  await cancelNudges();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'The Stacks', body: 'Read anything today?', data: { route: '/log' } },
    trigger: { hour, minute, repeats: true },
  });
}

export async function syncNudge(
  sessions: Session[],
  today: Date,
  time: { hour: number; minute: number },
): Promise<void> {
  if (shouldNudgeToday(sessions, today)) await scheduleDailyNudge(time.hour, time.minute);
  else await cancelNudges();
}
```

- [ ] **Step 4: Run the test**

```bash
pnpm --filter @stacks/mobile test nudge
```

Expected: PASS, all three.

- [ ] **Step 5: Wire it up**

`app/settings.tsx`: a time picker for the nudge (store `{hour, minute}` in `expo-secure-store` under `nudge-time`, default 20:00), a sign-out button, and a delete-account button (Task 8). Request notification permission on first save and say plainly what happens if it is denied.

`app/_layout.tsx`: on foreground, after the library loads, call `syncNudge(sessions, new Date(), storedTime)`. Handle a notification tap by routing to `/log?userBookId=<the most recently read book with status 'reading'>`, falling back to `/` when there is none.

- [ ] **Step 6: Verify by hand**

Set the nudge two minutes out, background the app, and confirm one notification arrives and that tapping it lands on the log sheet. Log a session, foreground the app, and confirm tomorrow's notification is the only one scheduled.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(mobile): the daily nudge"
```

---

### Task 8: Deleting an account

**Files:**
- Create: `supabase/functions/delete-account/index.ts`
- Modify: `apps/mobile/app/settings.tsx`

**Interfaces:**
- Consumes: the caller's JWT, sent as the `Authorization` header.
- Produces: `DELETE /functions/v1/delete-account` → 204 on success.

- [ ] **Step 1: Write the function**

The function verifies the caller's JWT, then deletes that user with the service-role key. The service-role key exists only in the function's environment, never in a client:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;

  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await caller.auth.getUser();
  if (error || !data.user) return new Response('unauthorized', { status: 401 });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return new Response(deleteError.message, { status: 500 });

  return new Response(null, { status: 204 });
});
```

Deletion cascades to `profiles`, `user_books` and `sessions` through the existing foreign keys.

- [ ] **Step 2: Verify against a local stack**

```bash
supabase functions serve delete-account
```

Sign in as a throwaway user, call the endpoint with that user's JWT, and confirm the `auth.users` row and their sessions are gone. Then call it with no header and confirm a 401.

- [ ] **Step 3: Wire the button**

In settings, a destructive button behind a confirmation dialog that names what is deleted, calling `supabase.functions.invoke('delete-account', { method: 'DELETE' })` and signing out on success.

- [ ] **Step 4: Deploy and commit**

```bash
supabase functions deploy delete-account
git add -A
git commit -m "feat: readers can delete their account"
```

---

### Task 9: The APK

**Files:**
- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.json` (version, versionCode)
- Modify: `docs/superpowers/specs/2026-09-09-the-stacks-mobile-design.md` (record the keystore backup location)

- [ ] **Step 1: Configure the build profiles**

`apps/mobile/eas.json`:

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

- [ ] **Step 2: Log in (this step is the human's)**

```bash
eas login
```

An Expo account is required and the login is interactive.

- [ ] **Step 3: Build**

```bash
cd apps/mobile
eas build -p android --profile preview
```

EAS generates and holds the signing keystore on first build. That same key must sign every later build or installs will fail with "app not installed" on upgrade. Run `eas credentials` and back the keystore up outside EAS, then note where in the spec.

- [ ] **Step 4: Install and smoke test**

Download the APK from the build URL, install it on a real device, and walk the whole path: sign in with the website account, see the shelf, add a book, log a session in airplane mode, come back online, confirm the session appears on the website, set a nudge and receive it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "build: android preview builds"
```

---

## Notes for whoever executes this

- Tasks 1 and 2 are refactors with no new behavior. If a test that passed before them fails after, the move is wrong — do not adjust the test.
- Task 5 is where the real risk is. The four outbox tests are the specification; if a change makes one awkward to keep, that is a signal about the design, not about the test.
- Nothing in `packages/domain` should need to change for any of this. If it does, stop and say why.
