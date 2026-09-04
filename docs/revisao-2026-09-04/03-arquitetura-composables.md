# Redução de arquivos e boas práticas de composables

> Diagnóstico original, anterior às correções. Consulte [o estado implementado e a validação final](06-correcoes-aplicadas.md). Referências de linha deste diagnóstico correspondem à base `19b1c17`.

## Atualização implementada — separação por responsabilidade

| Arquivo | Base | Atual |
|---|---:|---:|
| `MatrizScreen.vue` | 1897 | 834 |
| `FinanceEntryEditorModal.vue` | 723 | 272 |
| `FinanceSettingsPanel.vue` | 1451 | 519 |
| `default.vue` | 764 | 718 |
| `useFinanceStore.ts` | 577 | 505 |

Contagem física em [arquivos-etapas234.json](evidencias/arquivos-etapas234.json), comparada à base `19b1c17`. Inclui correções anteriores da mesma branch. A redução resulta de extração de responsabilidades e estilos, não de redução equivalente do bundle.

- `useEntryDraft`: rascunho, validação, recorrência e IDs estáveis. Recebe getters do contexto, preserva edição durante atualização do mesmo registro e reinicializa ao reabrir o formulário.
- `useMatrixEditing`: estado da célula, validação e tentativa de salvar; recebe a ação de persistência, mantém valor após erro e impede gravação ambígua em célula agregada.
- `useMatrixColumnOrder`: preferência de ordem por família, com tolerância a falha de storage. Não transporta dados financeiros.
- `MatrixMonthCard` e `FinanceTopbar`: apresentação por props e eventos; não chamam APIs. Estilos do editor ficam em `styles/entry-editor.css`.
- Extrações anteriores continuam válidas: navegação mensal, modelo da matriz, fila offline, tema e configuração da família. O store centraliza transporte e sincronização.

**Contrato adotado:** composables retornam estado reativo e ações; dependências externas são explícitas; efeitos têm escopo e limpeza; funções puras de dinheiro e data continuam em `shared`. Orientação: [Vue — Composables](https://vuejs.org/guide/reusability/composables.html).

**Ainda pendente:** separar tabela desktop e diálogos da Matriz; sidebar/drawer do layout; adapters de persistência do repositório; formulários de Assinaturas e Lista de Desejos. As metas originais abaixo são orientativas e ainda não foram todas atingidas. Priorizar extrações com responsabilidade própria, evitando fragmentar template apenas para atingir uma contagem de linhas.


## Inventário real

Contagem de linhas físicas, incluindo vazias, via `ReadAllLines` em 04/09/2026. Inventário completo em [JSON](evidencias/inventario.json). Linhas de CSS/template também contam; arquivo grande não implica automaticamente execução lenta. As metas abaixo são intervalos orientativos para revisão humana, não gates mecânicos de lint.

| Arquivo | Linhas | Responsabilidades a separar | Meta do orquestrador |
|---|---:|---|---:|
| `app/features/finance/components/screens/MatrizScreen.vue` | 1897 | Matriz desktop, cards mobile, lista, edição de célula, ordenação, cinco grupos de diálogo e estilos | 200–350 |
| `app/features/finance/components/FinanceSettingsPanel.vue` | 1451 | Temas, importação, família, notificações e manutenção | 150–250 |
| `server/utils/repo.ts` | 1188 | Contrato, adapter memória, adapter Supabase, mappers, seed e importação | 60–120 para factory/contrato |
| `app/features/finance/components/screens/ListaDeDesejosScreen.vue` | 808 | Transporte, filtro, formulário, cards e imagens | 150–250 |
| `app/layouts/default.vue` | 764 | Sidebar, topbar, drawer, bottom navigation, ajuda e breakpoint | 150–250 |
| `app/features/finance/components/FinanceEntryEditorModal.vue` | 723 | Overlay, draft, validação, recorrência e campos | 150–250 |
| `app/features/finance/components/screens/AssinaturasScreen.vue` | 647 | Seletores, formulário e confirmação | 200–300 |
| `app/features/finance/components/screens/RelatoriosScreen.vue` | 621 | Períodos, agregação, KPIs, gráfico/tabela e CSS | 200–300 |
| `app/features/finance/components/screens/CartoesScreen.vue` | 603 | Resumo, cards, ações e editor | 200–300 |
| `app/features/finance/components/screens/DividasScreen.vue` | 579 | Agrupamento, expansão e ações de parcela | 200–300 |
| `app/features/finance/stores/useFinanceStore.ts` | 577 | Estado, transporte, tema, offline, notificações e widget | 200–300 |
| `shared/parser.ts` | 515 | Reconhecimento de seções, valores, datas e geração | Separar por gramática, preservando testes |
| `app/app.vue` | 497 | Bootstrap/auth, atualizações web/APK, notificações e shell | 100–180 |

Na Matriz, o template vai até a linha 571 e os estilos começam em 1060. Em Settings, estilos começam em 628. Portanto, extrair apenas funções para um composable gigante não resolve a concentração: é necessário separar também unidades de interface e seus estilos.

## Arquitetura proposta

Fluxo: **página/rota → componente de feature → composable de interação → ações do store → transporte → API → serviço de domínio → repositório**. Cálculos puros ficam em `shared`; efeitos de plataforma ficam em adapters/plugins; o store mantém a fonte de verdade compartilhada.

| Unidade proposta | Responsabilidade e contrato | Não deve conter |
|---|---|---|
| `shared/finance/period.ts` | `resolvePeriod(input, now, timezone)` retorna início e fim exclusivo | Vue, navegador, fetch |
| `shared/finance/money.ts` | parse/format de entrada monetária com resultado válido/erro | Estado de formulário |
| `shared/finance/selectors.ts` | Escopo de benefícios/exclusões e agregações consistentes | Estado global mutável |
| `useFinancePeriod` | Ref/getter de período, computeds e navegação entre meses | Nova cópia de entries |
| `useMatrixModel` | Dados derivados da matriz e mapas por IDs estáveis | POST, DOM e estilos |
| `useMatrixEditing` | Draft, pending, error, salvar/cancelar via ação injetada | Regra escondida de excluir agregados |
| `useMatrixColumnOrder` | Preferência de ordenação versionada e isolada por contexto | Dados financeiros persistidos sem necessidade |
| `useEntryDraft` | Inicialização, dirty, erros e conversão para create/patch | Comunicação HTTP |
| `useOnboardingImport` | Estado leitura/prévia/confirmação, erros e retry | Parser de workbook misturado à UI |
| `useFinanceTheme` | Tema efetivo e ciclo de vida do media query | Gravação remota implícita ao mudar computed |
| Serviço de fila offline | Persistência por usuário/família, ACK, lock e retry | Dependência de componente montado |
| Adapter de notificações/widget | Capacidades web/nativo, permissões e dispose | Cálculo financeiro duplicado |
| `useDialogFocus` ou primitive equivalente | Foco, Escape, inert e restauração | Store de finanças |

Nomes propostos, ainda não criados. Não extrair uma função apenas para adicionar prefixo `use`: parser, agregação e regras sem estado pertencem a utilitários puros. Um composable organiza lógica reativa com responsabilidade definida. [Convenções oficiais do Vue](https://vuejs.org/guide/reusability/composables.html).

## Regras de implementação

1. Receber entradas reativas como ref/getter quando necessário; resolver dentro de computed/watch, evitando snapshots não reativos.
2. Retornar refs/computeds e ações explícitas; evitar retornar objeto reactive que perde reatividade ao desestruturar. Ao consumir estado Pinia desestruturado, usar storeToRefs.
3. Inicializar efeitos de navegador no cliente e limpar listeners/timers/subscriptions ao encerrar o escopo. Serviços com vida de app são inicializados por plugin com dispose próprio, não repetidamente por componente.
4. Expor pending/error/result; impedir submissões simultâneas; rejeitar resposta antiga após troca de usuário ou filtro. Watch assíncrono deve cancelar ou invalidar trabalho anterior.
5. Evitar import circular entre stores. Passar ações/capacidades tipadas ao composable quando reduz acoplamento; não duplicar arrays do store para simular cache.
6. Validar o contrato tanto na borda HTTP como na conversão do formulário. Distinguir campo ausente de limpeza explícita. Não usar any para esconder divergência de adapter.
7. Preservar `#shared/` no app e os limites do ESLint. Features só importam da própria feature, base, design-system e shared.
8. Não colocar auth/HTTP em `base`. O projeto precisa de uma decisão explícita para classificar infraestrutura de app no ESLint; hoje `app/utils` não está tipado como elemento e dependências via autoimport podem escapar à intenção das regras. Não resolver isso desativando boundaries.

## Decomposição de componentes

- Matriz: `MatrixToolbar`, `MatrixDesktopTable`, `MatrixMonthCard`, `MatrixCellEditor` e diálogos coesos. Manter totais/seletores únicos entre desktop e mobile.
- Settings: `AppearanceSettings`, `HouseholdSettings`, `ImportSettings`, `NotificationSettings`, `MaintenanceSettings`. Estado transitório pertence à seção; dados remotos permanecem no store.
- Layout: `AppSidebar`, `AppTopbar`, `AppMobileNavigation`, `AppDrawer`, `ScreenHelp`. Uma lista tipada de destinos alimenta todas as navegações.
- Editor: `EntryIdentityFields`, `EntryDateFields`, `EntryRecurrenceFields` somente se os blocos tiverem comportamento próprio; não criar um arquivo por label.
- Repositório: `server/repositories/types.ts`, `memory.ts`, `supabase.ts`, `mappers.ts`; serviços de importação/rebuild separados. Factory continua acessível por `getRepository` para preservar consumidores.

## Sequência segura

Primeiro caracterizar os bugs TEC-01/02/03/09/14; depois corrigir contratos e extrair domínio compartilhado. Só então dividir componentes. Cada PR deve manter comportamento, ou declarar claramente a correção funcional feita junto. Medir mudanças de bundle após separar carregamento de telas: quebrar arquivos sem imports assíncronos não garante menos JS inicial.

Testes de maior valor: paridade memória/Supabase para patches; limites de período e timezone; reatividade do período; draft preservado em erro; fila com falha parcial/troca de conta; diálogo por teclado. Não criar testes que apenas repetem a implementação ou assertam que o arquivo ficou menor.
