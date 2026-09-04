# Achados técnicos e funcionais

> Diagnóstico original, anterior às correções. Consulte [o estado implementado e a validação final](06-correcoes-aplicadas.md). Referências de linha deste diagnóstico correspondem à base `19b1c17`.

Data: 04/09/2026. Base: commit `19b1c17`. Referências de código usam linhas físicas, incluindo linhas vazias. Os caminhos são relativos à raiz do repositório. A revisão não altera o comportamento da aplicação.

P0 = isolamento de dados; P1 = perda de dados, cálculo incorreto ou fluxo importante inacessível; P2 = manutenção, acessibilidade ou experiência prejudicada. **Código** significa fluxo identificado por inspeção; **reproduzido** significa execução local; **risco** depende de configuração ou cenário ainda não exercitado.

## Segurança, persistência e integridade

### TEC-01 — P0 — Gravações não isoladas por família (código)

**Evidência:** `server/utils/repo.ts:785–790,825–861,1089–1178`. O cliente usa `supabaseServiceKey`. Exclusões de entries/rules/accounts/wish_items filtram somente por `id`; upserts aceitam IDs do cliente e gravam o household atual sobre eles. As PKs são globais (`supabase/migrations/0001_init.sql`).

**Impacto:** um usuário autenticado que obtenha um ID de outra família pode tentar apagar ou sobrescrever esse registro. O filtro de household na leitura posterior não protege a mutação. Isso não é uma alegação de exploração realizada: nenhum banco remoto foi alterado.

**Correção:** usar acesso com sessão e RLS quando possível; nas operações privilegiadas validar propriedade de todos os IDs, incluindo referências a contas, categorias e regras. Aplicar household nas exclusões/updates; separar criação de atualização e impedir troca de household em conflito. Validar todo o lote antes de mutar e executar atomicamente.

**Aceite:** duas famílias em banco descartável; leitura, update, delete e upsert com ID/referência estrangeira são rejeitados e nenhuma linha muda. Testar também um lote misturando IDs autorizados e proibidos. Referência: [RLS e credenciais privilegiadas](https://supabase.com/docs/guides/database/postgres/row-level-security).

### TEC-02 — P1 — Edição parcial apaga campos existentes no Supabase (código)

**Evidência:** `FinanceEntryEditorModal.vue:287–328` emite `Partial<FinanceEntry>` sem `ruleId`, `origin`, `metadata` e `createdAt`. `repo.ts:834–855` substitui ausências por null/manual/data atual. O repositório em memória faz merge (`repo.ts:337–343`).

**Impacto:** uma edição de título/valor pode desvincular uma regra, apagar metadados e alterar a origem. O modo demo mascara a divergência.

**Correção:** contrato explícito de criação versus patch; ler e mesclar o registro autorizado ou atualizar somente os campos presentes. `undefined` mantém, `null` limpa somente campos anuláveis. **Aceite:** editar um lançamento gerado mantém vínculo, origem, metadados e data de criação nos dois adapters.

### TEC-03 — P1 — Fila offline removida antes do envio (código)

**Evidência:** `useFinanceStore.ts:244–263`: copia a fila, zera e persiste antes dos POSTs; um erro interrompe o loop. `saveEntriesBatch` offline atualiza apenas IDs que já existem.

**Impacto:** reconexão com 401/500 ou oscilação perde lotes pendentes; lançamento novo não aparece na lista offline. Reabrir online não dispara necessariamente `online`, e `boot` não faz flush inicial.

**Correção:** remover cada operação só após confirmação, IDs idempotentes, retry controlado, lock de flush e reconciliação. Inserir criações otimistas com ID estável. Mostrar pendente/erro/sincronizado. **Aceite:** falhar no segundo de três lotes conserva o segundo e o terceiro; reiniciar não perde dados nem duplica a primeira operação.

### TEC-04 — P1 — Fila offline compartilhada entre usuários (código)

**Evidência:** chave fixa `finance-offline-queue`; `resetState` limpa só a ref, não o storage; `useLogout.ts` remove apenas a edit key. `app.vue:227` reseta e executa `boot` após mudança de usuário, recarregando a fila persistida.

**Impacto:** operações da família A podem ser enviadas pela sessão B. **Correção:** particionar por usuário + household; checar proprietário antes de enviar; ao sair, explicar o destino das pendências e nunca transplantá-las para outra sessão. Testar troca de conta offline/online.

### TEC-05 — P1 — Validação superficial de lotes (código)

**Evidência:** `server/api/entries/batch.post.ts:6–9` aceita qualquer objeto via passthrough e faz cast para any. O repo preenche valores ausentes com defaults.

**Impacto:** requisições inválidas entram no domínio ou falham tarde, após exclusões já executadas. **Correção:** schemas de create/patch/delete com enums, datas reais, valor finito, tamanho de texto, limite de lote e IDs vinculados à família. A validação de frontend complementa, não substitui, a de API. **Aceite:** payload inválido retorna 400 estruturado sem mutação parcial.

### TEC-06 — P1 — Lotes e operações de substituição sem atomicidade (código)

**Evidência:** `repo.ts:829–857` deleta antes de upsert; `reseedEntries`, aproximadamente linhas 929–959, exclui várias tabelas antes de reinserir; `rebuildRules` exclui e depois insere. O onboarding já possui RPC própria e é uma referência local de encapsulamento transacional.

**Correção:** transação no banco para as operações compostas, validação prévia e idempotência. **Aceite:** erro provocado durante a gravação deixa o estado anterior integralmente preservado.

### TEC-07 — P2 — Convites e papéis sem contrato suficiente (código/risco)

**Evidência:** `server/api/invitations/create.post.ts` permite solicitar role owner e valida associação, não o papel de quem convida. A RLS documenta criação por membros, portanto não se presume que convidar seja exclusivo do owner. `accept.post.ts` autentica somente por cookies, substitui o vínculo único do usuário e não verifica o erro ao marcar o convite aceito.

**Recomendação:** decidir explicitamente quem pode convidar/promover; aplicar a política na API e no banco. Aceitar convite e trocar vínculo numa transação, com aviso de que a família atual muda. Normalizar e-mail e suportar o mesmo contrato bearer/cookie dos demais endpoints. **Aceite:** teste owner/member, token expirado/reutilizado, falha parcial e cliente nativo.

### TEC-08 — P1 — Bootstrap sem paginação pode devolver histórico incompleto (risco)

**Evidência:** `repo.ts:799–803,861` usa select de todas as linhas, sem range/order/paginação; totais são calculados a partir da resposta. A configuração padrão documentada da Data API limita respostas a 1.000 linhas, mas o limite deste projeto remoto não foi consultado.

**Correção:** consultas por intervalo, paginação estável e agregações completas no servidor. Nunca apresentar soma parcial como total. **Aceite:** base descartável com mais de 1.000 entradas mantém contagem e totais corretos. [Referência oficial de select](https://supabase.com/docs/reference/javascript/select).

## Cálculos e edição

### TEC-09 — P1 — Relatórios de período incluem futuro (código)

**Evidência:** `screens/RelatoriosScreen.vue:165–186`: últimos 3/6 meses comparam apenas `>= start`; ano compara apenas `>= yearStart`.

**Impacto:** parcelas de anos seguintes entram em “Este ano”; receitas/despesas futuras entram no retrospecto. **Correção:** intervalos `[início, próximo início)` explícitos; retrospecto e previsão separados. **Aceite:** em setembro/2026, “Este ano” exclui janeiro/2027; “últimos 3 meses” exclui outubro/2026.

### TEC-10 — P1 — Telas somam universos diferentes (código)

**Evidência:** dashboard/store usam `excludeBenefitEntries`; `PlanejamentoScreen.vue` e `RelatoriosScreen.vue` agregam `store.entries` sem essa regra. Ambos usam vencimento diretamente em vez do critério escolhido no store.

**Correção:** seletores compartilhados de escopo financeiro, período e competência. Explicitar quando um painel inclui benefícios. **Aceite:** mesma família/período/critério resulta no mesmo total entre resumo, relatório e planejamento; item excluído não reaparece no saldo.

### TEC-11 — P1 — Vencimento de hoje some do KPI (reproduzido por função)

**Evidência:** `shared/finance.ts:33–59` compara vencimento à meia-noite UTC com `new Date()` incluindo hora. Depois da meia-noite o vencimento de hoje fica fora de `upcoming7Days`.

**Correção:** comparar datas civis no timezone definido; injetar relógio nas funções. **Aceite:** hoje permanece no intervalo durante todo o dia e a virada de mês em São Paulo não antecipa o próximo período.

### TEC-12 — P2 — Filtro de conta/categoria inclui lançamentos sem vínculo (reproduzido por função)

**Evidência:** `shared/finance.ts:16–21` só rejeita IDs diferentes quando o lançamento possui ID.

**Correção:** filtrar estritamente pela seleção; oferecer “Sem conta/sem categoria” como opção própria. **Aceite:** selecionar uma conta retorna apenas seus registros, salvo seleção explícita de não classificados.

### TEC-13 — P1 — Valor pt-BR interpretado incorretamente (expressão reproduzida)

**Evidência:** `MatrizScreen.vue:826` usa `parseFloat(editValue.replace(',', '.'))`: `1.234,56` vira `1.234`, e texto parcialmente numérico pode ser aceito.

**Correção:** parser monetário único, validação completa e precisão controlada (centavos ou decimal); informar erro ao lado do campo. **Aceite:** 1234,56 e 1.234,56 equivalem a R$ 1.234,56; lixo, infinito e formatos ambíguos não são gravados silenciosamente.

### TEC-14 — P1 — Editar total de célula elimina lançamentos individuais (código)

**Evidência:** `MatrizScreen.vue:730–744` agrupa por tipo/título/mês; `saveCell:862–865` mantém o primeiro registro e apaga os demais ao editar soma com múltiplos registros. Contas diferentes com o mesmo título também podem ser agrupadas.

**Correção:** célula agregada abre detalhes; edição de total exige escolher distribuição ou item alvo. Zero deve ter semântica clara e confirmação se implicar excluir. **Aceite:** editar soma de dois registros preserva ambos e suas contas/datas, salvo exclusão explicitamente confirmada.

## Cliente, PWA e manutenção

### TEC-15 — P1 no modo bundled — APIs fora do transporte central (código)

**Evidência:** `ListaDeDesejosScreen.vue:675,778,796`, `FinanceSettingsPanel.vue:589,606` chamam `$fetch` diretamente com caminho relativo. Não reutilizam apiBaseUrl nem bearer token do store. A aceitação de convites também usa contrato de cookies.

**Impacto:** o web shell remoto pode funcionar por cookies; o Android com assets locais/backend separado pode buscar no localhost ou receber 401. Não foi executado APK.

**Correção:** ações de store + transporte único e tipado; nenhuma chave em query. **Aceite:** wishlist/convites funcionam com cookies na web e bearer no modo bundled, com erro/retry visível.

### TEC-16 — P1 — Cache de API financeira não particionado (risco)

**Evidência:** `nuxt.config.ts`, runtimeCaching NetworkFirst para todo `/api/` do host de produção, cache `api-cache` por até uma hora. Não foi encontrada limpeza de CacheStorage no logout inspecionado.

**Risco:** respostas autenticadas reutilizadas em falha de rede após troca de conta, dependendo da chave e headers efetivos de cache. Não confirmado em produção. **Correção:** NetworkOnly para API sensível ou cache explicitamente isolado e apagado por sessão; nunca armazenar erros de auth; revisar promessa “offline” do banner. **Aceite:** usuário B nunca vê resposta de A ao perder conexão.

### TEC-17 — P2 — Ciclo de vida global disperso (código)

**Evidência:** `useAuth.ts:init` registra onAuthStateChange sem expor unsubscribe; `app.vue:299` adiciona listener de tema anônimo sem remoção; store boot registra online. O mesmo callback online não deve ser descrito como duplicado automaticamente, mas falta um contrato explícito de inicialização/dispose por sessão.

**Correção:** plugin/composable com init idempotente e cleanup; efeitos de plataforma isolados dos cálculos. **Aceite:** montar/desmontar e trocar conta não conserva subscriptions antigas nem respostas da sessão anterior.

### TEC-18 — P2 — Configuração e documentação divergem (código)

**Evidência:** AGENTS/README descrevem chave demo e ausência de login; há Supabase Auth, famílias, convites, onboarding e Android remoto/bundled. `nuxt.config.ts` publica defaultEditKey, que não deve ser tratada como segredo; autenticação remota não aceita fallback demo quando Supabase está ativo.

**Correção:** documentar matriz demo/web autenticada/Android remoto/Android bundled; validar configuração incompleta no startup; demo explícito em produção. Não classificar a exposição da chave demo como vazamento de service key.

### TEC-19 — P2 — Migrações com prefixos duplicados (código/risco operacional)

**Evidência:** dois arquivos `0002_*` e dois `0004_*` em `supabase/migrations`. **Correção:** verificar histórico remoto antes de reorganizar; novas migrações com versão única. Não renomear cegamente migrações aplicadas. **Aceite:** instalação vazia e upgrade do estado real produzem o mesmo schema.

### TEC-20 — P2 — Bundle e consultas crescem junto com todo o produto (medido/código)

**Evidência:** build gerou chunks JS de 937,15 kB e 1.115,25 kB minificados; `app/pages/index.vue` importa todas as telas estaticamente; plugin ECharts global registra vários gráficos; CSS de AG Grid global. Não se atribui cada chunk a uma biblioteca sem análise do manifest.

**Correção:** telas sob demanda, gráficos por necessidade, revisar dependências realmente usadas e medir bundle inicial separadamente. ExcelJS já tem import dinâmico no utilitário de workbook: preservar esse acerto. **Aceite:** orçamento de JS inicial documentado, sem baixar telas secundárias antes de navegar; medir build de produção em rede móvel.

### TEC-21 — P2 — Notificações e estado offline prometem mais que o fluxo demonstra (código)

**Evidência:** `app.vue` pede notificações durante boot; `scheduleUpcomingNotifications` filtra meia-noite >= instante atual, excluindo hoje antes de definir a hora, e usa primeiros 90 itens sem ordenação. Não usa notificationDays para antecipações.

**Correção:** permissão após intenção explícita; agendar a partir do horário final, ordenar e reagendar ao pagar/editar; definir contrato web versus Android. **Aceite:** vencimento hoje às 18h é agendado às 10h; pagamento cancela lembrete; negar permissão não bloqueia o app.
