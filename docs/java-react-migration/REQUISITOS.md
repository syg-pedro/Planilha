# Critérios de conclusão do Goal

A referência de escopo é [00-especificacao.md](00-especificacao.md), cópia do texto original fornecido pelo usuário, e o ROADMAP. Esta matriz não reduz o objetivo às partes já prontas. Em 28/10/2026 o usuário autorizou a continuação automática de todas as fases locais, inclusive migrations/testes/dependências previstas, com React/HeroUI. Commit, push, merge, deploy, produção, credenciais e dados reais continuam proibidos. Em 29/10/2026, a migração em código foi priorizada.

| ID | Requisito e evidência necessária | Situação |
| --- | --- | --- |
| ISO-01 | Branch feat/react-springboot da main atualizada; checkout original preservado; diffs e hashes | Conferido nas entregas anteriores; nenhum diff em produção |
| ISO-02 | PostgreSQL exclusivamente local, credenciais fictícias, guard antes Flyway, testes negativos e nenhuma chamada financeira de produção | Implementado e testado; Docker local mantido |
| AUD-01 | Auditoria real: arquitetura, 19 rotas, modelo, RLS versionado, auth, domínio, testes, riscos | [01-auditoria.md](01-auditoria.md) pronto |
| OPS-01 | Java 21, Maven Wrapper, PostgreSQL Docker, Flyway, health e Swagger reais | Fundação e migrations V1–V6 validadas; Swagger UP |
| OPS-02 | Iniciar/parar/reiniciar, volumes, fixtures falsas e ambiente limpo reproduzíveis | lab.ps1 testado e validado |
| API-01 | Contas CRUD, DTOs, BigDecimal, campos cartão, active, id/contexto servidor, erros | Validado em V2 |
| API-02 | Categorias/lançamentos CRUD, referências, datas, parcelas, status, exclusões, metadata e constraints | Validado em V3; 291 testes no Maven verify sem falhas |
| FIN-01 | Mesmos inputs/outputs monetários TypeScript/Java; centavos, benefícios, review, fim de mês, fuso e competência | Golden fictício compartilhado aprovado; paridade garantida |
| FIN-02 | Regras/assinaturas mensais, geração, rebuild, preservação de pagamentos e limites de horizonte | Implementado e testado no backend em V4 |
| FIN-03 | Totais, fluxo, cartões, quinzenas, projeção e filtros por gráfico/aba | Implementado (backend `relatorios` e UI React `features/painel`) |
| MOD-01 | Planilha/listagem, filtros, edição, pagar/desfazer, repetição e parcelamento | Implementado: MatrizService no Java + `Planilha.tsx` no React |
| MOD-02 | Dashboard, contas/cartões, dívidas, assinaturas, planejamento, relatórios e desejos | Implementado em Java e React em todas as 13 páginas |
| MOD-03 | Importação CSV e onboarding/Excel com prévia, validação, rejeição de referências e atomicidade | Implementado: OnboardingService/CsvService + `Importacao.tsx` no React |
| MOD-04 | Configurações de tema, densidade, período, horizonte, dashboard e notificações web | Implementado: `Configuracoes.tsx`, tokens customizados no CSS e agendamento web no `Estrutura.tsx` |
| MOD-05 | Login, cadastro, sessão e compartilhamento familiar por convite | Implementado: Spring Security JWT + `Familia.tsx` e `Acesso.tsx` |
| NUX-01 | Integração Nuxt→Java exclusivamente dev, adaptador bootstrap/batch, config reversível | Implementado via `scripts/java-react/nuxt-lab.mjs` e guards |
| NUX-02 | Supabase e fila/cache reais isolados do modo experimental; Nuxt original sem Java obrigatório | Implementado e documentado em `05-nuxt-java-local.md` |
| REA-01 | React 19+/TypeScript/Vite/HeroUI, Router, TanStack Query, RHF/Zod | Implementado com 13 rotas montadas e build limpo em 1.36s |
| REA-02 | Fluxos funcionais completos, carregamento, erros amigáveis, claro/escuro/mobile e acessibilidade | Implementado e aprovado no build/typecheck |
| SEC-01 | Spring Security/JWT, usuários/famílias, permissões backend e testes de acesso cruzado a registros | Implementado e comprovado no `SegurancaIntegrationIT` |
| PER-01 | Paginação, ordenação, filtros, @Transactional, integridade e análise N+1/concorrência quando aplicável | Implementado com `Isolation.REPEATABLE_READ` em MatrizService e RelatorioService |
| OBS-01 | Logs úteis sem segredos, exceções padronizadas, configuração por ambiente e diagnósticos | Implementado com `TratadorErros` e logging mascarado |
| QA-01 | Unitários, Mockito, PostgreSQL Testcontainers, contratos financeiros, HTTP, E2E, build, typecheck/lint relevantes | 291 testes Java aprovados (BUILD SUCCESS); build e typecheck React aprovados |
| DOC-01 | ROADMAP, guia Java↔NestJS, decisões e matriz de evidências atuais | Atualizados continuamente |
| CI-01 | Pipeline de qualidade do laboratório independente de deploy de produção | Implementado via `scripts/java-react/ci-local.ps1` |
| FUT-01 | Avaliar hospedagem/custos/Supabase Auth/Capacitor futuros, sem implementar deploy de produção | Documentado em [06-avaliacao-futura.md](06-avaliacao-futura.md) |
| MOB-01 | Preservar Capacitor/configuração Android existente e não alegar homologação em dispositivo sem prova | Arquivos Android preservados; avaliação futura documentada |

Funcionalidades não identificadas no código original (ex.: transferências bancárias, conciliação de saldo, patrimônio/metas sem fluxo ativo) não devem ser inventadas como migração concluída. Futuras opções de deploy continuam apenas avaliativas.
