# Financeiro Familiar (Nuxt 3 + Supabase + PWA)

Aplicativo financeiro sem login tradicional, com acesso via `edit_key`, planilha editavel, dashboard com graficos ECharts, calendario anual/3 meses/mensal e modo dark/light com paleta customizavel.

## Stack

- Nuxt 3 / Vue 3 / TypeScript
- Pinia
- ESLint (`@nuxt/eslint`) + architectural boundaries (`eslint-plugin-boundaries`)
- AG Grid Community
- Apache ECharts + vue-echarts
- FullCalendar (dayGrid + multimonth)
- Storybook (`@storybook/vue3-vite`)
- PWA via `@vite-pwa/nuxt`
- Supabase (opcional, com fallback em memoria)

## Arquitetura frontend

- `app/design-system/styles`: tokens globais e estilo semantico.
- `app/components/base`: componentes reutilizaveis (`BaseButton`, `BasePanel`, `BaseInput`, etc.).
- `app/features/finance`: organizacao por dominio (componentes, store, composables e constantes).
- Guia: `docs/FRONTEND_ARCHITECTURE.md`.

## Primeiros passos

```bash
npm install
cp .env.example .env
npm run dev
```

Abra:

- `http://localhost:3000/?key=<EDIT_KEY>`

Se `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` estiverem vazios, o app roda com repositiorio em memoria e seed automatico de `dados.txt`.

## Supabase

1. Crie projeto Supabase.
2. Rode SQL em `supabase/migrations/0001_init.sql`.
3. Preencha variaveis no `.env` ou `.env.local`.
4. Inicie o app e acesse `/api/bootstrap?key=<EDIT_KEY>` para seed inicial.

Observacoes de chaves:

- O projeto aceita tanto nomes `NUXT_PUBLIC_*` quanto `NEXT_PUBLIC_*` para URL/chave publishable.
- Para operacoes server com persistencia total, prefira definir `SUPABASE_SERVICE_KEY` (ou `SUPABASE_SECRET_KEY`).
- Sem chave server, o backend tenta usar a publishable key e pode ser limitado por RLS/permissoes.

## Deploy (Vercel)

Deploy de producao atual:

- `https://financeiro-familiar-delta.vercel.app`

Comandos:

```bash
npx vercel deploy --prod --yes
```

Variaveis recomendadas na Vercel para persistencia real:

- `EDIT_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`

Sem `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`, o app usa fallback em memoria com seed padrao.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run lint:fix`
- `npm run storybook`
- `npm run storybook:build`

## APIs

- `GET /api/bootstrap?key=...`
- `POST /api/entries/batch?key=...`
- `POST /api/rules/rebuild?key=...`
- `POST /api/import/csv?key=...`
- `POST /api/settings/theme?key=...`
- `POST /api/settings/dashboard?key=...`

## Capacitor (fase 2)

Arquivo base em `capacitor.config.ts` para empacotamento Android usando a mesma base web.
