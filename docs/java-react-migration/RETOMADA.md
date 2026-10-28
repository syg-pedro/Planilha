# Migração pausada por solicitação do usuário

Pausa solicitada em28/10/2026, registrada às15:36(-03:00). O usuário pediu: “anote onde voce está e pare o processo”. O Goal deve permanecer pausado até retomada explícita. Migração incompleta; não marcar como concluída.

## Local e autorização preservada

Worktree: C:\Users\PedroVictordeOliveir\.codex\worktrees\planilha-java-react\Planilha

Branch: feat/react-springboot, base main c0eb765. Em 28/10/2026 o usuário autorizou commit e envio da branch experimental após a pausa. Nenhum merge ou deploy de produção foi autorizado. O checkout original C:\dev\Planilha e seus quatro arquivos modificados não foram editados por esta frente. Os diffs no Nuxt deste worktree são guards/adaptador condicionais do laboratório, implementados depois da base Java; conferir o modo padrão na regressão final.

Escopo autorizado quando houver retomada: concluir a migração local Java/Spring Boot + React/TypeScript/HeroUI, Nuxt experimental, segurança, módulos financeiros, testes e documentação. Dependências previstas, migrations e testes locais autorizados sem aprovação por fase. Produção, dados pessoais, credenciais reais, merge e deploy continuam fora da autorização. Commit e push da branch experimental foram autorizados pelo usuário após a pausa. Referências:00-especificacao.md, ROADMAP.md e REQUISITOS.md. Não usar dados.txt nem shared/defaultDadosText.ts em testes ou importações.

## Processos encerrados

Os três agentes foram interrompidos. Vite local PID20940 foi encerrado após conferir o caminho do processo. O script scripts/java-react/lab.ps1 stop encerrou o Java identificado no estado local(PID7872) e parou somente o container financeiro-java-lab-postgres-1. Docker Desktop e serviços de outros projetos foram preservados.

Conferência final: nenhuma escuta nas portas8080,5173 ou3100; Compose informa container exited(0). Nenhum volume, imagem ou dado foi apagado. O volume financeiro-java-lab_postgres_data mantém as migrations e os registros fictícios locais. O navegador pode mostrar conteúdo já carregado, mas os serviços estão parados.

## Backend concluído e comprovado

V1–V6: fundação/guard local, contas, categorias, lançamentos, regras, desejos/configurações e identidades/famílias. CRUDs, relatórios, planejamento anual, dívidas, CSV com prévia, onboarding JSON transacional, bootstrap consistente, lotes atômicos, repetição mensal e paginação estão implementados. Dinheiro usa BigDecimal. FKs compostos impedem referências entre famílias. Usuários e memberships atuais são conferidos por requisição, além do JWT.

JWT15min em memória, refresh opaco7dias em cookie HttpOnly/SameSiteStrict, rotação/revogação, BCrypt12/limite UTF-8, limitação local de tentativas, convites por token de uso único e permissões owner/member. Sem envio de e-mail. Sem vínculos, login/refresh criam família própria vazia; não readotam dados antigos. Chaves RSA são efêmeras por processo; testar operacionalmente refresh após reiniciar ainda é pendência.

| Execução | Resultado comprovado |
| --- | --- |
| backend-java/target/verify-modules-v5.log |238 unitários+255 integrações, zero falhas/erros/skips |
| backend-java/target/verify-auth-v6-fixed.log |248 unitários+282 integrações, zero falhas/erros/skips;12 casos de auth real |
| backend-java/target/verify-auth-pagination.log |248 unitários+19 integrações focadas, zero falhas/erros/skips;14 casos de auth e5CSV/bootstrap/lotes/paginação/repetição |
| Paridade financeira |3 fixtures congeladas fictícias compartilhadas TypeScript/Java aprovadas |
| Onboarding |15 casos de integração aprovados, incluindo rollback após SQL intermediário e duas importações concorrentes |

A paginação real mede exatamente2 statements para dados+count, busca literal com%/_, whitelist de ordenação e limites de página. Repetição preservaJan31→Fev29→Mar31 e deixa cópias futuras pendentes. Rebuild preserva IDs/pagamentos/histórico; startsAt/endsAt continuam informativos, como o gerador original, limitação documentada.

## Backend novo ainda sem validação Maven

O agente bootstrap_java terminou a matriz em novos arquivos do pacote relatorios: ConsultaMatriz, MatrizResposta, CalculosMatriz, MatrizService e MatrizController. Endpoint GET /api/reports/matrix. DTO: months,rows,cells,summaries,totals,cardCommitments. Célula vazia difere de registro com valor zero. Comprometimento global de cartões não fica limitado aos meses/filtros. Defaults usam fuso/critério familiar.

Golden separado matrix-parity.json e tests/javaMatrixParity.test.ts:4cenários TypeScript aprovados. Java:4golden,3service,9validação e6IT com auth real foram escritos, mas ainda NÃO executados. O JAR persistido da última execução não contém a matriz. Antes de novo verify, considerar Isolation.REPEATABLE_READ no MatrizService e RelatorioService para snapshot entre consultas; bootstrap já usa esse isolamento. Não alterar V1–V6 aplicadas.

## Nuxt experimental

Agente auditoria_dominio concluiu o modo NUXT_JAVA_LAB=1. Iniciador node scripts/java-react/nuxt-lab.mjs; loopback3100→Java8080. Bloqueio fora de dev, Supabase e seeds cortados no modo experimental, fila fictícia separada por usuário/família, JWT somente em memória e refresh HttpOnly. Adapter mescla alterações parciais e usa /api/legacy/.../batch transacional. Protege troca de identidade entre leitura e escrita. PWA, atualizações remotas e plataforma nativa ficam desativadas nesse modo.

Validação informada pelo agente:9 testes, nuxt prepare, npm run typecheck, vue-tsc, ESLint focado, sintaxe e bloqueio real de loadNuxtConfig com flag em produção aprovados. Documento05-nuxt-java-local.md. Ainda não houve E2E de login/cookie/proxy/CRUD Nuxt→Java. Não iniciar o Nuxt padrão sem isolamento, pois o fallback legado pode carregar dados pessoais.

## React atual

frontend-react está isolado, com package/lock próprios:React19.3.1, HeroUI3.2.6, Vite8.3.5, Router, TanStack Query, RHF/Zod e Tailwind4. Base visual em04-react-interface.md. App.tsx usa lazy loading por página. Token só na memória, refresh singleflight e cache limpo na troca de família/usuário. Backend é responsável pelos cálculos monetários.

Rotas já montadas: acesso/cadastro, dashboard, lançamentos, contas/cartões, categorias, recorrências, desejos, dívidas, planejamento e relatórios. Dashboard tem filtros individuais de fluxo/categorias/projeção/cartões/limites/mapa de despesas. Lista possui paginação no servidor, criação/edição/pagar/desfazer/excluir e repetição. Recursos usam formulários validados, confirmação e estados de carregamento/erro/vazio.

Primeiro build React passou em frontend-react/build.log, antes do lazy loading e das últimas telas. Aviso de bundle inicial grande:818.71KB/249.78KB gzip; medir novo build, não ocultar o aviso aumentando limite. Typecheck passou após a criação de pages/Planilha.tsx.19 testes dos modelos de recursos passaram.

pages/Planilha.tsx está escrito e compilou, mas NÃO está montado no App.tsx; depende da nova API matriz ainda sem Maven/build. Suporta abrir célula, editar/pagar/excluir e adicionar em célula vazia com rascunho. Reutiliza EditorLancamento, que ganhou prop rascunho opcional. Não afirmar que essa tela foi testada no navegador.

O agente auditoria_dominio estava escrevendo pages/Configuracoes.tsx, pages/Familia.tsx e importação. Os dois primeiros arquivos existem, mas NÃO estão no roteador. features/importacao/planilha.ts existe; pages/Importacao.tsx ainda não existia na pausa. Revisar integridade/exports antes de continuar. ExcelJS4.4.0 instalado somente no frontend, para import dinâmico. Helper original de workbook mistura Capacitor e tem divergência de cabeçalho na linha3; o parser React separado deve aceitar o modelo sem importar módulos nativos. Testar roundtrip de modelo vazio/preenchido.

Configurações precisam integração final de tema customizado com tokens e agendamento web global de notificações no Estrutura. Permissão/teste voluntário foi preparado pelo agente, mas agendamento global não estava integrado. Gestão de família precisa montar rota, testar seleção/membros/convites e limpar cache corretamente. Nunca persistir token de convite; exibir somente na criação/cópia.

## E2E e observação visual

frontend-react/playwright.config.ts e e2e/financeiro.spec.ts têm11cenários,1worker e apenas contas fictícias @example.test. Chromium headless requerido foi instalado. Os primeiros testes falharam antes de iniciar porque faltava executável; depois houve ajuste somente no helper de Select para o nome acessível real(valor antes do rótulo).

Último retorno confirmado do agente:7/11cenários aprovados somando rodadas — CRUD/pagar/desfazer, recorrência idempotente, desejos, isolamento familiar/logout, filtros de gráficos e320px claro/escuro. Os4visuais768/1440 estavam em execução/inspeção quando a pausa foi solicitada. Na conferência após interrupção, test-results/.last-run.json dizia passed, mas não foi reconstituído o total final das rodadas; não tratar esse arquivo isolado como prova de11/11. Consolidar relatório antes de afirmar conclusão.

Screenshots existem em frontend-react/test-results, subpastas por viewport/tema; relatório em frontend-react/playwright-report. O agente viu320px claro/escuro sem overflow global; demais inspeções manuais pendentes. Cadastro local fictício, painel e lançamentos claro/escuro foram observados no IAB, sem warn/error capturados. Não incluir credenciais ou tokens em documentação/outputs. Nenhum dado real foi utilizado.

## Ordem de retomada

1. Ler este arquivo, conferir git status e confirmar que os agentes continuam interrompidos. Não descartar alterações. Atualizar Goal somente após retomada explícita.
2. Consolidar os arquivos interrompidos e o relatório E2E. Backend: aplicar decisão de snapshot, executar verify com matriz, corrigir falhas e registrar contagens reais. Nenhuma instância Java pode manter o JAR aberto durante package/verify no Windows.
3. Subir ambiente controlado; montar Planilha/Configurações/Família/Importação no roteador; terminar Excel/CSV, tema e notificações. Validar Nuxt→Java em perfil fictício separado, sem Supabase/filas reais.
4. Executar regressões financeiras, E2E faltantes, claro/escuro/mobile, teclado/erros/rede e builds/typecheck/lint relevantes. Revisar advisories de dependências: agente informou5avisos npm, incluindo Zod4.4.3 high, Vitest4.1.5 moderate e ExcelJS→uuid8; não houve audit fix automático. Conferir versões/correções oficiais e uso afetado antes de concluir.
5. Atualizar ROADMAP, REQUISITOS, evidências e guia; concluir operação reproduzível, CI local independente e avaliação futura de hospedagem/SupabaseAuth/Capacitor, sem deploy. Fazer auditoria final de escopo e preservação do original antes de concluir o Goal.

## Comandos e cuidados para retomada autorizada

JDK21 instalado:C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot. JAVA_HOME herdado aponta para Android Studio removido. scripts/java-react/lab.ps1 valida bin/java.exe e lib/jvm.cfg e usa Java do PATH se a instalação estiver incompleta. Usa temporário curto C:\dev\planilha-java-tmp e restaura variáveis da sessão. Não modificar ambiente global.

Para validar backend, definir JAVA_HOME/JAVA_TOOL_OPTIONS na sessão e executar mvnw.cmd verify dentro de backend-java. Depois, scripts/java-react/lab.ps1 start -SemBuild inicia Compose e JAR já validado. Sem -SemBuild ele empacota novamente. Script stop preserva volume. Não executar reset/down-v ou apagar dados.

React:npm --prefix frontend-react run dev na5173; testes npm --prefix frontend-react run test:e2e. O Start-Process para Vite foi rejeitado pela aprovação automática; iniciar via sessão supervisionada exec_command/npm run dev funcionou. Não tentar contornar a revisão com outro launcher oculto.

Docker Desktop pode reincidir em erro de sockets Windows; workaround e backups estão em02-validacao-local.md. Não apagar VHDX/volumes. Produção, Android/dispositivo e deploy não foram homologados. A suíte Nuxt anterior tinha uma falha baseline em tests/deployment.test.ts:30(redirect já existente na main); preservar essa distinção e não alterar configuração de produção para fazer o teste passar.
