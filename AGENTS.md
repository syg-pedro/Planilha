# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

## Modern Stack Architecture (Java 21 + Spring Boot 3 & React 19 + Vite)

The legacy Nuxt 3 / Vue / Nitro implementation has been completely migrated to a high-performance, modular full-stack architecture:

- **Backend (`backend-java/`)**: Java 21, Spring Boot 3.4.5, Spring Security (JWT multi-tenant), Spring Data JPA, Flyway migrations, PostgreSQL 17, and Testcontainers.
- **Frontend (`frontend-react/`)**: React 19, TypeScript, Vite, HeroUI, Tailwind CSS, TanStack Query, Lucide Icons, and Dark Neon theme.
- **Local Infrastructure (`infra/`)**: Docker Compose for PostgreSQL 17.
- **Automation (`scripts/java-react/`)**: Local CI pipeline script (`ci-local.ps1`).

---

## Commands

```bash
# Frontend development server (http://localhost:5173)
npm run dev

# Frontend production build
npm run build:front

# Frontend unit tests (Vitest)
npm run test:front

# Frontend end-to-end tests (Playwright)
npm run test:e2e

# Backend unit & integration tests (Maven + Testcontainers PostgreSQL)
npm run test:back
npm run verify:back

# Unified local CI check
npm run ci

# Mobile development (Capacitor + Android)
npm run build:mobile       # Build frontend and sync with native Capacitor assets
npm run cap:sync           # Sync Capacitor assets and native plugins
npm run cap:open:android   # Open native Android project in Android Studio
```

---

## Directory & Package Structure

```
.
├── backend-java/               # Spring Boot 3.4.5 + Java 21 REST API
│   ├── src/main/java/com/financeiro/
│   │   ├── auth/               # Security, JWT, Multi-tenant HouseholdContext
│   │   ├── cadastros/          # Accounts, Categories, Rules, WishItems
│   │   ├── lancamentos/        # FinanceEntry, Installments, Mutations
│   │   ├── relatorios/         # Matrix, Monthly Projections, Debts, Cashflow
│   │   ├── onboarding/         # Excel (.xlsx) & CSV statement import engine
│   │   └── infra/              # Exceptions, audit, OpenAPI, CORS configuration
│   ├── src/main/resources/db/migration/ # Flyway SQL migrations (PostgreSQL 17)
│   ├── pom.xml
│   └── mvnw.cmd
├── frontend-react/             # React 19 + HeroUI + Tailwind + Dark Neon + Capacitor
│   ├── android/                # Native Android application project (Capacitor 8)
│   ├── capacitor.config.ts     # Capacitor configuration (appId: com.pedro.planilha)
│   ├── src/
│   │   ├── components/         # Reusable UI primitives (Controles, Tabela, Indicadores, Estrutura)
│   │   ├── features/           # Domain-driven feature modules:
│   │   │   ├── auth/           # Login, Signup, Session management
│   │   │   ├── dividas/        # Debt groups, installment tracking cards
│   │   │   ├── importacao/     # ExcelJS model generator & CSV import components
│   │   │   ├── lancamentos/    # Entries table, quick settlement, drawer editor
│   │   │   ├── matriz/         # Financial matrix grid, filters, month summaries, cell modal
│   │   │   ├── painel/         # Dashboard KPI cards, cashflow & category charts
│   │   │   ├── planejamento/   # Annual projections & risk calculations
│   │   │   ├── preferencias/   # Density, notifications, dark neon theme settings
│   │   │   └── recursos/       # Account, Category, Rule, and Wishlist management
│   │   ├── hooks/              # Custom React hooks (useFinanceiro, useSessao, useAlterarLancamento)
│   │   ├── pages/              # Thin page orchestrators (Planilha, Lancamentos, Painel, etc.)
│   │   ├── services/           # HTTP API client, date/currency formatting utilities
│   │   ├── types.ts            # Fully self-contained TypeScript domain types
│   │   ├── App.tsx             # Route definitions with lazy loading
│   │   └── styles.css          # Dark Neon CSS tokens and animations
│   ├── e2e/                    # Playwright end-to-end integration tests
│   ├── public/                 # Static assets, favicons, brand graphics
│   ├── package.json
│   └── vite.config.ts
├── infra/
│   └── docker-compose.lab.yml  # Local PostgreSQL 17 test environment
├── scripts/
│   └── java-react/ci-local.ps1 # Local continuous verification script
└── package.json                # Root workspace script runner
```

---

## Architectural Rules & Conventions

1. **Isolation**:
   - Backend queries and mutations strictly enforce tenant isolation through `HouseholdContext`.
   - Never bypass tenant boundaries.
2. **Frontend Componentization**:
   - Page components in `src/pages/` must remain thin orchestrators (under ~100 lines).
   - Domain logic and UI presentation belong to `src/features/<feature>/`.
   - UI primitives and layout belong to `src/components/`.
3. **Styling**:
   - Dark Neon is the default theme (`#07090e` obsidian background, glassmorphism, glowing accents `#00f59b`, `#00d2ff`, `#ff3366`, `#ffb800`).
   - Use CSS classes prefixed with `ff-` and Tailwind classes. Do not hardcode arbitrary ad-hoc inline colors.
