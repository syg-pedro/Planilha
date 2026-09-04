# Usabilidade web e mobile

> Diagnóstico original, anterior às correções. Consulte [o estado implementado e a validação final](06-correcoes-aplicadas.md). Referências de linha deste diagnóstico correspondem à base `19b1c17`.

## Atualização implementada — etapas 02, 03 e 04

Estado atual na branch `codex/revisao-completa-web-mobile`. O diagnóstico abaixo permanece como histórico da base; esta seção descreve as correções efetivas.

- **Planilha mobile:** um mês por vez, navegação mensal e cards com ações explícitas de edição e pagamento. Busca, modo e mês preservados na URL; retorno pelo histórico mantém o contexto.
- **Dashboard:** saldo previsto, a pagar e a receber como indicadores principais; receitas, despesas e limites em detalhes expansíveis. Vencimentos e novo lançamento recebem prioridade.
- **Editor:** valor brasileiro (`1.234,56`), validação junto aos campos, foco no primeiro erro, confirmação de descarte e rascunho preservado após falha. Recorrências reutilizam IDs ao tentar salvar novamente. Novo lançamento usa o mês selecionado e título correto.
- **Tela estreita:** cabeçalho com título completo, campos do editor empilhados até 480 px, controles de formulário com fonte de 16 px e botão de fechar com 44 px. O teste verifica também overflow interno do editor.
- **Erros e totais:** falhas de gravação aparecem no diálogo com mensagem compreensível; lista de desejos distingue erro de carregamento de lista vazia e oferece nova tentativa. Totais da Lista respeitam filtros e exclusões de caixa, com explicação visível.
- **Acessibilidade:** controles nomeados, foco e teclado no diálogo, estados ARIA e ajustes de contraste nos trechos exercitados. Axe verificou topbar, editor e cards mobile; isso não certifica a aplicação inteira.

Capturas: [editor 320 px](evidencias/etapas234-editor-Mobile-Chrome.png), [planilha mobile](evidencias/etapas234-planilha-Mobile-Chrome.png), [editor desktop](evidencias/etapas234-editor-Desktop-Chrome.png).

**Próximas prioridades:** homologar teclado virtual e safe area em Android/iOS reais; zoom 200% e leitores de tela; estender o contrato de formulário às telas secundárias. Medir o tempo de registrar e encontrar uma despesa com usuários antes de encerrar os critérios de usabilidade.


## Diagnóstico

A aplicação já oferece navegação inferior no celular, layout em cards para a matriz, safe area no editor, estados vazios e componentes de gráficos. O maior ganho está em **reduzir o esforço para consultar o mês atual e registrar uma movimentação com confiança**, preservando os fluxos existentes.

Inspeção visual em Chromium desktop e viewports de 390×844, 320×740 e 768×1024. Isso avalia responsividade; não equivale a Android físico, Safari iOS, teclado virtual ou leitor de tela. As demais telas foram consideradas pela leitura de código e dos testes existentes, sem afirmar validação visual de todos os estados.

## UX-01 — P1 — Planilha mobile começa longe do mês atual

**Confirmado:** em 390 px, a visão Matriz renderizou 22 cards mensais, começou em maio/2026 e mediu 25.968 px de altura. Em 320 px chegou a 26.296 px. Não houve overflow horizontal do documento nesses dois tamanhos; o problema encontrado é navegação vertical e densidade.

**Recomendação:** abrir em “Setembro de 2026”, com anterior/próximo e atalho Hoje; exibir somente o mês selecionado, agrupado por vencimento. Permitir buscar meses antigos. Oferecer matriz completa como visão avançada no desktop e opção secundária no celular. Há seletor de mês na Lista que pode ser reaproveitado.

**Aceite:** dados atuais disponíveis sem percorrer meses anteriores; registrar e localizar uma despesa em até três ações principais, sem contar digitação; voltar preserva mês e filtros.

## UX-02 — P2 — Dashboard ocupa a primeira dobra com alertas e indicadores

**Confirmado visualmente:** dois alertas, seis KPIs e um gráfico aparecem antes da lista de próximos vencimentos; não há ação de lançamento no primeiro viewport observado. “Em aberto” exibe saldo negativo, embora o nome possa ser interpretado como contas a pagar.

**Proposta:** primeiro mostrar saldo do mês, “A pagar” e “A receber” separados; a seguir vencimentos com ação “Marcar como pago”; detalhes e gráficos abaixo. Agrupar alertas em “2 contas precisam de atenção” expansível. Adicionar botão contextual “Novo lançamento”, sem encobrir o conteúdo ou a barra inferior. Identificar projeção versus valor efetivamente disponível.

**Aceite:** usuário consegue explicar o saldo e identificar a próxima conta em teste de tarefa; nenhum valor líquido recebe rótulo de dívida total.

## UX-03 — P1 — Diálogos e campos não têm acessibilidade uniforme

**Código:** `BaseModal.vue` declara role/aria-modal, mas não contém foco, restaura foco ou trata Escape; apenas altera overflow do body, sem restaurar o valor anterior no unmount. Editor de lançamentos usa overlay próprio; modal de adicionar na Matriz não declara diálogo. Escape funciona nos inputs de título/valor da Matriz, portanto não é correto dizer que nenhum modal suporta Escape.

`BaseSelect.vue` abre por Enter/espaço, mas não implementa setas/seleção por teclado nas opções. `BaseDropdown.vue` já implementa parte dessa navegação e deve ser avaliado como candidato a consolidação. `BaseInput.vue` tem label como raiz: atributos adicionais, como disabled/required/aria-describedby, precisam ser encaminhados ao input explicitamente.

**Confirmado no snapshot:** botão de menu mobile sem nome; alerta nomeado apenas “3”; campos do modal identificados pelo placeholder, sem associação explícita ao label. Login também tem labels sem for/id e botão de mostrar senha sem nome.

**Recomendação:** um Dialog/Sheet reutilizável com foco inicial, contenção, restauração, Escape global, nome e fundo inerte. Inputs com id, label, erro e descrição associados; botões com aria-label e estado; selects com padrão acessível completo ou controle nativo. [Padrão oficial de diálogo](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

**Aceite:** cadastro e edição completos com teclado; foco não escapa do diálogo; ao fechar retorna ao disparador; leitor de tela anuncia campo, erro, valor e ação corretamente.

## UX-04 — P2 — Navegação interna sem URL por tela

**Código:** `app/pages/index.vue` alterna componentes por `useState('finance-screen')`; layout atualiza esse estado. A URL observada permaneceu `/?key=demo-finance-key` ao abrir Planilha.

**Impacto:** não há endereço compartilhável da tela/intervalo e histórico de navegação não representa essas transições. **Proposta:** rotas explícitas ou query tipada (`screen`, `month`, filtros), com comportamento de voltar consistente também no Android. Guardar somente preferências no storage; URL carrega o contexto compartilhável.

**Aceite:** recarregar, copiar link e usar voltar/avançar preserva tela e período; link inválido cai em estado definido, sem tela vazia.

## UX-05 — P2 — Densidade e alvos pequenos

**Código:** Matriz usa rótulos de 9–11,5 px e ações de 20–24 px; cabeçalho usa botões de 44 px e navegação inferior tem 56 px, dois acertos a preservar.

**Proposta de produto:** controles frequentes com área de toque 44–48 px e texto de leitura confortável; densidade compacta opcional no desktop. Não classificar qualquer alvo menor que 44 px como violação automática: WCAG 2.2 AA define 24×24 CSS px com exceções/condições de espaçamento. Contraste precisa de medição por par de cores e estado, não de impressão visual. [Referência de tamanho mínimo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

**Aceite:** tocar pagar/editar não ativa o controle vizinho; zoom de texto 200% preserva ações; teclado virtual não cobre Salvar; validar alto contraste e preferência por movimento reduzido.

## UX-06 — P1 — Edição e operações destrutivas precisam explicar o resultado

**Código:** Matriz fecha edição antes da chamada; `saveCell` tem finally sem mensagem local de erro. Agregado de vários lançamentos pode virar um único item (TEC-14). Editor retorna silenciosamente quando dados são inválidos. Wishlist tem erro no save, mas carga inicial só usa finally.

**Proposta:** feedback de campo, estado “Salvando”, botão protegido de toque duplo, confirmação de sucesso e retry que preserva rascunho. Excluir mês/coluna deve informar quantidade e período; disponibilizar desfazer quando tecnicamente suportado. Fechar formulário alterado deve preservar rascunho ou confirmar descarte.

**Aceite:** simular rede indisponível e erro 500 mantém conteúdo digitado; cada operação tem estado visível; editar total nunca apaga itens individuais implicitamente.

## Recomendações por área

| Área | Melhoria de web | Melhoria de mobile | Prioridade |
|---|---|---|---|
| Dashboard | Explicar cálculo e período de cada KPI; detalhar ao clicar | Resumo curto, vencimentos acionáveis e criação acessível | P1 |
| Planilha | Matriz com teclado, foco visível e edição de agregado segura | Mês atual por padrão, lista curta e filtros em painel | P1 |
| Relatórios | Filtro temporal preciso e exportação com mesmo escopo | Indicadores essenciais primeiro; tabela resumida por mês | P1 |
| Planejamento | Diferenciar realizado/projetado e saldo acumulado | Cards mensais; tabela ampla como alternativa | P1 |
| Dívidas | Explicar saldo, parcelas e ação em lote | Expandir só a dívida escolhida; ações sem toque acidental | P2 |
| Cartões/contas | Separar limite, uso e fatura pendente | Abrir detalhe e vencimento em um toque; ações contextuais | P2 |
| Assinaturas | Explicar impacto de editar/excluir regra nas parcelas futuras | Formulário curto; preço, próxima cobrança e pausar visíveis | P2 |
| Desejos | Estados de carga/erro e filtros persistentes | Cadastro por campos essenciais; imagem opcional | P1 para transporte; P2 para UX |
| Alertas | Agrupar por urgência e fornecer ação resolutiva | Evitar repetição no topo e notificações sem contexto | P2 |
| Configurações | Separar aparência, família, importação, notificações e manutenção | Lista de categorias, uma seção por tela | P2 |
| Primeiros passos | Manter importação com prévia, erros por linha e resumo | Priorizar cadastro manual rápido; planilha como alternativa | P2 |
| Login/cadastro | Recuperação de senha e erros compreensíveis; labels associados | Autocomplete e mostrar senha acessível; sessão expirada preserva rascunho | P1 acessibilidade; P2 recuperação |
| Ajuda/novidades | Contexto e busca; Design System restrito ao contexto de desenvolvimento se apropriado | Ajuda próxima da ação; instalação com instruções específicas de iOS/Android | P2 |

Essas propostas são recomendações, não funcionalidades implementadas nem resultado de pesquisa com usuários. Validar com tarefas: cadastrar despesa, corrigir valor, pagar conta, encontrar mês passado e recuperar falha de conexão.

## Evidências visuais

- [Dashboard desktop](evidencias/desktop.png)
- [Dashboard 390 px](evidencias/mobile-dashboard.png)
- [Planilha 390 px](evidencias/mobile-planilha.png)
- [Modal 390 px](evidencias/mobile-modal.png)

Capturas contêm dados do seed local. O controle flutuante de Nuxt DevTools pertence ao ambiente de desenvolvimento e não foi classificado como defeito de produção.
