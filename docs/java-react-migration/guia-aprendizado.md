# Java e Spring Boot a partir de TypeScript e NestJS

O laboratório implementa health e CRUD de contas fictícias. A fundação local foi seguida pela Fase1B; lançamentos e autenticação ainda não foram implementados.

## O caminho de uma requisição

`GET /api/health` → `HealthController` → `HealthService` → `JdbcTemplate` → marcador fictício criado pelo Flyway no PostgreSQL local.

O controller descreve a interface HTTP. O service verifica a condição necessária à resposta. A conexão usa a configuração Spring; o código não conhece Supabase ou a API Nitro. Health não é um dashboard financeiro nem um CRUD.

Para contas: POST /api/accounts → ConfiguracaoJson → ContaRequisicao validada → ContaController → ContaService transacional → ContaRepository/JPA → PostgreSQL → ContaResposta. A fronteira JSON rejeita coerções e campos desconhecidos. O service normaliza campos de cartão e preserva active quando omitido na edição. O repository busca por ID e contexto familiar local.

## Correspondências úteis

| NestJS/TypeScript | Java/Spring | Papel |
| --- | --- | --- |
| `@Controller` | `@RestController` | Receber HTTP e serializar resposta |
| `@Get` | `@GetMapping` | Associar método/rota ao handler |
| `@Injectable` | `@Service` | Registrar serviço para injeção |
| Provider/injeção pelo constructor | Bean/injeção pelo construtor | Receber dependências já configuradas |
| DTO + ValidationPipe | Record/classe + Jakarta Validation + `@Valid` | Contrato e validação na entrada HTTP |
| Prisma client/repository | Spring Data JPA/Hibernate | Persistência de entidades e consultas |
| Prisma migrations | Flyway SQL versionado | Evoluir schema com histórico |
| Exception Filter | `@RestControllerAdvice` | Traduzir exceção para contrato HTTP |
| Guard | Spring Security | Autenticar e autorizar requisições |
| Jest/Vitest | JUnit 5/Mockito | Executar casos e substituir dependências |
| ConfigService | Environment e configuration properties | Resolver configuração por ambiente |

As equivalências orientam o aprendizado; não significam funcionamento idêntico.

## Anotações e inicialização

Uma anotação como `@Service` é metadado lido pelo Spring. Não é uma chamada de função JavaScript. `@SpringBootApplication` habilita configuração automática e procura componentes a partir do pacote da aplicação.

`FinanceiroApplication.main` inicia o processo. O initializer de ambiente é registrado em `META-INF/spring.factories` e roda antes de criar os beans da aplicação. Isso permite rejeitar uma configuração externa antes de inicializar a conexão e executar Flyway. Um `ApplicationRunner` rodaria tarde demais para essa proteção.

Perfil é uma seleção de configuração, não uma fronteira de segurança suficiente. Por isso o laboratório também verifica URL efetiva do banco, bind HTTP e alternativas perigosas de configuração. O modo local sem autenticação não pode ser reutilizado em um deploy.

Pergunta de entrevista: por que uma validação de segurança em um runner pode ocorrer depois de uma migration? Explique a ordem de inicialização do contexto.

## Classes, records e interfaces

Classe combina estado e comportamento. `HealthService` recebe dependências no construtor e oferece uma operação ao controller.

Record declara um conjunto de dados imutável, com construtor, acessores, equals/hashCode e representação gerados pelo compilador. `HealthResponse` é um contrato de saída. Um `interface` TypeScript desaparece no JavaScript gerado; uma interface Java existe no bytecode e define um contrato de métodos.

ContaRepository é uma interface que estende JpaRepository<Conta,String>. Spring Data cria sua implementação, inclusive das consultas declaradas em JPQL. Os tipos genéricos representam entidade e chave; a chave é String porque o contrato atual permite prefixos, não apenas UUID puro. O health continua com JDBC simples, sem uma interface artificial para envolver a consulta.

Pergunta: por que um record é adequado a um DTO de saída, mas uma entidade JPA tem exigências de construção e identidade diferentes?

## Injeção de dependência

O Spring cria o service e fornece o JdbcTemplate configurado. O controller recebe o service no construtor. É o mesmo objetivo da injeção no Nest: o objeto declara do que precisa sem construir dependências ou buscar singletons globais.

Nos testes unitários, Mockito substitui a dependência. Assim é possível verificar resposta em caso de banco indisponível sem abrir uma conexão. O teste de integração usa o objeto real e um PostgreSQL real descartável.

Pergunta: qual a diferença entre testar um service com mock e provar que a configuração JDBC, Flyway e HTTP funcionam juntos?

## Maven, dependências e JUnit

`pom.xml` descreve dependências e plugins. O parent Spring Boot alinha versões compatíveis; isso evita escolher separadamente versões de Hibernate e bibliotecas gerenciadas. Maven Wrapper fixa o Maven do projeto, sem depender de instalação global.

`test` executa testes unitários via Surefire. `verify` também executa testes de integração via Failsafe, quando configurado. A ausência de Docker deve falhar a integração de forma visível, e não produzir aprovação com teste ignorado.

Spring Boot 3.5 foi escolhido como linha estável compatível com Java 21 e o requisito JUnit 5. Não se trata de afirmar que é a linha estável mais recente. [Requisitos oficiais](https://docs.spring.io/spring-boot/3.5/system-requirements.html). Springdoc usa a linha compatível com Boot 3, conforme [matriz oficial](https://springdoc.org/v2/).

## Flyway, JPA e Hibernate

Flyway aplica arquivos `V1__...sql`, `V2__...sql` em ordem e registra versões/checksums no banco. Modificar uma migration já aplicada pode causar divergência de checksum. Evoluções devem ser novas migrations.

JPA é a especificação de mapeamento objeto-relacional. Hibernate é uma implementação. Spring Data JPA reduz o código de repositories. Conta é a entidade persistida; suas colunas usam snake_case no PostgreSQL. ContaRequisicao e ContaResposta são records separados, com camelCase no HTTP. A entidade não é serializada diretamente.

O schema é criado pelo Flyway. Hibernate fica em validate, sem gerar ou atualizar tabelas automaticamente. V1 cria metadados fictícios; V2 cria accounts e suas restrições. Nenhuma migration Supabase é copiada, inclusive porque o histórico atual contém prefixos duplicados e conteúdo específico do ambiente original.

ContaService usa @Transactional(readOnly=true) como padrão e @Transactional nas gravações. O Spring abre a transação ao invocar o service pelo bean; repository.save/delete participam dela. Isso equivale à intenção de uma operação transacional no Prisma, mas a implementação usa proxy e contexto do Spring. Atomicidade não elimina automaticamente conflitos concorrentes; versionamento fica para quando houver necessidade demonstrada.

BigDecimal em limitTotal evita operações intermediárias em double. @Digits(12,2) valida a entrada antes da persistência em NUMERIC(14,2). A API rejeita excesso de casas, pois o PostgreSQL pode arredondar valores enviados diretamente para uma coluna com escala fixa. A validação HTTP e a integridade no banco têm papéis complementares.

Pergunta: por que `ddl-auto=update` não substitui um histórico de migrations revisável?

## Exceptions e respostas HTTP

Java possui exceções verificadas pelo compilador e exceções de runtime. Spring traduz diversas falhas JDBC em `DataAccessException`, uma exceção de runtime. O health deve responder indisponibilidade sem enviar detalhes da conexão para o cliente.

TratadorErros é um @RestControllerAdvice baseado em ResponseEntityExceptionHandler. Validação/corpo inválido retornam400; registro ausente404; métodos incompatíveis preservam405; falhas inesperadas retornam500 com mensagem genérica. O corpo tem code, message e fields. O detalhe técnico vai para o log, sem refletir SQL, valores rejeitados ou stacktrace para o cliente. Isso corresponde ao papel de um Exception Filter do NestJS.

Pergunta: quais detalhes pertencem ao log e quais pertencem à mensagem ao usuário?

## Conceitos implementados e próximos passos

| Conceito | Aplicação prevista |
| --- | --- |
| BigDecimal | Implementado no limite das contas, com validação12,2 e persistência decimal; usar texto/decimal, evitando conversão binária intermediária |
| LocalDate e Clock | Vencimento/competência sem hora e cálculos determinísticos, com fuso familiar explícito |
| Generics | Implementado em JpaRepository<Conta,String>, expressando entidade e chave |
| Streams | Implementado no mapeamento de entidades para DTOs da listagem; não é requisito para todo loop |
| `@Transactional` | Implementado no service de contas; transações de leitura e de gravação têm intenções diferentes |
| Spring Security/JWT | Validar identidade e autorização por família e registro; token válido sozinho não autoriza qualquer ID |
| Paginação/N+1 | Limitar consultas e observar SQL real antes de otimizar |

LocalDate/Clock, Spring Security e paginação permanecem planejados. O contexto local-demo desta fase é uma demonstração, não uma autorização por usuário. Perguntas para a etapa seguinte: como impedir vínculo com conta de outra família? O que ocorre ao excluir uma conta usada? Como somar centavos sem divergência? Como testar o último dia de fevereiro e a virada UTC?

## Como estudar esta entrega

1. Leia a auditoria para entender o contrato original e seus limites.
2. Abra application.yaml e o initializer para entender a proteção antes do banco.
3. Siga health e contas do controller até o service, repository e migrations.
4. Compare o teste unitário com o teste de integração.
5. Execute o roteiro do README do backend quando Docker estiver operacional.

Comandos, resultados efetivos e impedimentos ficam no [README do backend](../../backend-java/README.md) e em [evidencias.md](evidencias.md).

## Datas e equivalência financeira implementadas

LocalDate representa vencimento/competência sem hora, como uma string YYYY-MM-DD validada no TypeScript. Instant representa auditoria; Clock injetado permite trocar o relógio nos testes sem mockar funções globais. UTC define o horizonte de recorrência e America/Sao_Paulo define os ciclos de pagamento. Essas escolhas têm testes em limites de fevereiro, ano e meia-noite.

BigDecimal.compareTo compara valor monetário sem depender de escala (0.1 e0.10). A entrada permite até duas casas sem arredondamento; operações de somatório permanecem decimais. Um JSON fictício congelado alimenta Java e TypeScript; atualizar a implementação não atualiza automaticamente a expectativa. Isso impede um teste que apenas repita a própria implementação.

ON DELETE SET NULL preserva o lançamento ao apagar sua conta/categoria/regra. O DTO expõe IDs; não há carregamento implícito de coleções JPA no mapeamento. Rebuild transacional concilia por regra/data e preserva lançamentos pagos. A importação inicial bloqueia a configuração com SELECT FOR UPDATE antes de verificar ausência de dados; somente um import pode atravessar essa verificação por vez. A prova de concorrência/rollback exige PostgreSQL real, além dos mocks de ordem de chamada.

Perguntas de entrevista: por que Date/Instant não substituem LocalDate? Como impedir duas importações simultâneas de passarem pela mesma checagem? Por que preservar identidade de um lançamento ao reconstruir recorrências? Qual a diferença entre uma constraint e a validação de um DTO?

## Segurança familiar implementada

SecurityFilterChain equivale à composição de middleware/guards do NestJS antes do controller. O resource server valida assinatura, issuer, audience, prazo e sessão do JWT. ContextoFamiliaAutenticado, com escopo de requisição, confirma usuário e membership atuais no banco; não basta aceitar o householdId de um corpo ou claim isolado. Serviços recebem essa porta por construtor. Testes unitários injetam uma implementação explícita, enquanto a integração de segurança usa o fluxo real.

BCrypt é um hash de senha com custo ajustável; o valor persistido não permite recuperar a senha. Tokens de refresh/convite são aleatórios e só seu hash é salvo. Refresh rotaciona sob lock da sessão; aceitar/revogar convite usa bloqueios em ordem consistente. Cookie HttpOnly impede leitura pelo JavaScript; SameSite e validação de origem/marcador protegem a operação de refresh. JWT fica em memória, separado do cookie. O cache do frontend é limpo na troca de família ou usuário.

FK simples por ID não prova que duas entidades pertencem à mesma família. V6 usa chaves únicas(household_id,id) e FKs compostos para essa regra. PostgreSQL17 permite SET NULL somente na coluna da referência, preservando o household_id obrigatório. A proteção no service fornece erro amigável; a constraint continua protegendo contra gravação direta inconsistente.

JpaSpecificationExecutor monta predicates Criteria com parâmetros e contexto familiar obrigatório. PageRequest limita o resultado no PostgreSQL; Sort usa campos internos de uma whitelist. A API retorna um record de página, sem expor entidades. O teste mede statements SQL da requisição, pois observar poucos objetos na tela não prova ausência de N+1.

Perguntas de entrevista: JWT resolve revogação sozinho? Por que HttpOnly não substitui proteção contra CSRF? Como impedir que um usuário autenticado acesse uma conta de outra família? Por que uma checagem antes do INSERT não elimina uma corrida? Como comprovar que paginação acontece no banco?
