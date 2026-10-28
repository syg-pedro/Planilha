# Laboratório Java + React

Atualizado em 28/10/2026. Branch: `feat/react-springboot`. Base: main `c0eb765`.

PAUSADO por solicitação do usuário em28/10/2026 às15:36(-03:00). Ponto exato, resultados e pendências em [RETOMADA.md](RETOMADA.md). Agentes e serviços locais foram parados, com dados/volumes preservados. Retomar somente após nova solicitação explícita. As seções históricas abaixo ainda precisam ser consolidadas com as últimas entregas registradas no ponto de retomada.

## Objetivo contínuo autorizado

O usuário ativou um Goal para concluir toda a migração local: backend Spring Boot, integração experimental Nuxt, React/TypeScript com HeroUI, segurança e autorização familiar, módulos financeiros e validação completa. Implementações, dependências previstas, migrations e testes locais estão autorizados sem nova aprovação por etapa. Isso substitui os bloqueios de aprovação por fase registrados historicamente abaixo. Após a pausa, o usuário autorizou commit e push desta branch experimental. Merge, deploy, credenciais/dados reais e alterações na infraestrutura de produção continuam fora do escopo.

Critério global: requisitos da especificação inicial e módulos identificados na auditoria rastreados até código/testes/evidências; equivalência financeira comprovada; builds, testes unitários, integração PostgreSQL e E2E locais aprovados. Fases individuais concluídas não encerram o Goal. Futuro deploy e Supabase experimental serão apenas avaliados/documentados, conforme a especificação inicial, sem execução remota.

## Escopo autorizado da primeira entrega

Auditoria, branch isolada, planejamento, bootstrap Spring Boot, PostgreSQL Docker local, Flyway técnico, endpoint de saúde, testes e documentação. Sem CRUD financeiro, integração Nuxt, React, autenticação JWT ou deploy nesta entrega.

Banco: PostgreSQL exclusivo do laboratório; banco `financeiro_lab`; nenhuma alteração Supabase.
API: `GET /api/health` em processo Java independente, loopback.
Front: nenhuma tela alterada.
Regra principal: nenhum dado financeiro real ou credencial de produção entra no laboratório.
Fora do escopo: corrigir riscos existentes, importar seeds, alterar infraestrutura remota, commit/push.

## Fase 0 — auditoria e isolamento

Objetivo: conhecer contratos e riscos antes de implementar regras.

- [x] Conferir Git e preservar os quatro arquivos modificados no checkout original.
- [x] Atualizar referência main e criar branch pedida em worktree próprio.
- [x] Ler AGENTS/CLAUDE e comparar com implementação real.
- [x] Auditar domínio, APIs, banco versionado, autenticação, testes e dependências.
- [x] Criar `01-auditoria.md`, este roadmap e guia inicial de aprendizado.
- [x] Consultar deployment Vercel somente leitura: produção READY/main/c0eb765, origem CLI.
- [ ] Confirmar configuração completa de integração Git/Production Branch antes de qualquer push futuro.

Entregáveis: [auditoria](01-auditoria.md), [guia](guia-aprendizado.md), [evidências](evidencias.md).
Critério: fontes identificadas, limites explícitos e zero mudança na aplicação original.
Pendência de infraestrutura: deployment observado não substitui inspeção das configurações Git.

## Fase 1A — fundação local, primeira entrega

Objetivo: provar a cadeia HTTP → Java → JDBC → PostgreSQL local → histórico Flyway, sem criar ainda o modelo financeiro.

- [x] Preparar `backend-java` com Java 21 e Maven Wrapper.
- [x] Configurar Spring Web, Data JPA, Validation, driver PostgreSQL, Flyway e OpenAPI.
- [x] Criar `infra/dev/compose.yaml`, projeto/volume próprios e porta 55432 em loopback.
- [x] Impedir inicialização fora dos perfis locais e impedir URLs de banco externas antes do datasource/Flyway.
- [x] Configurar Hibernate somente validate, Flyway clean desativado e nenhum seed legado.
- [x] Criar primeira migration técnica com marcador fictício de ambiente.
- [x] Implementar health com checagem de persistência e falha sem detalhes técnicos na resposta.
- [x] Escrever testes de restrições locais, health e integração PostgreSQL/Testcontainers.
- [x] Validar Maven e executar testes unitários: 35 aprovados, sem falhas ou skips.
- [x] Executar teste de integração com PostgreSQL/Testcontainers: 2 aprovados, sem falhas ou skips.
- [x] Validar Compose, PostgreSQL, migration V1, health UP e Swagger HTTP 200 em execução local.
- [x] Rodar regressão unitária segura, typecheck e build Nuxt: 39/40 unitários, falha preexistente de deploy; typecheck/build aprovados.
- [x] Fechar a matriz de evidências com resultados reais, incluindo falha baseline e bloqueio do Docker.

Arquivos criados: `backend-java/**`, `infra/dev/compose.yaml`, `docs/java-react-migration/**`.
Arquivo existente modificado: `.gitignore`, apenas para versionar esta documentação dentro de docs já ignorado.
Aplicação original, package.json/lock, Supabase, Android e deploy: sem alterações.

Decisões: Spring Boot 3.5.x estável compatível com Java 21/JUnit 5; Maven Wrapper fixa o Maven sem instalação global; Springdoc acompanha linha compatível com Boot 3; banco PostgreSQL 17 local; novo histórico Flyway independente. Fontes oficiais e versões estão no guia e no README do backend.

Critério de conclusão: todos os itens de execução acima aprovados. Ter arquivos e testes escritos não significa ambiente homologado.
Resultados, impedimentos e comandos efetivamente executados: [evidencias.md](evidencias.md). A fundação Java local está validada: 35 testes unitários e 2 de integração aprovados, PostgreSQL saudável, Flyway V1 aplicado, health UP e Swagger HTTP 200. Docker iniciou após preservar runtime e desativar Docker AI; o Java usa diretório temporário curto apenas no processo. Não houve reset, exclusão de dados ou reinicialização do Windows. A falha Nuxt de deploy preexistente permanece fora do escopo; integração Git Vercel continua pendente antes de push.

## Fase 1B — contas

Dependência: concluir Fase 1A e revisar contrato de contas com base na auditoria.

Retomada em 28/10/2026: contrato atual conferido e proposta [03-contas-contrato.md](03-contas-contrato.md) aprovada pelo usuário com “ok, pode seguir”, inclusive implementação e migration no banco local. CRUD concluído e validado, sem alterar Nuxt/Nitro/Supabase.

- [x] Definir e aprovar DTOs, tipos de conta, dias de fechamento/vencimento e limites monetários.
- [x] Modelar contas em V2, com ID gerado pelo servidor e contexto local-demo explícito.
- [x] Implementar repository/service/controller com CRUD, validação JSON estrita e exceções centralizadas.
- [x] Definir exclusão física nesta fatia, sem lançamentos/regras Java; SET NULL e referências familiares ficam como requisito da Fase1C.
- [x] Testar CRUD real em PostgreSQL, erros de entrada, inexistência, limites de contexto e constraints; conferir a API local após V2.

Critério: Swagger permite criar/listar/editar/excluir contas fictícias; valores usam BigDecimal; testes e migration passam; nenhuma entidade JPA é exposta diretamente.

Entregáveis: seis classes em com.financeiro.contas, ConfiguracaoJson, ErroApi/TratadorErros e V2__create_accounts.sql. Testes novos: ContaRequisicaoTest, ContaServiceTest, TratadorErrosTest e ContasIntegrationIT; HealthIntegrationIT atualizado para V2 e rotas de contas. Sem nova dependência.

Validação final: Maven verify BUILD SUCCESS,66unitários+58integrações,0falhas/0erros/0skips. V2 aplicada no banco local financeiro_lab e nos bancos descartáveis de teste; health UP, GET/accounts retorna coleção, Swagger HTTP200 e OpenAPI contém as cinco operações. A primeira tentativa de empacotamento encontrou o JAR bloqueado pela API em execução; o processo foi pausado e o build foi concluído. Evidências detalhadas e limites em evidencias.md.

Decisões: duas casas monetárias validadas sem arredondar; tipos JSON estritos; contexto familiar fixo somente demonstrativo; nenhuma paginação ou vínculo com lançamentos criado antecipadamente. Próxima fatia: contrato de categorias/lançamentos da Fase1C, antes de nova implementação.

## Fase 1C — lançamentos

Dependência: contas validadas e contrato de categorias/contexto familiar definido.

Categorias, lançamentos e relatórios iniciais validados: verify-entries-reports.log registra 131 unitários e144 integrações PostgreSQL aprovados. Golden compartilhado com TypeScript cobre três cenários fictícios. Regras/recorrência, desejos, configurações e importações estão implementados, com227 unitários aprovados em test-rules-settings-import.log; integração dessa ampliação ainda em validação. Planejamento/dívidas e compartilhamento familiar continuam pendentes. Não reutilizar seeds pessoais.

- [x] Definir categorias mínimas e referências válidas no contexto local-demo; autorização multifamiliar pendente na Fase4.
- [x] Modelar vencimento/competência, status, origem, parcelas e exclusão de cálculo.
- [x] Implementar CRUD transacional, filtros essenciais de relatórios, DTOs e validação financeira.
- [x] Fixar política decimal e criar equivalência com fixtures fictícias TypeScript/Java.
- [x] Cobrir centavos, fevereiro, virada de ano, benefícios, review e parcelas em cenários fictícios.
- [ ] Concluir integração de regras, desejos, configurações, CSV e onboarding, incluindo rollback real.

Critério: operações reais locais e totais equivalentes aos contratos documentados. HTTP 200 isolado não prova equivalência. Recorrência completa só entra após testes dos casos de borda e decisão explícita sobre startsAt/endsAt.

## Fase 2 — Nuxt experimental consumindo Java

Dependências: contas/lançamentos consolidados; proibir uso do perfil de navegador com fila real.

- [ ] Definir adaptador seletivo de bootstrap/batch e proxy exclusivamente dev.
- [ ] Criar estado/fila/browser/fixtures isolados do Nuxt original.
- [ ] Integrar uma funcionalidade por ações da store existente.
- [ ] Provar alternância reversível sem Java obrigatório no modo Nitro.
- [ ] Validar E2E fictício, claro/escuro/mobile e bloqueio de ativação em produção.

Critério: uma funcionalidade Nuxt consulta e grava exclusivamente dados fictícios no Java; voltar à configuração original restaura o fluxo Nitro. Trocar apenas a base global não atende ao contrato.

## Fase 3 — React

Dependência: backend e integração local consolidados; a continuação automática foi autorizada pelo Goal após cumprir essas dependências.

- [x] Registrar a escolha do usuário: HeroUI para os componentes do futuro frontend React.
- [ ] Criar Vite/React/TypeScript isolados, com HeroUI e conceitos do design system atual.
- [ ] Configurar Router, TanStack Query, React Hook Form e Zod; Zustand só com necessidade demonstrada.
- [ ] Entregar contas e lançamentos: consulta, cadastro, edição e exclusão.
- [ ] Entregar dashboard, filtros e totais calculados pelo backend.
- [ ] Validar erros, loading, acessibilidade, temas, mobile e E2E local.

Critério: fluxos solicitados operam no PostgreSQL local, com Nuxt preservado.

HeroUI foi solicitado explicitamente pelo usuário em 28/10/2026. A documentação atual da linha v3 exige React19+ e TailwindCSS4; pacotes @heroui/react e @heroui/styles. Conferir novamente versões e requisitos ao iniciar a Fase3. Os componentes padrão do React serão os componentes HeroUI, com tokens/tema do produto, acessibilidade e validação claro/escuro/mobile. Essa escolha se aplica somente ao novo frontend React; não altera os componentes, dependências ou estilos do Nuxt. Nenhum pacote React/HeroUI foi instalado nesta etapa. Fontes: [HeroUI](https://heroui.com/) e [requisitos oficiais](https://heroui.com/en/docs/react/getting-started/agents-md).

## Fase 4 — evolução profissional

Dependência: contratos e fluxos básicos comprovados.

- [ ] Spring Security/JWT, identidade e autorização por família/registro, com testes de acesso cruzado.
- [ ] Paginação, ordenação, filtros, transações e concorrência onde necessário.
- [ ] Regressão financeira, contratos, integração Testcontainers e observação de N+1.
- [ ] Logs estruturados sem dados sensíveis, diagnóstico e desempenho medido.
- [ ] Documentar decisões e perguntas de entrevista a cada incremento.

Critério: segurança efetiva no servidor e qualidade demonstrável; sem introduzir camadas ou padrões sem necessidade.

## Fase 5 — operação local e avaliação futura de deploy

- [ ] Validar comandos de iniciar/parar/reiniciar e recuperação local preservando volumes.
- [ ] Documentar reset destrutivo separado e exigir autorização antes de executá-lo.
- [ ] Automatizar CI independente do fluxo de produção, após autorização do escopo.
- [ ] Avaliar custos/limites reais de hospedagem Java e eventual Supabase Auth experimental.
- [ ] Planejar deploy somente mediante autorização específica; nunca publicar produção automaticamente.

## Riscos que acompanham as próximas entregas

| Risco | Tratamento |
| --- | --- |
| Autorização frágil em alguns batches atuais | Documentada na auditoria; não copiar para Java nem corrigir fora do escopo |
| Seeds pessoais e fila offline real | Proibidos no laboratório; fixtures próprias e armazenamento isolado |
| Diferenças financeiras/fuso | Clock injetável e testes de equivalência antes de migrar regras |
| Migrations Supabase incompatíveis com Flyway | Novo histórico independente, sem cópia automática |
| Configuração Git Vercel não totalmente exposta | Nenhum push/deploy; confirmar antes de publicar branch |
| Reincidência de sockets no Windows | Workaround documentado e validado; Docker AI desativado e Java com temporário curto; não substituir PostgreSQL por H2 |

Etapa atual: integração dos módulos backend complementares e preparação de identidade/famílias. O Goal permanece ativo até a conclusão auditável da migração local completa.
