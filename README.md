# Planilha — Gestão Financeira Familiar

Aplicativo web de finanças pessoais e familiares construído com Nuxt 3 + Vue 3. Funciona completamente offline (in-memory) ou conectado ao Supabase para persistência multi-tenant com isolamento por household.

---

## Funcionalidades

| Grupo | Tela | Descrição |
| --- | --- | --- |
| Visão Geral | Dashboard | KPIs mensais, saldo líquido, resumo de receitas e despesas |
| | Relatórios | Gráficos e análises de gastos por período e categoria |
| | Planejamento Anual | Visão anual de orçamentos e projeções |
| Finanças | Planilha | Grid de lançamentos com filtros, edição inline e importação CSV |
| Controle | Assinaturas | Gerenciamento de planos recorrentes com valor e vencimento |
| | Cartões e Contas | Visão de limites, uso e edição de contas bancárias e cartões |
| | Lista de Desejos | Itens desejados com prioridade, status, valor e link |
| Compromissos | Dívidas e Parcelas | Controle de parcelas com ações de pagamento e edição |
| Análise | Alertas Inteligentes | Notificações de vencimentos próximos e limites excedidos |

---

## Stack

- **Framework:** Nuxt 3 + Vue 3 + TypeScript
- **State:** Pinia
- **UI:** Tailwind CSS + design system próprio com CSS variables (`--ds-*`)
- **Tabelas:** AG Grid Community
- **Gráficos:** Apache ECharts (vue-echarts)
- **Backend:** Nitro (Nuxt server) + Supabase PostgreSQL (opcional)
- **Testes:** Vitest + Storybook
- **Validação:** Zod
- **PWA:** @vite-pwa/nuxt

---

## Início Rápido

```bash
# 1. Clone e instale
git clone https://github.com/syg-pedro/Planilha.git
cd Planilha
npm install

# 2. Configure variáveis (opcional — sem elas roda in-memory)
cp .env.example .env

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000/?key=demo-finance-key`

> Sem Supabase configurado, o app roda inteiramente em memória com dados de exemplo gerados a partir de `dados.txt`.

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `EDIT_KEY` | `demo-finance-key` | Chave de autenticação (modo local/demo) |
| `SUPABASE_URL` | — | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | — | Service role key (server-side) |
| `NUXT_PUBLIC_SUPABASE_URL` | — | URL pública para o cliente browser |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | — | Anon key com RLS ativo |
| `DATA_FILE_PATH` | `./dados.txt` | Caminho customizado para arquivo de seed |

---

## Comandos

```bash
npm run dev          # Servidor de desenvolvimento (porta 3000)
npm run build        # Build de produção
npm run preview      # Preview do build de produção
npm run typecheck    # Verificação de tipos Vue + TypeScript
npm run test         # Testes unitários (Vitest)
npm run test:watch   # Testes em modo watch
npm run lint         # ESLint
npm run lint:fix     # ESLint com correção automática
npm run storybook    # Storybook em localhost:6006
```

---

## Banco de Dados (Supabase)

Execute as migrações em ordem no SQL Editor do Supabase:

| Migração | Descrição |
| --- | --- |
| `0001_init.sql` | Schema base: household_settings, accounts, categories, rules, entries |
| `0002_auth_households.sql` | Tabela household_members (vínculo auth.users ↔ household) |
| `0003_rls_households.sql` | Políticas RLS com `get_user_household_id()` |
| `0004_entry_exclude_from_calc.sql` | Coluna `exclude_from_calc` para lançamentos de benefícios (VR, VA) |
| `0005_wish_items.sql` | Tabela wish_items (lista de desejos) |

---

## Arquitetura

```text
app/
├── components/base/          # Primitivos reutilizáveis (BaseButton, BasePanel…)
├── design-system/styles/     # CSS variables do design system
├── features/finance/         # Feature de finanças
│   ├── components/screens/   # Telas da aplicação
│   ├── stores/               # useFinanceStore (Pinia)
│   └── constants/            # Navegação e constantes de UI
├── layouts/default.vue       # Sidebar + topbar + bottom nav mobile
└── pages/index.vue           # Roteamento de telas

server/
├── api/                      # Endpoints Nitro
└── utils/repo.ts             # Abstração de persistência (Supabase | in-memory)

shared/                       # Lógica pura sem dependência de Vue/Nuxt
├── types.ts                  # Interfaces TypeScript
├── parser.ts                 # Parser do dados.txt
└── rules.ts                  # Geração de lançamentos a partir de regras

supabase/migrations/          # Schemas PostgreSQL versionados
```

**Regra de imports:** `eslint-plugin-boundaries` garante separação estrita entre camadas — features só importam de `base`, `design-system`, `shared` e da própria feature. Violations são erros de build.

---

## Autenticação e Multi-Tenant

**Modo demo (sem Supabase):** a query param `?key=` é validada contra `EDIT_KEY`. Todos os dados pertencem a um único household em memória.

**Modo produção (com Supabase):** a sessão do usuário é lida via cookie SSR, o servidor localiza o `household_id` na tabela `household_members` e todas as queries são filtradas automaticamente. Row Level Security no banco garante isolamento entre households.

**Convite:** novos membros podem ser adicionados a um household existente via link de convite.

---

## Deploy (Vercel)

```bash
npx vercel deploy --prod --yes
```

Configure as variáveis de ambiente na dashboard da Vercel:
`EDIT_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Android: distribuição e atualizações

O APK de produção é publicado nos [GitHub Releases](https://github.com/syg-pedro/Planilha/releases). Ele é assinado com uma chave privada, mantida fora do repositório, portanto novas versões devem usar a mesma chave para que o Android permita a atualização por cima da instalação existente.

### Instalação

[**Baixar o Financeiro Familiar para Android (APK v1.0.0)**](https://github.com/syg-pedro/Planilha/releases/download/v1.0.0/Financeiro-Familiar-v1.0.0.apk)

1. Abra o link acima no celular Android e baixe o arquivo.
2. Abra o APK baixado e permita a instalação pela fonte usada (Chrome, WhatsApp ou Arquivos), caso o Android solicite.
3. Abra o Financeiro Familiar, permita as notificações e entre ou crie sua conta.

### Como funcionam as atualizações

- **Melhorias normais:** cada commit na `main` publica automaticamente uma atualização OTA. Basta deixar o aplicativo em segundo plano e abri-lo novamente para receber as melhorias; não é necessário baixar outro APK.
- **Atualizações nativas:** permissões, ícone, plugins Capacitor ou qualquer alteração Android exigem um novo APK. Quando isso acontecer, ele será publicado nos [GitHub Releases](https://github.com/syg-pedro/Planilha/releases) e pode ser instalado por cima da versão anterior.

- Mudanças de interface e código web: todo commit na `main` publica automaticamente um pacote OTA no canal `production` do Capgo. O aplicativo instala o pacote na próxima transição para segundo plano e retorno.
- Mudanças nativas (permissões, plugins Capacitor, ícone ou configuração Android): execute o workflow **Publicar APK Android** em Actions, aumentando `version` e `version_code`. O workflow anexa o APK assinado a um GitHub Release.
- Segredos exigidos em GitHub Actions: `CAPGO_TOKEN`, `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`.
- Variáveis de Actions: `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_SUPABASE_URL` e `NUXT_PUBLIC_SUPABASE_ANON_KEY`.
