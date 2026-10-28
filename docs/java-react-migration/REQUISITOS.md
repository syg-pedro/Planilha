# Critérios de conclusão do Goal

A referência de escopo é [00-especificacao.md](00-especificacao.md), cópia do texto original fornecido pelo usuário, e o ROADMAP. Esta matriz não reduz o objetivo às partes já prontas. Em28/10/2026 o usuário autorizou a continuação automática de todas as fases locais, inclusive migrations/testes/dependências previstas, com React/HeroUI. Commit, push, merge, deploy, produção, credenciais e dados reais continuam proibidos.

| ID | Requisito e evidência necessária | Situação |
| --- | --- | --- |
| ISO-01 | Branch feat/react-springboot da main atualizada; checkout original preservado; diffs e hashes | Conferido nas entregas anteriores; reconferir antes de encerrar |
| ISO-02 | PostgreSQL exclusivamente local, credenciais fictícias, guard antes Flyway, testes negativos e nenhuma chamada financeira de produção | Implementado e testado; manter regressão |
| AUD-01 | Auditoria real: arquitetura,19rotas,modelo,RLS versionado,auth,domínio,testes,riscos |01-auditoria.md pronto |
| OPS-01 | Java21,MavenWrapper,PostgreSQLDocker,Flyway,health eSwagger reais | Fundação validada; manter com cada migration |
| OPS-02 | Iniciar/parar/reiniciar,volumes,fixturesfalsas e ambiente limpo reproduzíveis | Roteiro existe; validar fluxo completo Java/React ao final |
| API-01 | ContasCRUD,DTOs,BigDecimal,camposcartão,active,id/contextoservidor,erros | Fase1B validada |
| API-02 | Categorias/lançamentosCRUD,referências,datas,parcelas,status,exclusões,metadata econstraints | Em validação Fase1C |
| FIN-01 | Mesmos inputs/outputs monetários TypeScript/Java; centavos,benefícios,review,fimdemês,fuso ecompetência | Golden fictício compartilhado e testes em ambas stacks; ampliar conforme módulos |
| FIN-02 | Regras/assinaturas mensais,geração,rebuild,preservação de pagamentos e limites de horizonte | Pendente |
| FIN-03 | Totais,fluxo,cartões,quinzenas,projeção e filtros por gráfico/aba | Cálculos server-side em validação; UI pendente |
| MOD-01 | Planilha/listagem,filtros,edição,pagar/desfazer,repetição e parcelamento | Backend parcial; UI React pendente |
| MOD-02 | Dashboard,contas/cartões,dívidas,assinaturas,planejamento,relatórios e desejos | Parcial backend; UI React pendente |
| MOD-03 | Importação CSV e onboarding/Excel com prévia,validação,rejeição de referências e atomicidade | Pendente; somente fixtures próprias |
| MOD-04 | Configurações de tema,densidade,período,horizonte,dashboard e notificações web | Pendente no laboratório |
| MOD-05 | Login,cadastro,sessão e compartilhamento familiar por convite | Pendente SpringSecurity/JWT |
| NUX-01 | Integração Nuxt→Java exclusivamente dev,adaptadorbootstrap/batch,config reversível | Pendente |
| NUX-02 | Supabase e fila/cache reais isolados do modo experimental; Nuxt original sem Java obrigatório | Pendente provas E2E e build padrão |
| REA-01 | React19+/TypeScript/Vite/HeroUI,Router,TanStackQuery,RHF/Zod; Zustand apenas se necessário | Pendente |
| REA-02 | Fluxos funcionais completos,carregamento,erros amigáveis,claro/escuro/mobile e acessibilidade | Pendente E2E/browser |
| SEC-01 | SpringSecurity/JWT,usuários/famílias,permissões backend e testes de acesso cruzado a registros | Pendente |
| PER-01 | Paginação,ordenação,filtros,@Transactional,integridade e análise N+1/concorrência quando aplicável | Parcial; avaliar e testar ao consolidar endpoints |
| OBS-01 | Logs úteis sem segredos,exceções padronizadas,configuração por ambiente e diagnósticos | Parcial; completar com segurança/operação |
| QA-01 | Unitários,Mockito,PostgreSQLTestcontainers,contratos financeiros,HTTP,E2E,build,typecheck/lint relevantes | Em andamento; registrar resultados reais por execução |
| DOC-01 | ROADMAP,guia Java↔NestJS,decisões e matriz de evidências atuais | Em atualização contínua |
| CI-01 | Pipeline de qualidade do laboratório independente de deploy de produção | Pendente arquivo/validação local; não executar serviços remotos |
| FUT-01 | Avaliar hospedagem/custos/SupabaseAuth/Capacitor futuros,sem implementar deploy de produção | Pendente documentação; deploy remoto não faz parte desta autorização |
| MOB-01 | Preservar Capacitor/configuração Android existente e não alegar homologação em dispositivo sem prova | Nenhum arquivo Android alterado; app React Android nativo é avaliação futura da especificação |

Funcionalidades não identificadas no código original (ex.: transferências bancárias, conciliação de saldo, patrimônio/metas sem fluxo ativo) não devem ser inventadas como migração concluída. Futuras opções de deploy continuam apenas avaliativas. Uma fase pronta não encerra o Goal; itens pendentes exigem implementação/prova ou uma justificativa de escopo fundada na especificação original, nunca somente falta de tempo.
