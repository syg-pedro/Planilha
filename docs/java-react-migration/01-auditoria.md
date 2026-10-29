# Auditoria do Planilha

Data: 28/10/2026. Base: `origin/main`, commit `c0eb7655560ae8dd0a303fe35b5f20e5bfb3b5a0`.
Branch do laboratório: `feat/react-springboot`.

## Limites e método

Auditoria estática dos arquivos versionados, com agentes separados para domínio e persistência/API. Nenhuma API financeira, instância Supabase ou seed de produção foi consultada. `dados.txt`, `shared/defaultDadosText.ts`, arquivos `.env` e o conteúdo dos seeds não foram usados para construir o laboratório.

O checkout original `C:/dev/Planilha` estava na branch `feat/revogrid-planilha`, com alterações em `FinanceEntryGrid.vue`, `MatrizScreen.vue`, `package.json` e `package-lock.json`. Foi preservado. O trabalho ocorre no worktree `C:/Users/PedroVictordeOliveir/.codex/worktrees/planilha-java-react/Planilha`, criado da main remota atualizada.

## 1. Arquitetura atual

`app/pages/index.vue:4` redireciona para `/planilha`. A rota dinâmica `app/pages/[screen].vue` delega para `FinanceScreenHost`, que carrega módulos sob demanda e mantém telas em `KeepAlive`.

O domínio visual e a store Pinia ficam em `app/features/finance`. A store `app/features/finance/stores/useFinanceStore.ts:51` concentra dados, bootstrap, filtros e a maior parte do HTTP. Componentes base e tokens ficam em `app/components/base` e `app/design-system`. Há reexports de compatibilidade em `app/stores` e `app/composables`.

`shared/types.ts`, `shared/finance.ts`, `shared/money.ts`, `shared/date.ts`, `shared/matrix.ts`, `shared/financeQuery.ts` e `shared/rules.ts` são contratos e funções sem dependência de Vue. O ESLint impõe fronteiras entre feature, base, design system, shared e server.

Nitro oferece rotas pequenas que autenticam e delegam ao `server/utils/repo.ts`. A interface `FinanceRepository` (`repo.ts:30`) tem implementações em memória e Supabase. `getRepository(householdId)` seleciona Supabase quando URL e service key existem (`repo.ts:1184`). A implementação em memória lê arquivos de seed e possui fallback embarcado: não deve servir de fixture do laboratório.

## 2. Stack identificada

Versões declaradas no `package.json` da main auditada; o lockfile determina as resolvidas.

| Área | Implementação encontrada |
| --- | --- |
| Web | Nuxt ^4.4.4, Vue ^3.5.33, TypeScript ^6.0.3, Pinia ^3.0.4 |
| UI | Nuxt UI ^4.12.0, Tailwind ^4.3.3, componentes e tokens próprios |
| Visualizações | AG Grid, FullCalendar, ECharts, TanStack Charts |
| API | Nitro, H3, Zod ^4.4.3 |
| Persistência/autenticação | Supabase JS ^2.105.3, Supabase SSR ^0.10.2, PostgreSQL |
| Arquivos/mobile | ExcelJS, Capacitor 7, notificações, armazenamento seguro, compartilhamento |
| Qualidade | Vitest ^4.1.5, Playwright ^1.61.1, ESLint, Storybook |
| Hospedagem | Vercel para Nuxt/Nitro; domínio legado com proxy separado em `deployment/legacy-mobile` |

O checkout original em outra branch possui dependências diferentes. Suas versões não foram usadas nesta análise.

## 3. Funcionalidades existentes

| Módulo | Evidência e comportamento |
| --- | --- |
| Lançamentos | `MatrizScreen.vue`, `FinanceEntryEditorModal.vue`: matriz/lista, criação, edição, exclusão, pagar/desfazer, repetição mensal e filtros |
| Dashboard | `DashboardScreen.vue`, `shared/finance.ts`: receitas, despesas, sobra prevista, categorias, cartões e ciclos quinzenais |
| Contas/cartões | `AccountEditorSheet.vue`, `CartoesScreen.vue`, `shared/types.ts:51`: banco, cartão, benefício e conta externa |
| Dívidas/parcelas | `DividasScreen.vue:82`: agrupamento de lançamentos cadastrados por conta e regra/título, com parcelas e pendências |
| Assinaturas | `AssinaturasScreen.vue`: regras recorrentes e reconstrução explícita dos lançamentos |
| Planejamento/relatórios | `auxiliaryFinancialViews.ts`, telas correspondentes: projeção anual e análise do período |
| Desejos | `ListaDeDesejosScreen.vue`, endpoints de wishlist |
| Importação | CSV e onboarding com Excel, prévia, validação e confirmação |
| Família | Login/cadastro Supabase e convites de compartilhamento |
| Mobile | Capacitor Android, notificações, widget e verificação de atualização |

Não foi encontrada implementação funcional de transferências entre contas ou conciliação de saldo bancário. A própria UI explica que sobra prevista não é saldo bancário. Tabelas `patrimony` e `goals` existem nas migrations, mas não foram encontrados contratos/API/fluxos ativos correspondentes.

## 4. Mapa das APIs

| Método | Rota | Contrato principal |
| --- | --- | --- |
| GET | `/api/bootstrap` | `{settings, accounts, categories, rules, entries, kpis, warnings}` |
| POST | `/api/accounts/batch` | `{upserts,deletes}` → `{accounts}` |
| POST | `/api/entries/batch` | `{upserts,deletes}` → `{entries}` |
| POST | `/api/entries/reseed` | Recria dados da família a partir do seed legado; destrutivo, fora do laboratório |
| POST | `/api/rules/batch` | `{upserts,deletes}` → `{rules}` |
| POST | `/api/rules/rebuild` | Reconstrói recorrências → `{generated}` |
| GET | `/api/wishlist` | `{items}` |
| POST | `/api/wishlist/batch` | `{upserts,deletes}` → `{items}` |
| POST | `/api/settings/theme` | Tema, densidade, tokens → `{settings}` |
| POST | `/api/settings/dashboard` | Período, notificações e dashboard → `{settings}` |
| POST | `/api/import/csv` | `{csvText,accountId?}` → `{inserted,warnings}` |
| POST | `/api/onboarding/state` | Estado/versionamento das etapas → `{settings}` |
| POST | `/api/onboarding/import/preview` | Payload validado → contagens, avisos e `canImport` |
| POST | `/api/onboarding/import` | Payload validado → `{summary}` |
| GET | `/api/me/household` | Família, membros e convites |
| POST | `/api/invitations/create` | E-mail e role → token e validade |
| POST | `/api/invitations/accept` | Token → família; sessão por cookie validada diretamente |
| GET | `/api/web-version` | Público, versão web |
| GET | `/api/android-release` | Público, consulta release GitHub com cache de 300 segundos |

Fontes: arquivos homônimos de `server/api`. Os batches devolvem a coleção inteira após salvar. Não há hoje CRUD REST individual por ID para contas ou lançamentos. Wishlist e budgets não fazem parte do bootstrap.

## 5. Modelo de dados e segurança

| Tabela | Chaves, relacionamentos e finalidade |
| --- | --- |
| `household_settings` | PK text `id`; moeda, fuso, tema, horizonte, notificações, dashboard e onboarding |
| `accounts` | PK text; household CASCADE; tipo, proprietário, limite, fechamento/vencimento, ativa |
| `categories` | PK text; household CASCADE; nome, tipo e cor |
| `rules` | PK text; household CASCADE; conta/categoria SET NULL; valor numeric, frequência e datas |
| `entries` | PK text; household CASCADE; regra/conta/categoria SET NULL; numeric, vencimento/competência date, status, parcelas e exclusão de cálculo |
| `budgets`, `imports_csv` | Orçamento por categoria e histórico de importação; household CASCADE |
| `household_members` | PK `user_id uuid` → auth.users; household CASCADE; role |
| `household_invitations` | PK text; household CASCADE; token UNIQUE, e-mail, role, expiração e aceite |
| `wish_items` | PK text; household CASCADE; preço numeric, prioridade, status, URLs e notas |
| `patrimony`, `goals` | Estruturas sem fluxo funcional identificado |

Fontes: `supabase/migrations/0001_init.sql`, `0002_auth_households.sql`, `0002_patrimony_goals.sql`, `0003_rls_households.sql`, `0004_entry_exclude_from_calc.sql`, `0004_onboarding_import.sql`, `0005_wish_items.sql`, `0007_notification_time.sql`.

Há índices de lançamento por vencimento, família, conta e categoria; membros por família; convites por e-mail/token; desejos/patrimônio/metas por família. Não há índice composto família+vencimento nas migrations auditadas. Predominam NOT NULL e FKs. Enums TypeScript, escala monetária e limites de dias/parcelas não estão em geral protegidos por CHECK no banco.

RLS é declarado para settings, accounts, categories, rules, entries, budgets, imports, membros, convites e desejos. A função `get_user_household_id()` é security definer com search_path fixado. Não foi encontrada habilitação de RLS para `patrimony`/`goals`. Isso descreve arquivos versionados, não comprova o estado efetivo do Supabase.

### Autenticação e autorização reais

`app/composables/useAuth.ts:28` implementa login/cadastro e sessão Supabase. `server/utils/auth.ts:14` valida Bearer ou cookie SSR com `auth.getUser`, resolve `household_members` e devolve o household. Sem Supabase, apenas o modo local em memória aceita edit key. Falha de sessão com Supabase configurado não libera fallback demo.

O middleware de página é cliente; a proteção efetiva dos dados fica nas APIs. Um usuário pertence a uma família por vez, pois `household_members.user_id` é PK. Aceitar convite substitui o vínculo. As roles owner/member são armazenadas, mas o helper devolve somente household; criação de convite não exige owner no código auditado.

`repo.ts:784` cria cliente service-role, que ignora RLS. Portanto a autorização deve ser aplicada pelo servidor em cada leitura e escrita.

## 6. Regras financeiras críticas

| Regra | Semântica a preservar ou decidir explicitamente |
| --- | --- |
| Dinheiro | `shared/money.ts:2` arredonda cada valor em centavos antes da soma. Java usará BigDecimal, escala/política definidas em testes de equivalência |
| Exclusões | `shared/finance.ts:40` exclui `excludeFromCalc` e contas benefit dos totais, mantendo registros visíveis |
| Totais | Income/expense incluem registros elegíveis de qualquer status; net=income-expense. Pendência inclui review e dá sinal positivo para despesa, negativo para receita |
| Datas | Vencimento e competência independentes; mudança de período altera agrupamento, não o registro |
| Fim de mês | `shared/date.ts:9` limita dia ao último do mês; repetição preserva separadamente vencimento e competência |
| Parcelamento/repetição | Cada registro contém valor da parcela. Repetição manual aceita 1–120 ocorrências; primeira mantém status, demais pending. Não divide automaticamente o valor informado |
| Recorrência | `shared/rules.ts:12` exige autoGenerate, monthly e dueDay; gera origem auto/status pending no horizonte do mês UTC atual |
| Cartões | Matriz agrega sem substituir lançamentos. Comprometimento inclui despesas não pagas de todo horizonte; KPI do conjunto recebido tem semântica diferente |
| Filtros | Tipo, status, conta, período e busca; matriz/lista usam o mesmo conjunto. Pendências precedem quitados |
| Projeções | Média dos meses com registros; distinguir zero cadastrado de mês vazio. Relatórios limitados ao mês atual |
| Quinzenas | Fuso da família, dias 1–15 e 16–fim do mês; despesas elegíveis não pagas do mês atual |

Particularidades conhecidas: o gerador não consulta startsAt/endsAt apesar de existirem no tipo; upcoming7Days compara meia-noite UTC do vencimento com o horário corrente; alguns cálculos usam mês UTC e outros o fuso familiar. O Java precisará de Clock injetável e testes de fronteira. Essas diferenças devem ser discutidas, não alteradas silenciosamente.

## 7. Dependências externas e implantação

Supabase fornece banco, Auth e Storage de releases Android. GitHub Releases é consultado pelo endpoint Android. Vercel hospeda Nuxt/Nitro; configurações legadas apontam para o domínio atual. Capacitor depende de configuração de URL da API. Há PWA/service worker e armazenamento offline no navegador.

A consulta somente leitura à Vercel identificou projeto `planilha` com framework nuxtjs e deployment de produção `dpl_5Acnm7V3U3GkdNEQYXD78Qu79MNm`, READY, origem CLI, ref main, SHA c0eb765. Nenhuma configuração foi alterada.

O conector não expôs Production Branch nem configuração completa de integração Git. O deployment atual de main não prova o comportamento de um push futuro. Esta entrega não faz commit, push, merge ou deploy: arquivos e branch locais não disparam deploy remoto. A confirmação da configuração Git é um bloqueio antes de qualquer push experimental futuro.

## 8. Riscos e divergências

| Risco existente | Evidência e consequência para o laboratório |
| --- | --- |
| Ownership em batch | `repo.ts:829,1092,1123,1156`: deletes service-role filtram apenas IDs. Upserts por PK global também não verificam dono prévio. Não reproduzir contra produção; exigir autorização por registro no Java |
| Integridade familiar | FKs de conta/categoria/regra não asseguram mesmo household. Roles não têm verificação completa no helper |
| Validação e atomicidade | Batches aceitam objetos passthrough; delete/upsert/rebuild são chamadas separadas. Onboarding usa RPC transacional, mas demais fluxos não têm transação única |
| Persistência divergente | Memória faz merge de patch; Supabase reconstrói campos com defaults. Definir contrato de atualização antes dos DTOs Java |
| Migrations legadas | Prefixos 0002 e 0004 duplicados; há dados específicos em migration antiga. Nunca copiar automaticamente para Flyway |
| Fila offline | `finance-offline-queue` persiste dados e envia FIFO. Reutilizar perfil/origem do navegador pode reenviar registros reais ao laboratório |
| Seeds e operações destrutivas | Memória e reseed usam conteúdo legado. Não chamar reseed, não reutilizar seeds |
| Documentação desatualizada | AGENTS/CLAUDE dizem sem login e geração no bootstrap; código tem Auth e rebuild explícito |
| Exceções à arquitetura | Settings e changelog fazem algumas chamadas HTTP no componente. Registrar antes de integrar, sem refatorar agora |

## 9. Prioridades Java e testes de referência

Primeira entrega: processo independente, PostgreSQL local, configuração segura, Flyway técnico, health e testes. A Fase 1 funcional começa depois, com contas, seguida de lançamentos e seus vínculos. Categorias e contexto familiar exigem contrato explícito antes de integrar a UI.

| Referência | Cobertura atual útil ao Java |
| --- | --- |
| `tests/finance.test.ts` | 4 casos: totais, cartões, quinzenas e próximos vencimentos |
| `tests/matrix.test.ts` | 8: meses, grupos, faturas, status, exclusões, competência, centavos |
| `tests/financeQuery.test.ts` | 5: ordenação, filtros e equivalência matriz/lista |
| `tests/auxiliaryFinancialViews.test.ts` | 4: fuso, fevereiro, acumulados, projeção e exclusões |
| `tests/rules.test.ts` | 1: seis recorrências mensais; faltam vários casos de borda |
| `tests/onboarding.test.ts` | 3: payload, referências inválidas e conversão Excel |

Contagem estática: 45 casos em 11 arquivos. Parser (5 casos) importa o seed embarcado existente e foi excluído desta execução por precaução com dados pessoais. Os outros 40 casos em 10 arquivos usam helpers puros e fixtures próprias. Não há cobertura unitária identificada de autorização multi-household e persistência das APIs. Os E2E fazem bootstrap e foram reservados para ambiente com fixtures explicitamente fictícias.

Resultados executados e limitações estão em [evidencias.md](evidencias.md).

## 10. Estratégia de integração recomendada

Nesta entrega Java não consome nem substitui Nitro. Usa banco próprio e novo histórico Flyway, sem configuração Supabase ou dependência do Nuxt.

Na Fase 2, adotar adaptador seletivo exclusivo de desenvolvimento para os contratos atuais de bootstrap/batch. `NUXT_PUBLIC_API_BASE_URL` troca todas as chamadas da store e não pode apontar diretamente para um Java que só implemente dois recursos. Existe `NUXT_DEV_API_PROXY_TARGET` em `nuxt.config.ts:28,56`, mas também encaminha todo `/api` e, sozinho, não isola dados, autenticação ou fila.

Usar instância Nuxt separada, fixtures fictícias, namespace de fila e perfil de navegador exclusivos; manter componentes usando ações da store. O modo original precisa continuar como padrão e testes devem provar que configurações experimentais não ativam em produção. Não implementar esse adaptador nesta primeira entrega.

React permanece na Fase 3, depois de consolidar o backend, contratos e pelo menos uma integração local do Nuxt.
