# Frontend Architecture Guide

## Goals

- High maintainability with domain-driven folders.
- Reusable UI components through a global design system.
- Single source of truth for tokens, theme and state.

## Folder Structure

- `app/design-system/styles`: global token and style layers.
- `app/components/base`: reusable cross-feature primitives (`BaseButton`, `BasePanel`, etc.).
- `app/features/finance`: finance domain (`components`, `stores`, `composables`, `constants`).
- `app/pages`: route-level composition only.
- `app/layouts`: application shell.
- `stories/base`: visual catalog and usage examples for base components.

## Design System Rules

- Use semantic CSS variables only (`--ds-*`), never hardcode hex in feature components.
- Keep theme switching centralized in store action `applyTheme`.
- Prefer base components for controls and containers before creating new local UI.

## Component Rules

- `Base*` components are generic and feature-agnostic.
- Feature components must focus on finance behavior and compose `Base*` primitives.
- Keep route pages thin: orchestration + composition only.

## Lint Boundaries

- ESLint uses `eslint-plugin-boundaries` in `eslint.config.mjs`.
- Main element types: `app-root`, `layout`, `page`, `feature`, `base`, `design-system`, `shared`.
- Default policy is `disallow`; allowed dependencies are explicit by layer.
- Compatibility wrappers (`app/stores`, `app/composables`) can only point to `feature`/`shared`.

## Storybook

- Storybook uses `@storybook/vue3-vite` with config in `.storybook`.
- Base component stories live in `stories/base`.
- Shared styles/tokens are loaded through `.storybook/preview.ts`.

## State Rules

- Finance state is centralized in `app/features/finance/stores/useFinanceStore.ts`.
- Async side effects live in store actions.
- View components should not call API directly.

## Supabase Integration Rules

- Public/browser helper: `app/utils/supabase/client.ts`.
- Server helper for cookie-aware SSR client: `server/utils/supabase/server.ts`.
- Session refresh middleware: `server/middleware/supabase-session.ts`.
- Server routes continue using repository abstraction in `server/utils/repo.ts`.
