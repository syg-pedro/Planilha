# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000/?key=demo-finance-key
npm run build        # production build
npm run preview      # preview production build
npm run test         # run all Vitest tests (also runs nuxt prepare first)
npm run test:watch   # vitest in watch mode
npm run typecheck    # Vue + TypeScript type checking
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run storybook    # Storybook on port 6006
```

To run a single test file:
```bash
npx vitest run tests/parser.test.ts
```

## Architecture

### Persistence layer

`server/utils/repo.ts` exports `getRepository()`, which returns either a Supabase repo or an in-memory repo depending on whether `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` env vars are set. The in-memory repo seeds itself from `dados.txt` (parsed by `shared/parser.ts`). All server API routes use this abstraction exclusively.

### `dados.txt` seed format

`dados.txt` is a plain-text natural-language file that `shared/parser.ts` parses into accounts, categories, rules, and entries. Card sections (lines containing "sicredi", "itau final 8235", "nubank limite", etc.) set an installment context; subsequent lines with month abbreviations create installment entries. Default seed data is hardcoded in `shared/defaultDadosText.ts` as fallback for serverless environments.

### Finance rules → entries

`shared/rules.ts` contains `buildEntriesFromRules()`, which generates `FinanceEntry` records from `FinanceRule` records that have `autoGenerate: true` and `frequency: 'monthly'`. The server runs this on bootstrap and exposes `/api/rules/rebuild` to regenerate them.

### Authentication

No login. Every API route (`server/utils/auth.ts`) checks `?key=` against `EDIT_KEY` (default: `demo-finance-key`). The frontend reads it from the URL on startup via the Pinia store.

### Frontend layer structure

```
app/design-system/styles/   ← CSS variables (--ds-*), never hardcode hex in components
app/components/base/        ← feature-agnostic primitives (BaseButton, BasePanel, etc.)
app/features/finance/       ← all finance UI: components, stores, composables, constants
app/pages/                  ← thin route wrappers (orchestration only)
app/stores/ + app/composables/  ← compat re-exports pointing into features
shared/                     ← types, pure business logic, no Vue/Nuxt imports
server/                     ← Nitro API routes + utils
```

Use `#shared/` alias to import from `shared/` inside the `app/` directory (e.g., `import type { FinanceEntry } from '#shared/types'`).

### ESLint architectural boundaries

`eslint-plugin-boundaries` enforces import rules. Violations are errors. Key rules:
- `feature` can only import from `base`, `design-system`, `shared`, and its **own** feature folder
- `base` can only import from `design-system` and `shared`
- `server` can only import from `shared` and `server`
- `shared` can only import from `shared`
- Stories and Storybook config are exempt from boundary rules

### State management

All finance state lives in `app/features/finance/stores/useFinanceStore.ts`. Components do not call APIs directly — use store actions. Theme switching is done via `applyTheme` store action, which writes `--ds-*` CSS variables onto `document.documentElement`.

### Supabase integration

- Server-side: `server/utils/supabase/server.ts` (cookie-aware SSR client)
- Client-side: `app/utils/supabase/client.ts` (browser client)
- DB schema: `supabase/migrations/0001_init.sql`
- DB rows use `snake_case`; TypeScript types use `camelCase` — `repo.ts` handles all mapping

## Environment variables

| Variable | Purpose |
|---|---|
| `EDIT_KEY` | Auth key for all API routes (default: `demo-finance-key`) |
| `SUPABASE_URL` | Supabase project URL (also `NUXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_SERVICE_KEY` | Service role key for server (also `SUPABASE_SECRET_KEY`) |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key for client-side Supabase |
| `DATA_FILE_PATH` | Custom path to `dados.txt`; defaults to `<cwd>/dados.txt` |

Copy `.env.example` to `.env` to get started. Without Supabase vars the app runs entirely in memory with auto-seeded data.
