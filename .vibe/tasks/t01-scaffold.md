---
id: t01-scaffold
title: Repo skeleton, CI, and GitHub Pages deploy
status: todo
depends_on: []
attempts: 0
---

Vite + React 18 + TypeScript (strict) SPA, pnpm. Tailwind configured with the
warm lamplit palette (paper #efe6d2, ink #1a1410, lamp #ffb45c, oak #5a3f26).

- `src/domain/`, `src/data/`, `src/world/`, `src/ui/` directories, each with an
  index barrel. ESLint `no-restricted-imports` enforcing the layer rules in
  spec §3: domain imports nothing; data must not import three or react;
  world must not import supabase or react.
- Vitest configured, one placeholder domain test that actually asserts something.
- React Router with routes `/`, `/login`, `/signup`, `/dashboard`, `/books`,
  `/books/:id`, `/library`. Unbuilt routes render a styled "not built yet" panel.
- Landing page at `/`: name, one paragraph on what it is, sign-in / sign-up
  buttons (non-functional stubs are fine this task).
- Vite `base: '/the-stacks/'`. `public/404.html` copying index.html so SPA deep
  links survive Pages.
- `.github/workflows/ci.yml`: pnpm install, typecheck, lint, test — on PRs.
- `.github/workflows/deploy.yml`: on push to main, build and deploy to Pages
  using actions/configure-pages + upload-pages-artifact + deploy-pages.

Acceptance:
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass locally.
- Every file under 500 lines.
- After merge, https://pratyu2364-prime.github.io/the-stacks/ serves the landing
  page and a deep link to /the-stacks/dashboard does not 404.
