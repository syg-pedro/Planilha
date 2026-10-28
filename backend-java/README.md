# Backend Java do laboratório

Base independente em Java 21, Spring Boot 3.5.16 e Maven Wrapper 3.9.11. Implementa contas, categorias, lançamentos, relatórios, regras, desejos, configurações, importações e JWT/famílias no PostgreSQL local. A matriz registra quais módulos já passaram por integração real.

## Executar no PowerShell

Pré-requisitos: Java 21 no `JAVA_HOME` e Docker Desktop com engine Linux iniciada. Os comandos partem da raiz deste worktree.

### Ajuste necessário neste Windows

Nesta máquina, o diretório temporário padrão provoca `Unable to establish loopback connection` no Java NIO. Um diretório curto resolveu a inicialização do Tomcat e os testes. Configure somente o terminal que executará o Java; não é necessário alterar o ambiente global:

```powershell
New-Item -ItemType Directory -Path 'C:\dev\planilha-java-tmp' -Force
```

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
```

```powershell
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=C:/dev/planilha-java-tmp -Djava.io.tmpdir=C:/dev/planilha-java-tmp'
```

O caminho do JDK acima corresponde à instalação desta máquina; adapte em outra instalação. As opções também são herdadas pelo processo de teste do Maven. Em máquinas sem essa falha, o diretório padrão pode ser mantido.

### Iniciar os serviços

```powershell
docker compose -f infra/dev/compose.yaml up -d --wait
```

```powershell
Set-Location backend-java
```

```powershell
.\mvnw.cmd spring-boot:run
```

Abra [a verificação de saúde](http://127.0.0.1:8080/api/health) e [o Swagger](http://127.0.0.1:8080/swagger-ui/index.html). O contrato de sucesso é `{"status":"UP","database":"UP","environment":"local-demo"}`. A resposta só é saudável se a tabela técnica criada pelo Flyway estiver acessível e tiver o marcador fictício esperado.

Se `JAVA_HOME` apontar para uma instalação removida, ajuste somente a sessão do terminal para seu JDK 21 instalado antes de executar Maven. O wrapper não instala Java e baixa a distribuição Maven na primeira execução.

## Testar

```powershell
.\mvnw.cmd test
```

Testes unitários verificam isolamento de ambiente, saúde, validação, normalização de contas, preservação de estado e tratamento seguro de erros. Não acessam banco.

```powershell
.\mvnw.cmd verify
```

`verify` também executa os testes IntegrationIT pelo Failsafe. Testcontainers cria PostgreSQL17 descartável com banco `financeiro_lab_test`, aplica todas as migrations e testa CRUD HTTP, validação, precisão monetária, constraints e OpenAPI/Swagger. Sem Docker, a integração falha sem descarte silencioso. A limpeza dos testes confere o nome do banco descartável antes de excluir registros fictícios.

No Windows, pare a API iniciada pelo JAR antes de empacotar novamente com package/verify: o processo mantém o arquivo aberto e pode bloquear o reempacotamento. O processo de desenvolvimento spring-boot:run pode ser encerrado com Ctrl+C no terminal em que foi iniciado.

```powershell
.\mvnw.cmd package
```

```powershell
java -jar target/financeiro-lab-0.0.1-SNAPSHOT.jar
```

## Isolamento

`application.yaml` utiliza o perfil padrão `local`, escuta somente em `127.0.0.1:8080` e conecta a `127.0.0.1:55432/financeiro_lab` com credenciais exclusivamente fictícias. O perfil `test` serve ao Testcontainers. Nenhuma variável Supabase, arquivo `.env` da aplicação Nuxt ou seed existente é utilizado.

`LocalEnvironmentInitializer`, registrado em `META-INF/spring.factories`, rejeita configurações incompatíveis antes da criação do datasource e da execução do Flyway. Somente um perfil `local` ou `test` é permitido. A URL JDBC precisa apontar para `localhost` ou `127.0.0.1`, com porta explícita, banco `financeiro_lab` ou `financeiro_lab_test` e sem parâmetros extras. Overrides externos de JDBC do Hikari e Flyway também são rejeitados. Datasource alternativo via JNDI ou classe Hikari, propriedades JDBC adicionais e propriedades avançadas do JPA são recusados nesta etapa. O bind precisa continuar em `127.0.0.1`, o Hibernate precisa usar `validate`, a geração automática de DDL e a inicialização SQL precisam estar desativadas e o Flyway precisa manter `clean` bloqueado.

Spring Security protege os endpoints financeiros. Cadastro cria usuário e família fictícios vazios; nenhum usuário financeiro é criado automaticamente. JWT válido precisa corresponder a usuário ativo, sessão ativa e vínculo familiar atual no banco. O contexto local-demo permanece apenas como registro genérico para demonstração/testes; não é um fallback de acesso autenticado. O guard de loopback/perfis/banco continua obrigatório mesmo com autenticação.

## Autenticação e famílias

POST /api/auth/register recebe name/email/password/familyName. POST /login recebe email/password. Ambos retornam accessToken/expiresAt/user/family e cookie HttpOnly finance-java-lab-refresh, SameSite Strict, Path /api/auth. Access token dura15min e fica somente na memória dos frontends; refresh opaco dura7dias, com hash no banco e rotação. POST /refresh exige X-Requested-With:FinanceiroLab e origem permitida; POST /logout revoga a sessão e remove o cookie. GET /me devolve usuário/família atuais. Senhas usam BCrypt12, limite também em bytes UTF-8 e limitação local de tentativas. Credenciais nunca pertencem a logs ou storage do navegador.

GET /api/families lista vínculos; POST /select com id troca a família ativa e emite novo access token. /api/families/members e /invitations permitem consulta e gestão conforme owner/member. Aceitar convite usa token opaco de uso único, e-mail correspondente e prazo; somente o hash é persistido. Criar convite não envia e-mail. Remoção protege o último proprietário e invalida acesso aos dados da família removida. Sem nenhum vínculo, login/refresh criam uma família própria vazia, sem readotar registros antigos.

Chaves RSA do JWT são efêmeras por processo no laboratório. Reiniciar invalida o access token anterior; a implementação permite renovar pelo refresh persistido. O fluxo de reinício ainda precisa da prova operacional/E2E. Cookies sem Secure são limitados a HTTP loopback; a configuração atual não é uma configuração de deploy externo.

V6 acrescenta identidades, sessões, famílias, membros e convites. Substitui os CHECKs de família fixa por FKs e usa FKs compostos para impedir referências financeiras entre famílias também no PostgreSQL. SET NULL remove somente account_id/category_id/rule_id, preservando household_id. Os testes antigos usam um contexto e chain explícitos somente em src/test; SegurancaIntegrationIT executa autenticação real sem esse bypass.

## Lotes e paginação

GET /api/bootstrap devolve o contrato inicial de contas/categorias/regras/lançamentos/configurações/KPIs numa transação REPEATABLE_READ. POST /api/legacy/{accounts,entries,rules,wishlist}/batch recebe upserts[{id opcional,data:DTO completo}] e deletes[]; até1000 operações de cada tipo, uma operação por ID e rollback integral em falha. IDs de novos registros são gerados pelo servidor; o adapter Nuxt traduz os IDs temporários e merge parcial, sem alterar a API original do Nitro.

GET /api/entries/page aceita page>=0,size1–100,sort date_asc/date_desc/amount_desc e filtros de datas, critério, conta, categoria, tipo, situação e descrição. Ordenação usa whitelist e ID como desempate. A consulta pagina no banco, incluindo count com os mesmos filtros e contexto familiar. Teste real mede duas consultas SQL para página e contagem, sem N+1. POST /api/entries/repeat recebe entry e months1–120, preserva o dia original com clamp mensal e deixa cópias posteriores pendentes, em uma transação.

## Migrations

`V1__initialize_lab.sql` cria `lab_metadata` com o marcador `local-demo`. `V2__create_accounts.sql` cria `accounts`, com precisão NUMERIC(14,2) e restrições para contexto, tipos, dias e campos de cartão. Nenhuma migration importa dados reais. Flyway aplica versões pendentes ao iniciar a aplicação ou a integração; Hibernate somente valida o schema. V1 permanece intacta.

## API de contas

| Operação | Resultado |
| --- | --- |
| GET /api/accounts | 200, {accounts:[...]}, incluindo ativas e inativas, ordenadas por nome/ID |
| GET /api/accounts/{id} | 200 com a conta; ausente404 |
| POST /api/accounts | 201, Location e a conta criada |
| PUT /api/accounts/{id} | 200; não cria conta ausente, que retorna404 |
| DELETE /api/accounts/{id} | 204; ausente404 |

Exemplo fictício para o Swagger:

```json
{"name":"Cartão de demonstração","owner":"Pessoa fictícia","type":"credit_card","limitTotal":1234.56,"closingDay":28,"dueDay":5,"active":true}
```

Tipos: bank, credit_card, benefit e external. Nome é obrigatório e aceita até100 caracteres; responsável é opcional e aceita até80. Limite aceita null ou decimal não negativo com até12 inteiros e2casas; dias aceitam null ou inteiro1–31. Cartão pode fechar28 e vencer5. Ao mudar para outro tipo, limite/dias são limpos. Active omitido cria conta ativa; em PUT, mantém o estado existente. Os campos editáveis name/type continuam obrigatórios no PUT.

ID e householdId não são aceitos no corpo: o servidor gera a identidade e fixa o contexto local. JSON inválido, campos desconhecidos, números enviados como texto, dias fracionários e precisão excedente retornam400. Erros seguem {code,message,fields}, com mensagens amigáveis e sem SQL/stacktrace na resposta. DELETE é exclusão física, não inativação; referências de lançamentos/regras usam SET NULL, preservando os registros financeiros.

## Módulos complementares

Categorias, lançamentos, regras e desejos têm GET coleção, GET/id, POST, PUT/id e DELETE/id. As coleções são envelopadas em categories, entries, rules e items. POST cria IDs no servidor. POST /api/rules/rebuild aceita months opcional1–120 e reconcilia somente automáticos não pagos no horizonte, preservando IDs, pagamentos e histórico. Datas startsAt/endsAt são armazenadas, mas não limitam geração, reproduzindo o gerador TypeScript original; essa limitação funcional deve ser tratada como evolução explícita.

GET /api/reports/summary aceita intervalo inclusivo, due_date/competence e filtros de conta, categoria, tipo, situação e busca. Retorna totais, KPIs, fluxo, cartões e quinzenas. Cada chamada possui seus próprios filtros. Contas de benefício e excludeFromCalc ficam fora dos indicadores de caixa. Os três cenários congelados em src/test/resources/parity/finance-parity.json são conferidos também pelo Vitest original, sem acessar seeds pessoais.

GET/PUT /api/settings e POST /api/settings/theme, /dashboard e /api/onboarding/state persistem preferências locais. A V5 inicializa apenas configurações genéricas. Não cria contas, categorias, regras ou lançamentos.

POST /api/import/csv/preview valida sem escrita. POST /api/import/csv importa linhas válidas e devolve inserted/warnings, em uma transação. Aceita vírgula/ponto-e-vírgula, aspas, BOM, decimal brasileiro, data ISO/datetime ISO real ou dd/MM/yyyy. Valor positivo significa despesa e negativo receita, como no original. Rejeita formatos ambíguos em vez de truncar valor com parseFloat. Limites:1048576 caracteres e1000 linhas. POST /api/onboarding/import/preview e /import validam JSON de planilha com referências por nome normalizado e importam somente em contexto sem dados financeiros; o import bloqueia configurações para serializar concorrentes.

## Decisões

Controllers delegam a services injetados pelo construtor. O health consulta o marcador usando JdbcTemplate. Contas usam entidade JPA, repository e transações; a API devolve records, sem expor a entidade. BigDecimal preserva os valores monetários e a entrada rejeita excesso de precisão sem arredondar. ConfiguracaoJson impede coerções silenciosas e TratadorErros centraliza as respostas. Swagger é gerado por springdoc2.10.0. Os contratos e limites aprovados estão em [03-contas-contrato.md](../docs/java-react-migration/03-contas-contrato.md).

Referências: [requisitos do Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html), [compatibilidade do springdoc 2.x](https://springdoc.org/v2/#what-is-the-compatibility-matrix-of-springdoc-openapi-with-spring-boot), [Maven Wrapper](https://maven.apache.org/wrapper/) e [Testcontainers PostgreSQL](https://java.testcontainers.org/modules/databases/postgres/).
