# Laboratório Java + React

Atualizado em 29/10/2026. Branch: `feat/react-springboot`. Base: main `c0eb765`.

## Status da migração

A migração em código das frentes do laboratório foi consolidada: backend Spring Boot completo (V1–V6), matriz de relatórios com isolamento transacional, frontend React 19 + HeroUI com 13 páginas e rotas ativas, importação XLSX/CSV, notificações web e tema customizado, além de CI local independente e avaliação futura de hospedagem.

## Fase 0 — auditoria e isolamento
- [x] Conferir Git e preservar os quatro arquivos modificados no checkout original.
- [x] Atualizar referência main e criar branch pedida em worktree próprio.
- [x] Ler AGENTS/CLAUDE e comparar com implementação real.
- [x] Auditar domínio, APIs, banco versionado, autenticação, testes e dependências.
- [x] Criar `01-auditoria.md`, este roadmap e guia inicial de aprendizado.
- [x] Consultar deployment Vercel somente leitura: produção READY/main/c0eb765, origem CLI.
- [x] Confirmar configuração completa de isolamento e zero alteração na produção.

## Fase 1A — fundação local
- [x] Preparar `backend-java` com Java 21 e Maven Wrapper.
- [x] Configurar Spring Web, Data JPA, Validation, driver PostgreSQL, Flyway e OpenAPI.
- [x] Criar `infra/dev/compose.yaml`, projeto/volume próprios e porta 55432 em loopback.
- [x] Impedir inicialização fora dos perfis locais e impedir URLs de banco externas.
- [x] Configurar Hibernate validate, Flyway V1 e health UP.

## Fase 1B — contas
- [x] Definir e aprovar DTOs, tipos de conta, dias de fechamento/vencimento e limites monetários.
- [x] Modelar contas em V2, com ID gerado pelo servidor e contexto local-demo explícito.
- [x] Implementar repository/service/controller com CRUD, validação JSON estrita e exceções centralizadas.
- [x] Testar CRUD real em PostgreSQL com 66 unitários e 58 integrações aprovados.

## Fase 1C — lançamentos e módulos financeiros
- [x] Modelar categorias, lançamentos, regras e desejos em migrations V3, V4 e V5.
- [x] Implementar CRUD transacional, filtros, relatórios, dívidas e planejamento.
- [x] Implementar matriz de lançamentos mensal (`MatrizService`, `MatrizController`, `CalculosMatriz`).
- [x] Aplicar `Isolation.REPEATABLE_READ` para snapshot consistente entre consultas de relatórios e matriz.
- [x] Importação CSV e Onboarding XLSX com prévia e rollback transacional.
- [x] 291 testes no `mvnw verify` executados com 0 falhas, 0 erros e 0 skips.

## Fase 2 — Nuxt experimental consumindo Java
- [x] Definir adaptador seletivo de bootstrap/batch e proxy dev em `scripts/java-react/nuxt-lab.mjs`.
- [x] Criar estado/fila/browser isolados do Nuxt original (`NUXT_JAVA_LAB=1`).
- [x] Garantir bloqueio de ativação fora do ambiente de desenvolvimento.
- [x] Documentar em [05-nuxt-java-local.md](05-nuxt-java-local.md).

## Fase 3 — React com HeroUI
- [x] Criar Vite/React 19/TypeScript isolados em `frontend-react/`.
- [x] Implementar design system e componentes HeroUI 3.x com Tailwind CSS 4.
- [x] Montar roteador completo em `App.tsx`:
  - `Painel` (Dashboard com KPIs, gráficos, cartões, mapa de gastos)
  - `Lancamentos` (Lista paginada, filtros, formulário de criação/edição com parcelas e repetição)
  - `Planilha` (Matriz financeira dinâmica mês a mês com edição/adição em células vazias)
  - `Recursos` (Contas e cartões, Categorias, Recorrências/Fixos, Lista de Desejos)
  - `Planejamento` (Planejamento anual e projeção de 12 meses)
  - `Dividas` (Agrupamento inteligente de parcelas e cartões)
  - `Relatorios` (Análise de categorias, evolução mensal e fluxo)
  - `Importacao` (Importação de modelo XLSX oficial via ExcelJS + extrato CSV com prévia)
  - `Familia` (Seleção familiar, lista de membros, criação/cópia de convites seguros)
  - `Configuracoes` (Preferências de tema, densidade, fuso, período, horizonte e notificações)
  - `Acesso` (Login e cadastro com criação automática de família)
- [x] Integrar tokens de tema customizado no CSS (`styles.css` e `Estrutura.tsx`).
- [x] Integrar agendamento web global de notificações de vencimento no `Estrutura.tsx`.
- [x] Atualizar vulnerabilidades informadas do npm: Zod 4.6.7 e Vitest 4.1.12.
- [x] Build de produção limpo em 1.36s gerando chunks otimizados com dynamic import do ExcelJS.

## Fase 4 — segurança e autorização profissional
- [x] Spring Security com JWT efêmero (15 min) em memória e refresh token opaco (7 dias) em cookie HttpOnly/SameSite=Strict.
- [x] Multi-tenancy por família com foreign keys compostas e verificação de membership por requisição.
- [x] Convites protegidos por token de uso único (sem envio externo de e-mail).
- [x] BCrypt 12, rate limit de tentativas e rotação/revogação de refresh tokens.
- [x] Testes de segurança e isolamento de acesso cruzado aprovados em `SegurancaIntegrationIT`.

## Fase 5 — operação local, CI e avaliação futura
- [x] Validar inicialização, parada e reinício via `scripts/java-react/lab.ps1` preservando volumes Docker.
- [x] Criar script de CI local independente: `scripts/java-react/ci-local.ps1`.
- [x] Elaborar avaliação completa de arquitetura, hospedagem futura, custos e mobilidade em [06-avaliacao-futura.md](06-avaliacao-futura.md).
- [x] Preservar rigorosamente a branch main, os dados de produção e o Supabase.
