# Plano priorizado de melhoria

> Diagnóstico original, anterior às correções. Consulte [o estado implementado e a validação final](06-correcoes-aplicadas.md). Referências de linha deste diagnóstico correspondem à base `19b1c17`.

## Ordem recomendada

Priorizar isolamento e integridade antes de mudanças visuais: um saldo bonito calculado sobre dados incompletos ou uma edição que apaga informações diminui a confiança no produto. As etapas abaixo são propostas para PRs futuros, não entregas já implementadas.

| Etapa | Escopo | Referências | Esforço relativo | Critério de saída |
|---|---|---|---|---|
| 1 — Dados protegidos | IDs por família, criação/patch, lotes atômicos e schemas | TEC-01/02/05/06/07 | Alto | Testes de duas famílias e paridade dos adapters passam |
| 2 — Saldo confiável | Períodos com limite superior, benefícios/exclusões, timezone e valores pt-BR | TEC-09/10/11/12/13/14 | Médio/alto | Mesmo escopo gera mesmo total; editar não perde dados |
| 3 — Sincronização previsível | Fila por sessão, ACK/idempotência, cache sensível e transporte único | TEC-03/04/15/16 | Alto | Falha/reload/troca de conta não perde nem mistura dados |
| 4 — Jornada mobile | Mês atual, CTA de criação, feedback de salvar, resumo e vencimentos | UX-01/02/06 | Médio | Tarefas centrais sem rolagem por meses antigos |
| 5 — Acessibilidade e navegação | Dialog/Sheet, campos/selects, rotas e back | UX-03/04/05 | Médio | Teclado completo e contexto preservado por URL |
| 6 — Modularização e velocidade | Dividir Matriz/Settings/layout/store, carregar telas sob demanda | TEC-17/20; documento 03 | Médio/alto | Responsabilidades menores e redução medida de JS inicial |
| 7 — Operação sustentável | E2E atual, gates CI, documentação de modos, migrações e notificações | QA-01; TEC-18/19/21 | Médio | CI representativo e checklist de release executável |

A recuperação dos E2E e testes dos contratos críticos deve começar junto das etapas 1–2 e acompanhar cada entrega; não fica adiada até a etapa 7. Esforço relativo não é uma estimativa de prazo ou custo.

## Primeiros PRs sugeridos

1. **Isolamento de escrita:** testes locais com famílias A/B, autorização de IDs e referências, rejeição atômica. Revisar também rules/accounts/wishlist.
2. **Patch sem perda de vínculo:** schemas separados e paridade entre adapters, incluindo edição pelo modal de regra gerada.
3. **Seletores financeiros consistentes:** período explícito, data civil, inclusão de benefícios e parser monetário, com casos de virada de mês/ano.
4. **E2E utilizável:** remover dependência do botão Recolher, reconciliar nomes/classes e fixar seed/relógio dos testes, mantendo assertions de comportamento.
5. **Planilha mobile no mês atual:** extrair navegação de período e card mensal, preservar desktop e estado de edição, medir caminho até cadastrar/pagar.

## Como avaliar sucesso

| Dimensão | Meta proposta | Como medir |
|---|---|---|
| Integridade | Zero mutações entre famílias e zero perda em patch/flush | Integração com banco descartável + falhas controladas |
| Consistência | Totais iguais sob o mesmo escopo/período | Fixtures compartilhadas entre seletores e telas |
| Cadastro | Até três ações principais para iniciar/concluir o fluxo, além da digitação | Teste de tarefa com web e mobile |
| Recuperação | Rascunho e operação pendente sempre recuperáveis | Offline, 500, reload e troca de sessão |
| Acessibilidade | Fluxos centrais completos por teclado e nomes acessíveis | Manual + automação; medir contraste separadamente |
| Navegação | URL e back mantêm tela/período | E2E desktop, mobile e Android |
| Performance | Orçamento de JS inicial menor que baseline a medir | Build servido e waterfall; não usar soma Nitro como download |
| Manutenção | PRs alteram unidade coesa sem duplicar cálculo | Revisão arquitetural, boundaries e contratos |

Não adotar “tudo abaixo de 300 linhas” como indicador único de qualidade. Medir responsabilidades, dependências, duplicação e facilidade de validar a mudança.

## Decisões de produto que precisam ser explícitas

- “Saldo” representa caixa disponível, previsão ou receitas menos despesas independentemente do status?
- Benefícios entram em quais painéis? “Excluir do cálculo” vale globalmente ou apenas em uma visão?
- Editar regra altera lançamentos passados, apenas futuros ou só novos? Pago deve permanecer intocado?
- Quem pode convidar/promover membros e o que acontece com a família anterior ao aceitar convite?
- Offline significa consultar último estado, cadastrar pendências, ou ambos? Como o usuário vê conflitos?
- Web, PWA e Android bundled devem ter as mesmas funções? Quais dependem de plataforma?

Resolver essas decisões por critérios de aceitação e texto da interface; não deixá-las implícitas em defaults ou condicionais de componentes.
