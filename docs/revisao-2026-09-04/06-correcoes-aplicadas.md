# Correções aplicadas — 04/09/2026

> Atualização posterior: a migração foi aplicada no projeto remoto com autorização do usuário. Veja [07 — Migração remota e testes autenticados](07-migracao-remota.md). As referências abaixo a banco não alterado descrevem o encerramento da etapa local.

Branch `codex/revisao-completa-web-mobile`, base `19b1c17`. Alterações locais, sem commit, push, deploy ou alteração no Supabase remoto. Este documento atualiza o diagnóstico dos documentos 01–05; os números de linha daqueles documentos são históricos.

## Integridade e persistência

| Achado | Implementação | Evidência/limite |
|---|---|---|
| TEC-01, TEC-02, TEC-06 | RPC `save_finance_batch` limita tabelas, bloqueia IDs/referências de outra família, preserva campos omitidos e executa delete/upsert numa transação. Reconstrução e CSV usam o mesmo serviço. Reseed remoto foi desativado; permanece disponível na demonstração. | `server/utils/financeBatch.ts`, `server/utils/repo.ts`, migração `20260904142503_secure_finance_batches.sql`; testes PostgreSQL de rollback e patch. |
| TEC-03, TEC-04 | Fila versionada por usuário/família, IDs estáveis, envio serial, remoção somente após confirmação, invalidação de resposta após troca de sessão, retry/descarte explícitos. | `useOfflineQueue.ts`, store e `FinanceSyncStatus.vue`; testes de falha parcial, recarga e troca de família durante envio. |
| TEC-05 | Schemas Zod estritos para quatro lotes: datas reais, enums, números, comprimentos e limite de 1.000 itens. Sem casts `any` nas rotas de lote. | `shared/batchSchemas.ts`; banco verifica campos obrigatórios e referências. |
| TEC-07 | Usuário verificado por bearer/cookie, e-mail normalizado, somente owner pode conceder owner. Aceite e troca de família transacionais, token consumido uma vez. Inserção direta de convites por clientes foi revogada para exigir a verificação da API. | `sessionUser.ts`, APIs de convite e RPC; teste local de e-mail diferente e reutilização. Fluxo Supabase Auth real ainda requer homologação. |
| TEC-08 | Leitura por cursor de ID em páginas, inclusive no bootstrap, wishlist e reconstrução de regras. Continua até resposta vazia, sem assumir que o limite remoto seja 1.000. | `readHouseholdRows`; não houve teste de carga contra PostgREST remoto. Ainda se transfere o histórico completo ao cliente. |

A fila antiga sem identidade foi preservada e não é reenviada automaticamente. Dados locais corrompidos não são sobrescritos silenciosamente. Um erro de gravação mantém o editor aberto e as pendências visíveis. A fila é de lançamentos: contas, regras e wishlist continuam exigindo conexão. Não há suporte completo a abrir o app offline após reiniciá-lo, nem garantia de coordenação entre várias abas simultâneas.

## Cálculos e experiência web/mobile

- Relatórios usam intervalos com fim exclusivo e respeitam competência/vencimento. Planejamento, relatórios e dashboard usam o seletor que exclui benefícios e `excludeFromCalc` dos saldos (TEC-09/10).
- O KPI inclui vencimentos de hoje durante todo o dia da família. Filtros de conta/categoria não incluem itens sem vínculo. Entrada monetária aceita `1.234,56` e rejeita valores truncados ou inválidos (TEC-11/12/13).
- Células agregadas da Matriz não podem sobrescrever um lançamento e apagar os demais. O usuário é encaminhado à lista para editar os registros individuais (TEC-14).
- A Matriz mobile renderiza um único mês, inicia no atual e permite anterior/próximo/Hoje. Mês e tela são preservados na URL. O resumo superior corresponde ao mês selecionado; os totais financeiros excluem benefícios, com explicação visível. A matriz continua organizada por vencimento.
- Dashboard ganhou “Novo lançamento”, “Pagar” nos próximos vencimentos e alertas recolhíveis. Vencimentos aparecem antes do gráfico no celular; “A pagar” soma somente despesas pendentes.
- Diálogos compartilham foco inicial, contenção de Tab, Escape, bloqueio do fundo e restauração do foco. Campos receberam labels/IDs, botões de ícone receberam nomes e o select básico usa o controle nativo. O dropdown expõe estado e opção ativa.
- Wishlist e compartilhamento usam o transporte central do store, incluindo `apiBaseUrl` e bearer (TEC-15).
- APIs recebem `Cache-Control: no-store`; o cache antigo `api-cache` é removido e o service worker não armazena respostas financeiras (TEC-16).
- Listeners/subscriptions têm limpeza de escopo; bootstrap concorrente da mesma sessão compartilha uma promessa (TEC-17).
- Notificações locais usam data/hora/fuso, são ordenadas, incluem hoje quando ainda futuro e são reagendadas ao mudar lançamentos. Solicitação automática de permissão no boot foi removida. Textos deixaram de prometer sincronização offline completa (TEC-21).

Capturas depois das correções: [Dashboard a 320 px](evidencias/corrigido-dashboard-Mobile-Chrome.png), [Planilha a 320 px](evidencias/corrigido-planilha-Mobile-Chrome.png), [Planilha a 612 px](evidencias/corrigido-planilha-Mobile-amplo.png). Dados são da demonstração local. As imagens de página inteira mostram a barra fixa na posição do viewport, mesmo quando há conteúdo abaixo.

## Redução de arquivos e composables

Contagem de linhas físicas, incluindo vazias; valores finais no [JSON](evidencias/reducao-arquivos.json). A redução de um arquivo não implica redução equivalente de código total ou de bundle.

| Arquivo | Antes | Depois | Separação |
|---|---:|---:|---|
| `MatrizScreen.vue` | 1.897 | 1.008 | Modelo de células em `useMatrixModel`, mês em `useMonthNavigation`, CSS em `styles/matrix.css`. |
| `FinanceSettingsPanel.vue` | 1.451 | 519 | Compartilhamento em `HouseholdSettings`, estilos em `styles/settings.css`. |
| `server/utils/repo.ts` | 1.188 | 829 | Mappers em `financeMappers`, paginação e RPC em `financeBatch`. |
| `useFinanceStore.ts` | 577 | 497 | Tema em `useFinanceTheme`, fila em `useOfflineQueue`, notificações puras em `shared/notifications`. |
| `BaseSelect.vue` | 232 | 16 | Controle nativo com label associado e atributos encaminhados. |

Também foram criados `useDialog` e `useFinanceNavigation`. Valores monetários e períodos ficaram em funções puras de `shared`, sem Vue. As telas agora usam imports assíncronos; Matriz, gráficos e importação não são todos carregados antecipadamente pela página inicial. Os limites de imports permanecem verificados pelo ESLint.

Essa é uma divisão inicial. Matriz, editor e layout ainda concentram interface e interação. Próximas extrações úteis: cards mobile, tabela desktop, edição de célula, ordenação de colunas e draft do editor. Evitar simplesmente mover tudo para um composable grande. Separar adapters memória/Supabase também continua recomendado.

## Verificação executada

- Testes: **35 passaram em 8 arquivos**, incluindo PostgreSQL via PGlite. O fixture reproduz tabelas necessárias às RPCs; não substitui a instalação completa de Auth/RLS/PostgREST do Supabase.
- E2E completo: **7 passaram, 8 skips intencionais por viewport**. Desktop percorreu os módulos, Matriz/Lista e reordenação/edição; mobile verificou cadastro pt-BR, recarga, foco/Escape e ações de dívidas.
- Após o ajuste final dos totais, repetição mobile: **4 passaram**, com 6 skips de testes destinados ao desktop. Cadastro exercitado em 320 e 612 px; teste de dívidas também na largura padrão Pixel 7.
- Lint sem erros nem warnings; typecheck passou. Build de produção passou com saída isolada em `C:/Users/pedro/AppData/Local/Temp/planilha-correcoes-20260904-output`, evitando o bloqueio EPERM anterior na saída padrão.

O build ainda avisa sobre chunks acima de 500 kB, sourcemap do plugin Nuxt e depreciação em dependência Vue. A suíte dev também emitiu avisos de glob do service worker e de renderização inicial Nuxt. Esses avisos não foram ocultados nem considerados resolvidos. Não foi executado build de Storybook nesta etapa de correções.

Logs locais ficam em `evidencias/*-correcoes-final.log` e `e2e-mobile-final.log` (ignorados pelo Git); resultados resumidos neste documento são versionáveis. O CI foi atualizado para Node 22 e executa lint, typecheck, testes, build e E2E. `.nvmrc` registra a versão; o Node instalado nesta máquina não foi alterado.

## Publicação e pendências explícitas

1. **Antes de publicar o backend**, conferir o histórico remoto e aplicar a nova migração em staging. Há prefixos antigos duplicados (`0002` e `0004`); não foram renomeados sem conhecer o histórico aplicado (TEC-19). A nova migração usa timestamp exclusivo. Nenhum banco remoto foi alterado.
2. Homologar com duas famílias reais: tentativa cruzada de IDs, edição parcial, token inválido/reutilizado, papel member/owner e falha de rede. Testar volume superior ao limite da Data API, usando PostgREST real.
3. Testar Android físico: sessão bearer, ciclo de vida, widget, permissões e notificações no horário/fuso definidos. Não foi gerado APK. PWA instalada, cache antigo e logout/relogin também precisam de ensaio em dispositivos reais.
4. A fila local ainda não possui versionamento de registros para resolver conflito entre duas abas/dispositivos. Manter pendências isoladas evita envio para outra família, mas não equivale a sincronização colaborativa completa.
5. O cabeçalho ainda trunca títulos em 320 px; reduzir informação secundária nesse espaço é a próxima melhoria visual. Completar labels/teclado em telas secundárias, revisar contraste com axe/leitor de tela e testar zoom/teclado virtual. Não há certificação WCAG.
6. A Matriz inteira no desktop e consultas de histórico podem crescer: implementar paginação por período, agregações servidoras e medir Web Vitals antes de declarar ganhos de performance. Imports assíncronos não eliminam o peso dos módulos grandes quando abertos.

As correções de segurança preparadas no código só protegem o ambiente publicado após a migração e o deploy correspondentes. O diagnóstico e a implementação local não constituem verificação do estado atual de produção.
