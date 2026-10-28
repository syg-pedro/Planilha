# Evidências do laboratório Java

Data: 28/10/2026. Worktree: `C:/Users/PedroVictordeOliveir/.codex/worktrees/planilha-java-react/Planilha`.
Branch: `feat/react-springboot`. Base: `c0eb7655560ae8dd0a303fe35b5f20e5bfb3b5a0`.

✅ significa requisito conferido. ❌ significa pendência ou falha, com a causa explícita; não significa necessariamente regressão introduzida.

## Matriz da fundação — Fase1A

| Requisito | Como foi verificado | Prova | Estado |
| --- | --- | --- | --- |
| Preservar trabalho local | Status antes/depois; worktree separado; SHA-256 | Os quatro hashes antes/depois são idênticos; branch original feat/revogrid-planilha preservada | ✅ |
| Branch da main atualizada | Fetch origin/main e criação no worktree | Branch feat/react-springboot aponta inicialmente a c0eb765 | ✅ |
| Auditar implementação real | Agentes de domínio e API/banco leram fontes versionadas | 01-auditoria.md com arquitetura, 19 rotas, regras, modelo e riscos | ✅ |
| Roadmap incremental | Comparação com fases e primeira execução solicitadas | ROADMAP.md separa fundação, CRUD, Nuxt, React, segurança e operação | ✅ |
| Documentação de aprendizado | Correspondência Java/Spring com TypeScript/NestJS | guia-aprendizado.md e backend-java/README.md | ✅ |
| Preparar Java/Maven | Compilação Java 21 e resolução de dependências | Spring Boot3.5.16, springdoc2.10.0, Maven3.9.11, wrapper3.3.4 com checksum | ✅ |
| PostgreSQL Docker isolado | Compose up --wait e ps; docker info | Engine Linux29.3.1; PostgreSQL17.11 healthy em127.0.0.1:55432, volume próprio | ✅ |
| Bloquear banco externo antes Flyway | Testes negativos e execução real do jar | Perfil production e URL JDBC externa causam exit1 sem Hikari/Flyway inicializados | ✅ para cenários executados |
| Health e migration fictícia | HTTP real e SELECT local | Health statusUP/databaseUP/environmentlocal-demo; histórico Flyway1 com successtrue | ✅ |
| Testes unitários Java | Maven test/package | 35 testes aprovados, 0falhas,0erros,0skips;32guard e3service. Cinco cenários relaxed binding reproduzidos falhando e corrigidos com Binder | ✅ |
| PostgreSQL/Flyway/HTTP/Swagger reais | Maven verify com temporário curto; HTTP no Compose | 2 integrações aprovadas,0erros/0skips; SwaggerHTTP200 e OpenAPI inclui /api/health | ✅ |
| Regressão unitária Nuxt segura | npm test -- --exclude tests/parser.test.ts | 39passed,1failed em10arquivos; falha baseline detalhada abaixo | ❌ baseline existente |
| Typecheck Nuxt | npm run typecheck | Exit0, sem erro TypeScript | ✅ |
| Build Nuxt | npm run build | Exit0, Build complete; log em .cache/java-react-validation/nuxt-build.log | ✅ |
| Isolamento do código original | git diff origin/main nos diretórios/configurações de produção | Nenhum diff em app/server/shared/supabase/android/package.json/lock/nuxt.config/.vercelignore/.github | ✅ |
| Não alterar produção | Apenas metadados Vercel lidos; nenhuma chamada financeira/Supabase | Sem commit/push/merge/deploy; nenhum arquivo/env original copiado | ✅ |
| Confirmar integração Git Vercel antes push | Conector, contexto Git e CLI já instalado em cache | Deployment READY/main/c0eb765; Production Branch não exposta; CLI scope-not-accessible | ❌ antes de push futuro |
| Roteiro das verificações bloqueadas | Documentação com pré-requisitos e resultados esperados | 02-validacao-local.md; nenhum reset/prune/remoção de volume | ✅ |

## Falha preexistente no Nuxt

Comando executado no worktree sem `.env` ou variáveis Supabase herdadas:

```powershell
npm test -- --exclude tests/parser.test.ts
```

Saída relevante:

```text
FAIL tests/deployment.test.ts:30
AssertionError: expected [ { source: '/', destination: '/planilha', permanent: false } ] to be undefined
Test Files 1 failed | 9 passed (10)
Tests 1 failed | 39 passed (40)
```

O teste exige `gateway.redirects` ausente. O arquivo `deployment/legacy-mobile/vercel.json` da própria main c0eb765 contém o redirect de `/` para `/planilha`. Nem teste nem configuração foram modificados nesta entrega. A falha não foi ocultada ou corrigida fora do escopo.

O parser foi excluído porque importa DEFAULT_DADOS_TEXT existente. E2E não foi executado porque seu setup abre a aplicação e faz bootstrap com seed legado. Não foram removidos ou alterados testes.

## Docker: falha do ambiente e intervenção reversível

O Docker CLI e o Desktop4.67.0 estavam instalados, mas o engine Linux não respondeu. Iniciar Docker Desktop falhou no socket `%LOCALAPPDATA%/Docker/run/dockerInference`. O arquivo era um reparse point de0bytes antigo; diagnóstico retornou erro1920.

Com os processos Docker encerrados e o caminho absoluto verificado, somente a pasta de runtime foi renomeada para:

`C:/Users/PedroVictordeOliveir/AppData/Local/Docker/run.stale-20261028-124112`

O conteúdo foi preservado. Nenhum volume, imagem, container, disco, distribuição WSL, configuração ou segredo foi apagado. Não houve factory reset ou prune.

Uma nova inicialização ultrapassou o primeiro socket, mas falhou no Secrets Engine:

```text
starting services: initializing Secrets Engine: listening on unix://<HOME>/AppData/Local/docker-secrets-engine/engine.sock:
The file cannot be accessed by the system.
```

Uma inspeção posterior confirmou que a pasta do Secrets Engine continha somente `engine.sock`, vazio. Os processos da tentativa iniciada pelo laboratório foram encerrados, o caminho foi conferido e essa pasta foi preservada em `C:/Users/PedroVictordeOliveir/AppData/Local/docker-secrets-engine.stale-20261028-124712`. Nessa tentativa nenhuma configuração foi alterada. A nova inicialização voltou a falhar no Inference Manager: o socket recriado também ficou inacessível. Portanto a hipótese de apenas um arquivo antigo não explicava completamente a falha.

A tentativa de iniciar com.docker.service foi recusada por permissão do Windows; esse serviço parado não comprova a causa, pois o engine WSL2 pode executar sem ele. Reabrir a janela e reiniciar os processos, isoladamente, também não resolveu.

### Recuperação validada nesta execução

Após o usuário autorizar o reparo local e também permitir apagar dados Docker, a investigação confirmou `EnableDockerAI=true` no settings-store.json. Foi aplicada a combinação de backup, quarentena de runtime e desativação dessa opção, orientada por [relatos no repositório Docker](https://github.com/docker/desktop-feedback/issues/531). Isso é um workaround observado, não prova de correção definitiva do problema do Windows.

Backup de configuração: `C:/Users/PedroVictordeOliveir/AppData/Roaming/Docker/settings-store.before-socket-repair-20261028-130540.json`.
Runtime preservado: `C:/Users/PedroVictordeOliveir/AppData/Local/Docker/run.before-ai-fix-20261028-130540`.
Única alteração de configuração: `EnableDockerAI` passou de true para false. Essa opção controla o assistente Gordon, conforme [referência oficial](https://docs.docker.com/desktop/enterprise/hardened-desktop/settings-management/settings-reference/). Não foi afirmado que o Model Runner ou todas as formas de listener foram desativados.

Resultado: Docker Desktop iniciou sem reiniciar o Windows. `docker version` e `docker info` confirmaram server29.3.1, OSType linux e engine/API running. O Compose criou o volume do laboratório, iniciou PostgreSQL17.11 e reportou healthy. Nenhum volume, imagem ou dado anterior foi apagado, apesar da autorização. Não houve reset, reinstalação, upgrade, limpeza global ou alteração de credenciais.

## Java: temporário curto e validação final

Com Docker recuperado, `verify` executou35unitários aprovados, mas2integrações falharam na criação do cliente HTTP Java. O jar real conectou ao PostgreSQL e aplicou V1, mas o Tomcat falhou ao iniciar. Ambos os logs apontavam `UnixDomainSockets.connect0` e `Invalid argument: connect` / `Unable to establish loopback connection`.

Foi criado somente o diretório local `C:/dev/planilha-java-tmp`. As propriedades `jdk.net.unixdomain.tmpdir` e `java.io.tmpdir` foram definidas em JAVA_TOOL_OPTIONS apenas no terminal/processo Java. Nenhuma variável global foi alterada. A política de diretório para sockets UNIX é descrita na [documentação Java](https://docs.oracle.com/en/java/javase/22/core/java-networking.html).

Nova execução `mvnw.cmd verify -B -ntp`, com essas opções: BUILD SUCCESS,35unitários+2integrações,0falhas/0erros/0skips. Testcontainers usou PostgreSQL17 real e banco temporário financeiro_lab_test, aplicou V1 e validou health/OpenAPI/Swagger por HTTP. A primeira falha e a repetição aprovada foram preservadas em logs diferentes.

O jar também iniciou sobre o PostgreSQL do Compose em127.0.0.1:55432. Verificações independentes:

```text
GET /api/health -> {"status":"UP","database":"UP","environment":"local-demo"}
GET /swagger-ui/index.html -> HTTP200
GET /v3/api-docs -> paths inclui /api/health
flyway_schema_history -> version1, successtrue
lab_metadata -> environment|local-demo
```

Na primeira validação, o backend foi iniciado como PID45384 em127.0.0.1:8080. PIDs são temporários e devem ser conferidos antes de qualquer operação posterior.

### Nova abertura em 28/10/2026

Ao tentar novamente, Docker e Java estavam encerrados. EnableDockerAI permanecia false, mas o socket dockerInference voltou a impedir a inicialização. Isso confirma que a alteração de configuração, isoladamente, não corrigiu a recorrência nesta máquina.

Com Docker parado, os diretórios de runtime foram preservados em `C:/Users/PedroVictordeOliveir/AppData/Local/Docker/run.retry-20261028-135223` e `C:/Users/PedroVictordeOliveir/AppData/Local/docker-secrets-engine.retry-20261028-135223`. Nenhum volume ou dado foi apagado. O engine29.3.1 iniciou; o container PostgreSQL existente estava parado e voltou a healthy com Compose up, usando o mesmo volume financeiro-java-lab_postgres_data.

Uma tentativa da API ocorreu antes do banco ficar disponível e falhou por conexão recusada; após o banco saudável, a API iniciou como PID28944 com o mesmo ajuste temporário do Java. Health respondeu UP e Swagger HTTP200. Logs em `backend-java/target/local-retry.log` e `local-retry-ready.log`. A abertura da aba pelo Codex retornou queued; a confirmação efetiva foi feita por HTTP. Nenhuma configuração de produção ou código financeiro foi alterado. Novos testes Maven não foram necessários nesta retomada, pois não houve mudança no código/configuração Java.

## Vercel e alcance da garantia

O conector retornou deployment de produção READY, origem CLI, ref main e SHA c0eb765. O contexto Git retornou linkedProjects vazio, que é evidência parcial. O CLI58.5.1 existente no cache retornou scope-not-accessible ao inspecionar o projeto; inventário de browser expirou. Não foi iniciado login nem alterada autenticação.

Não é possível afirmar a configuração futura de Production Branch com esses resultados. É possível afirmar que não houve push ou deploy nesta execução e que a infraestrutura não foi modificada. Conferir vínculo Git antes de publicar a branch é pendência obrigatória.

## Preparação da Fase1B e escolha do HeroUI

Solicitação de continuidade em28/10/2026: usar HeroUI no futuro frontend React. Dois agentes conferiram somente os contratos atuais de contas, persistência, validação e exclusão; não houve consulta ao Supabase ou leitura de seeds pessoais.

| Requisito | Como foi conferido | Prova | Estado |
| --- | --- | --- | --- |
| Definir HeroUI no React | Documentação oficial e Context7; decisão explícita do usuário | ROADMAP Fase3 e03-contas-contrato.md registram HeroUI; nenhum pacote instalado | ✅ |
| Preparar contrato de contas | Tipos, editor, onboarding, repo e migrations legadas |03-contas-contrato.md documenta campos, HTTP, dinheiro, active e exclusão | ✅ |
| Tornar alteração de banco revisável | SQL novo proposto em uma linha, somente local | DDL de accounts revisada no contrato e aprovada antes de V2 | ✅ |
| Implementar API/migration | Aprovação explícita “ok, pode seguir”, seguida de implementação/testes | CRUD e V2 concluídos; matriz detalhada abaixo | ✅ |
| Preservar aplicação e higiene | Estado Git e git diff --check | Sem novos diffs no Nuxt/Nitro/Supabase/dependências; checagem sem erros | ✅ |

## Fase1B — contas implementadas e validadas

A aprovação do usuário autorizou implementar a proposta e executar a migration exclusivamente no banco local. A mudança ficou em backend-java e documentação, sem dependências novas ou código React/Nuxt.

| Requisito | Como foi testado | Prova | Estado |
| --- | --- | --- | --- |
| CRUD REST persistente | HTTP real com PostgreSQL17 Testcontainers | POST201+Location, GET/listagem, PUT200, DELETE204 e404 após exclusão | ✅ |
| Tipos/valores/dias | Unitários e parametrizados HTTP | Quatro tipos; limite null/zero/0.10/0.20/1234.56/máximo; dias null/1/31 e fechamento28/vencimento5 | ✅ |
| Fronteira JSON | Parametrizados HTTP | Nome/owner numérico ou booleano, dias fracionários, números como texto e strings vazias em active/dias/limite retornam400 | ✅ |
| Dinheiro sem arredondamento silencioso | BigDecimal e SELECT de persistência nos testes | NUMERIC(14,2), @Digits(12,2); negativos, excesso de casas e overflow rejeitados | ✅ |
| Normalização/estado | Unitários e HTTP | Trim; owner ausente vira vazio; não-cartão limpa três campos; PUT sem active mantém false; listagem inclui inativas | ✅ |
| Identidade/contexto | Unitários, HTTP e constraints | ID account-UUID gerado no servidor, local-demo fixo; id/householdId do cliente rejeitados; buscas por ID+família | ✅ |
| Erros seguros | TratadorErrosTest e HTTP | Corpo code/message/fields;400/404/405/500 preservados; nenhum SQL/valor rejeitado/stacktrace no cliente | ✅ |
| Esquema V2 | Flyway, Hibernate validate e15casos de constraints | Contexto/tipos/dias/dinheiro/non-card/NOT NULL protegidos; V1 intacta | ✅ |
| Regressão Java | Maven verify completo |66unitários+58integrações,0falhas/0erros/0skips, BUILD SUCCESS | ✅ |
| Execução local | HTTP e SELECT somente leitura no Compose | HealthUP; GET/accounts={accounts:[]}; Swagger200; OpenAPIget/post e get/put/delete; Flyway versões1/2 com successtrue | ✅ |
| Preservar aplicação original | git diff origin/main em código/configuração de produção | Nenhum diff em app/server/shared/supabase/android/package.json/lock/nuxt.config/.vercelignore/.github | ✅ |

### Execuções e falhas registradas

O primeiro verify passou63unitários, mas o Windows impediu renomear o JAR porque a API local anterior ainda o mantinha aberto. O processo identificado como PID28944 foi pausado; não houve alteração de dados para corrigir esse bloqueio. Após mensagens de validação em português e testes do advice, o verify completo passou66unitários e55integrações.

A revisão levantou três casos adicionais de coerção de string vazia. Eles foram adicionados e o teste HTTP focado passou25casos, incluindo os três novos. A execução final com a suíte atualizada passou66unitários e58integrações. Não houve alteração de regras para fazer esses testes passarem: a configuração JSON já os rejeitava corretamente.

Relatórios atuais: ContaRequisicaoTest17, ContaServiceTest11, TratadorErrosTest3, LocalEnvironmentInitializerTest32, HealthServiceTest3, ContasIntegrationIT56 e HealthIntegrationIT2. A execução final está em backend-java/target/verify-accounts-complete.log; falha inicial em verify-accounts.log; primeira execução completa aprovada em verify-accounts-final.log; verificação de strings vazias em verify-empty-json.log.

Somente os bancos descartáveis financeiro_lab_test receberam registros fictícios dos testes; a limpeza por teste confere current_database() antes de DELETE. No Compose, V2 criou a tabela e nenhum registro de conta foi inserido automaticamente. API local reiniciada como PID25664 em127.0.0.1:8080, com os logs accounts-local-startup.log e accounts-local-startup-error.log. PIDs são temporários e não devem ser reutilizados sem conferência.

### Conferência SQL desta etapa

| Verificação | Evidência | Estado |
| --- | --- | --- |
| Tabela/colunas conferidas | shared/types.ts, migration original0001, entidade JPA, DDL aprovada e Hibernate validate sobre PostgreSQL real | ✅ |
| Padrão WITH/RETURNING de apps_web | Não se aplica: esta etapa usa banco local próprio, DDL Flyway e JPA; não usa SAGI/SGR/apps_web | ✅ não aplicável |
| Nenhum comentário -- no SQL novo | V2 e consultas SQL dos testes/local sem comentários SQL | ✅ |

Não foram repetidos testes/build/typecheck Nuxt nesta fatia, pois não houve mudança nos fontes/dependências/configuração do Nuxt. A execução anterior continua registrada com a falha preexistente de deploy. Não foram implementados/testados autenticação, integração Nuxt/React ou vínculos de lançamentos; a exclusão desta fatia é física e abrange somente contas locais sem essas referências.

## Evidências técnicas locais

Relatórios Maven em `backend-java/target/surefire-reports` e `backend-java/target/failsafe-reports`; logs de rejeição real em `backend-java/target/rejected-profile.log`, `rejected-url.log` e `rejected-relaxed-env.log`. O último prova que SPRING_DATASOURCE_HIKARI_JDBCURL externo também é rejeitado no jar antes Hikari/Flyway. Falha inicial de sockets Java em `verify-after-docker-repair.log`/`local-startup.log`; aprovação final em `verify-short-tmp.log`/`local-short-tmp.log`. Esses arquivos são outputs ignorados pelo Git.

Conferência final após Fase1B: git diff --check sem erros; nenhum diff no código/configuração de produção; somente .gitignore modificado e38arquivos novos do laboratório/documentação no estado Git atual. Os quatro arquivos modificados do checkout original foram preservados na conferência anterior e não foram editados nesta etapa. Nenhum commit, push ou deploy. Fundação e CRUD de contas foram exercitados com PostgreSQL, Flyway, HTTP e Swagger reais. Não foram testados reinício do Windows, produção, dispositivos Android ou integração Nuxt/React com Java; esses itens permanecem fora desta etapa.

## Fase1C e ampliação dos módulos backend

| Requisito | Como foi testado | Prova | Estado |
| --- | --- | --- | --- |
| Categorias e lançamentos completos | HTTP/Testcontainers PostgreSQL17, validação e constraints | verify-entries-reports.log:131 unitários+144 integrações,0falhas/erros/skips | ✅ |
| Dinheiro, datas, parcelas e referências | Persistência decimal, datas inválidas, SET NULL, status e metadados | CategoriasIntegrationIT17 e LancamentosIntegrationIT69, além de contas56/health2 | ✅ |
| Equivalência financeira | Mesmo golden fictício congelado em TypeScript/Java | JavaFinanceParityTest3 e tests/javaFinanceParity.test.ts3 aprovados; centavos, fevereiro, virada anual, benefícios, review e fuso | ✅ |
| Regras, desejos, preferências, CSV e onboarding | Unitários das novas fatias e regressão anterior | test-rules-settings-import.log:227 unitários,0falhas/erros/skips | ✅ unitários; integração pendente |
| CSV com entrada inválida | Casos de espaço/símbolo no número, sufixos/horários e limite de linhas | LeitorCsvTest18 aprovados; aceita decimal BR sem truncar e rejeita datas inválidas | ✅ |
| Importação atômica e concorrência | IT HTTP/PostgreSQL em preparação | Não alegar rollback/concorrência provados antes da execução | ❌ pendente |

V3 cria categorias/lançamentos; V4 regras e unicidade de geração automática; V5 desejos e configurações genéricas. V1–V3 foram aplicadas nos Testcontainers da execução acima. V4/V5 ainda aguardam integração real nesta atualização. O processo local pelo JAR foi parado antes do empacotamento; não assumir API em execução enquanto o verify não terminar e o JAR não for iniciado novamente.

Decisões revisáveis: CSV mantém positivo=despesa/negativo=receita, mas rejeita formatos que o parseFloat legado truncava. Rebuild preserva identidade, pagamentos e histórico; startsAt/endsAt continuam informativos, como no TypeScript. Excluir regra cancela automáticos futuros não pagos e preserva pagamentos/histórico. Nenhum módulo novo usa arquivos pessoais ou serviços financeiros externos.

## V5/V6, autenticação e React inicial

| Requisito | Teste/prova concreta | Estado |
| --- | --- | --- |
| Módulos V1–V5 | verify-modules-v5.log:238 unitários+255 integrações, zero falhas/erros/skips | ✅ |
| Auth real, acesso cruzado e integridade familiar | verify-auth-v6-fixed.log:248 unitários+282 integrações;12 casos de segurança sem contexto de teste | ✅ |
| Onboarding transacional e concorrente | OnboardingIntegrationIT15: prévia sem escrita, referências, trigger que falha após criação/autos, sequence prova avanço, corrida com um200/outro400 | ✅ |
| Usuário sem nenhum vínculo | verify-auth-pagination.log inclui14 casos de segurança; novo login/refresh criam família vazia e não revelam dados anteriores | ✅ |
| Paginação, busca literal e repetição | verify-auth-pagination.log:248 unitários+19 integrações focadas; CsvIT5 inclui datasJan31/Fev29/Mar31, centavos, status, filtros e limites | ✅ |
| N+1 da página de lançamentos | Hibernate Statistics na requisição HTTP de size1/3registros: exatamente2 statements (dados+count) | ✅ |
| Nuxt experimental isolado |9 testes, prepare/typecheck/ESLint e bloqueio real de configuração em produção;05-nuxt-java-local.md | ✅ estático; E2E pendente |
| React/HeroUI inicial | npm install isolado, typecheck aprovado e build.log BUILD concluído;19 testes de modelo dos recursos | ✅ código/build; E2E em andamento |
| Login/cadastro React real | Cadastro no navegador local com usuário @example.test e família fictícia; painel autenticado carregou sem avisos/erros de console observados | ✅ fluxo observado; suíte automatizada pendente |
| Claro/escuro e responsividade | Screenshot manual login claro e lançamentos escuro vistos; matriz automatizada320/768/1440 ainda em execução | ❌ gate completo pendente |

A primeira execução de verify-auth-v6.log parou em testCompile por @Import duplicado num teste; a anotação foi combinada. A chain permissiva dos testes legados recebeu matcher explícito para não conflitar com a chain real do Spring Security. Nenhum bypass de teste entrou no código de produção. A suíte completa seguinte e a execução focada passaram.

A API local foi iniciada pelo script lab.ps1 em28/10/2026, PID7872 (temporário), e health retornouUP. O teste do iniciador identificou JAVA_HOME antigo com java.exe residual, mas sem lib/jvm.cfg; o script passou a validar a instalação completa e usar o JDK do PATH quando necessário. O script preserva variáveis de ambiente ao terminar. Vite iniciou em sessão supervisionada na5173. O JAR em uso precisa ser parado de forma identificada antes de novo package/verify.

Não foram executados commit, push, merge ou deploy. Os testes PostgreSQL usam bancos descartáveis financeiro_lab_test; o único cadastro do navegador foi fictício e ficou no banco local financeiro_lab. Não houve leitura/importação dos seeds pessoais.
