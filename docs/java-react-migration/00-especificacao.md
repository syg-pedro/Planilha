# PROJETO: FINANCEIRO FAMILIAR — LABORATÓRIO FULL STACK JAVA + REACT

## 1. CONTEXTO E OBJETIVO

Você atuará como um engenheiro de software sênior, arquiteto de soluções e mentor técnico especializado em:

* Java
* Spring Boot
* Spring Security
* Spring Data JPA
* Hibernate
* PostgreSQL
* React
* TypeScript
* Arquitetura de software
* Desenvolvimento Full Stack
* Testes automatizados
* Docker
* CI/CD

Nosso objetivo é transformar o projeto Financeiro Familiar em um laboratório de desenvolvimento Full Stack utilizando Java + Spring Boot + React + TypeScript.

Entretanto, existe uma exigência fundamental:

**A aplicação atual em produção NÃO DEVE SER ALTERADA OU PREJUDICADA.**

O projeto atual é utilizado para gerenciamento financeiro real e precisa continuar funcionando normalmente.

A nova stack será implementada inicialmente apenas para desenvolvimento, aprendizado e testes locais.

Também existe um objetivo profissional: desenvolver as competências técnicas exigidas para atuar como desenvolvedor Full Stack Java + React em empresas como a SoftDesign, incluindo conhecimentos associados à atuação de nível Pleno.

Portanto, este projeto não é apenas uma migração tecnológica.

É um projeto de aprendizado prático, evolução arquitetural e preparação profissional.

---

# 2. REPOSITÓRIO EXISTENTE

Repositório GitHub:

https://github.com/syg-pedro/Planilha

Antes de realizar alterações, analise profundamente a implementação atual.

A stack conhecida inclui:

### Frontend

* Nuxt 4
* Vue 3
* TypeScript
* Pinia
* Tailwind CSS
* Nuxt UI

### Backend

* Nitro API
* TypeScript
* Integração com Supabase

### Banco de dados

* Supabase
* PostgreSQL

### Aplicativo Android

* Capacitor

### Testes

* Vitest
* Playwright

### Infraestrutura

* Vercel
* Supabase

Existem diretórios e arquivos relevantes, incluindo:

```text
app/
  features/
    finance/
      components/
      composables/
      stores/
      utils/

server/
  api/
    accounts/
    entries/
    rules/
    settings/
    wishlist/

  utils/
    repo.ts

shared/
  types/
  rules.ts

supabase/
  migrations/

tests/
e2e/
```

Essa estrutura é uma referência inicial.

**Não presuma que a documentação representa exatamente a implementação atual.**

Inspecione os arquivos reais, as rotas, os tipos, as migrations, os testes e os fluxos de autenticação antes de definir a arquitetura experimental.

Verifique também `AGENTS.md`, `CLAUDE.md` e as demais instruções existentes no repositório, identificando eventuais divergências entre documentação e código.

---

# 3. REGRA ABSOLUTA: PROTEGER A PRODUÇÃO

O projeto atual está em produção.

A versão experimental precisa ser isolada.

## Branch de desenvolvimento

Utilize a branch:

`feat/react-springboot`

Caso ela ainda não exista, crie-a a partir da versão atualizada da `main`.

Antes disso:

1. Verifique o estado do Git.
2. Identifique alterações locais não commitadas.
3. Não descarte nem sobrescreva alterações existentes.
4. Verifique como o repositório está integrado ao Vercel.
5. Confirme que commits na branch experimental não provocarão alterações na aplicação de produção.

A `main` deverá continuar funcionando normalmente.

Não realize merge automático.

Não faça deploy de produção.

Não altere configurações da infraestrutura de produção sem autorização explícita.

## Isolamento do banco de dados

O Supabase atual possui dados financeiros reais.

**É proibido executar operações experimentais ou destrutivas no banco de produção.**

Na fase inicial:

* Utilize PostgreSQL local com Docker.
* Crie um banco específico para desenvolvimento.
* Utilize credenciais exclusivamente locais.
* Não utilize a service role key de produção.
* Não execute migrations na instância de produção.
* Não copie automaticamente informações financeiras reais.
* Gere dados fictícios para os testes.
* Não reutilize arquivos de seed existentes sem verificar se contêm dados pessoais.

A nova aplicação deverá funcionar integralmente no ambiente local.

O uso do PostgreSQL local deve permitir desenvolver sem consumir recursos adicionais do Supabase.

## Preservação das funcionalidades

Não remova nem altere funcionalidades existentes da aplicação original.

Preserve:

* Nuxt.
* Vue.
* Nitro.
* Pinia.
* Supabase.
* Capacitor.
* Configurações do Android.
* Integração atual com Vercel.
* Fluxos de autenticação existentes.
* Testes automatizados existentes.

Toda a implementação Java/React deverá ocorrer inicialmente de forma paralela.

---

# 4. ARQUITETURA EXPERIMENTAL

A arquitetura desejada é:

```text
FINANCEIRO FAMILIAR
Branch: feat/react-springboot

├── app/
│   └── Frontend Nuxt atual
│
├── server/
│   └── Backend Nitro atual
│
├── shared/
│   └── Tipos e regras existentes
│
├── backend-java/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── README.md
│
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── pages/
│   │   └── types/
│   └── package.json
│
├── infra/
│   └── dev/
│       └── compose.yaml
│
└── docs/
    └── java-react-migration/
```

A estrutura é uma proposta.

Analise as convenções existentes antes de adotá-la.

Não crie diretórios ou camadas sem necessidade técnica.

Prefira uma arquitetura modular, organizada, testável e de manutenção simples.

---

# 5. STACK DA NOVA IMPLEMENTAÇÃO

## Backend

Utilizar:

* Java 21 LTS.
* Spring Boot em versão estável compatível.
* Spring Web.
* Spring Data JPA.
* Hibernate.
* Spring Validation.
* Spring Security, quando iniciarmos a etapa de autenticação.
* PostgreSQL.
* Flyway para migrations.
* Maven.
* JUnit 5.
* Mockito.
* Testcontainers, quando apropriado.
* OpenAPI/Swagger.

Priorize boas práticas atuais do ecossistema Spring.

## Frontend

Utilizar:

* React.
* TypeScript.
* Vite.
* React Router.
* TanStack Query.
* Zustand, apenas quando necessário para estado global.
* Tailwind CSS.
* React Hook Form.
* Zod.
* Playwright.

Evite dependências desnecessárias.

Prefira soluções consolidadas e adequadas à complexidade da aplicação.

## Banco de dados

Utilizar PostgreSQL local inicialmente.

O Supabase poderá ser considerado futuramente, mas não é objetivo da primeira etapa.

---

# 6. PLANO DE IMPLEMENTAÇÃO

A implementação deverá acontecer progressivamente.

**Não tente migrar toda a aplicação de uma única vez.**

Cada etapa precisa ter objetivos, entregáveis, testes e critérios de conclusão.

## FASE 0 — AUDITORIA DA APLICAÇÃO EXISTENTE

Antes de escrever código, faça uma análise técnica do Financeiro Familiar.

Investigue:

### Arquitetura

* Organização dos módulos.
* Separação entre frontend e backend.
* Responsabilidades das APIs Nitro.
* Gerenciamento de estado com Pinia.
* Compartilhamento de tipos.
* Regras de negócio.
* Estratégia de persistência.

### Banco de dados

* Estrutura das tabelas.
* Relacionamentos.
* Chaves primárias e estrangeiras.
* Restrições.
* Índices relevantes.
* Migrations.
* Regras de integridade.
* Utilização de RLS.

### Funcionalidades

Identifique os módulos existentes, especialmente:

* Contas.
* Receitas.
* Despesas.
* Transações.
* Cartões.
* Parcelamentos.
* Regras recorrentes.
* Planejamento financeiro.
* Listas de desejos.
* Relatórios.
* Autenticação.
* Compartilhamento familiar.

Considere somente funcionalidades efetivamente identificadas no código.

### Segurança

Identifique:

* Como funciona o login.
* Como os usuários são identificados.
* Como funciona a autorização.
* Como são isolados os dados de cada usuário ou família.
* Como as credenciais são gerenciadas.

### Testes

Verifique quais regras de negócio já possuem cobertura automatizada.

Identifique quais testes podem servir de referência para a implementação Java.

### Entregável

Crie:

`docs/java-react-migration/01-auditoria.md`

O documento deverá conter:

1. Arquitetura atual.
2. Stack identificada.
3. Funcionalidades existentes.
4. Mapa das APIs.
5. Modelo de dados relevante.
6. Regras de negócio críticas.
7. Dependências externas.
8. Riscos da migração.
9. Funcionalidades prioritárias para implementar em Java.
10. Estratégia recomendada de integração.

Não modifique funcionalidades existentes nessa fase.

---

# FASE 1 — BACKEND JAVA + SPRING BOOT

Esta é a primeira etapa de implementação.

## Objetivo

Construir uma API REST em Java utilizando as regras de negócio existentes como referência.

O backend deverá funcionar independentemente do Nuxt e do Supabase de produção.

## Estrutura sugerida

```text
backend-java/
└── src/main/java/com/financeiro/
    ├── config/
    ├── controller/
    ├── service/
    ├── repository/
    ├── entity/
    ├── dto/
    ├── exception/
    └── mapper/
```

Adapte essa estrutura conforme as necessidades reais.

## Primeiras funcionalidades

Comece pelos módulos:

1. Contas financeiras.
2. Lançamentos financeiros.

Implemente inicialmente operações CRUD.

Exemplo de endpoints:

```http
GET    /api/accounts
GET    /api/accounts/{id}
POST   /api/accounts
PUT    /api/accounts/{id}
DELETE /api/accounts/{id}

GET    /api/entries
GET    /api/entries/{id}
POST   /api/entries
PUT    /api/entries/{id}
DELETE /api/entries/{id}
```

Esses nomes são exemplos.

Antes de implementá-los, analise os contratos de API existentes para preservar consistência semântica.

## Requisitos técnicos

Implementar:

* Controllers REST.
* Services.
* Repositories.
* DTOs de entrada e saída.
* Validação de dados.
* Tratamento centralizado de exceções.
* Persistência com Spring Data JPA.
* Migrations com Flyway.
* Configuração de ambiente.
* Documentação OpenAPI.
* Testes unitários.
* Testes de integração.

## Regras financeiras

Preserve a semântica das regras existentes.

Preste atenção especial a:

* Valores monetários.
* Precisão decimal.
* Datas de vencimento.
* Parcelamentos.
* Recorrência.
* Categorias.
* Totais.
* Saldos.
* Relacionamentos entre contas e lançamentos.

Utilize `BigDecimal` para valores monetários.

Evite `float` e `double` para operações financeiras.

Garanta que as regras implementadas em Java produzam resultados equivalentes aos da aplicação atual.

## Segurança

Inicialmente, a API poderá utilizar um ambiente de demonstração local com dados fictícios.

Se for necessário simplificar a autenticação nessa fase, o mecanismo deverá ser explicitamente limitado ao ambiente de desenvolvimento.

Não crie autenticação simplificada que possa ser ativada acidentalmente em produção.

Planeje uma futura implementação com Spring Security e autenticação JWT.

O modelo deverá considerar autorização por usuário e por grupo familiar.

## Critérios de conclusão

A fase estará concluída quando:

* O backend iniciar localmente.
* O PostgreSQL local funcionar.
* As migrations forem executadas corretamente.
* Os endpoints CRUD funcionarem.
* As validações estiverem implementadas.
* Os testes relevantes passarem.
* O Swagger permitir testar as APIs.
* Nenhum recurso de produção tiver sido alterado.

---

# FASE 2 — INTEGRAR NUXT COM SPRING BOOT

## Objetivo

Utilizar a interface Nuxt existente para consumir experimentalmente o backend Java.

Esta fase é importante porque permitirá aprender Spring Boot sem precisar migrar simultaneamente todo o frontend para React.

## Estratégia

Implemente uma configuração exclusiva de desenvolvimento que permita selecionar o backend.

Exemplo conceitual:

```env
FINANCE_API_PROVIDER=nitro
```

ou:

```env
FINANCE_API_PROVIDER=spring
```

Essas variáveis são apenas uma proposta de configuração.

O mecanismo real deverá ser definido após análise da arquitetura.

## Requisitos

* Preservar o funcionamento original com Nitro.
* Permitir testar endpoints Java localmente.
* Não alterar o comportamento de produção.
* Não enviar dados reais para o backend experimental.
* Não alterar a autenticação existente em produção.
* Não criar dependência obrigatória do Java para executar o Nuxt original.

Analise a melhor estratégia de comunicação.

Considere um proxy exclusivo de desenvolvimento ou outra abordagem que evite conflitos com as rotas `/api` do Nitro.

O gerenciamento de estado deverá continuar respeitando a arquitetura atual.

Como o projeto utiliza Pinia, prefira integrar a nova fonte de dados por meio das abstrações existentes, em vez de espalhar chamadas HTTP diretamente pelos componentes.

## Critério de conclusão

Uma funcionalidade do Nuxt deverá consumir e manipular dados fictícios do backend Spring Boot.

A integração precisa ser reversível por configuração.

---

# FASE 3 — FRONTEND REACT + TYPESCRIPT

## Objetivo

Criar uma segunda implementação da interface do Financeiro Familiar utilizando React.

Não remova o Nuxt.

## Estratégia

Utilize o frontend atual como referência funcional e visual.

Reaproveite:

* Regras de negócio.
* Experiência do usuário.
* Padrões visuais.
* Conceitos do design system.
* Fluxos de navegação.
* Contratos de API.
* Validações aplicáveis.

Não tente converter componentes Vue diretamente para React por substituição de sintaxe.

Implemente os componentes utilizando os padrões idiomáticos do React.

## Primeiras telas

Priorize:

1. Dashboard financeiro.
2. Listagem de receitas e despesas.
3. Cadastro de lançamentos.
4. Edição de lançamentos.
5. Gerenciamento de contas.
6. Filtros financeiros.

Posteriormente, avance para os módulos mais complexos.

## Requisitos React

Aplicar corretamente:

* Componentização.
* Props.
* Hooks.
* `useState`.
* `useEffect`.
* Hooks personalizados.
* React Router.
* TanStack Query.
* Formulários tipados.
* Validação com Zod.
* Tratamento de erros.
* Estados de carregamento.
* Reutilização de componentes.

Evite gerenciar no Zustand informações que já sejam adequadamente gerenciadas pelo TanStack Query.

## Integração

O React deverá consumir os endpoints do Spring Boot.

Não implemente uma nova lógica financeira independente no frontend quando a responsabilidade for do backend.

O Java deverá ser responsável pelas operações financeiras e regras de negócio que pertencem ao servidor.

## Critérios de conclusão

O frontend React deverá permitir:

* Consultar contas.
* Consultar transações.
* Criar lançamentos.
* Editar lançamentos.
* Excluir lançamentos.
* Exibir totais consistentes.
* Tratar erros de API.

Tudo utilizando o PostgreSQL local.

---

# FASE 4 — EVOLUÇÃO PARA ARQUITETURA DE NÍVEL PLENO

Após validar a arquitetura básica, evolua o projeto.

## Segurança

Implementar:

* Spring Security.
* Autenticação JWT.
* Autorização.
* Controle de acesso por usuário.
* Controle de acesso por família.
* Validação de permissões no backend.
* Proteção contra acesso indevido a registros de outros usuários.

Avalie futuramente a integração com Supabase Auth sem modificar a autenticação de produção.

## Persistência

Implementar:

* Relacionamentos JPA.
* Paginação.
* Ordenação.
* Filtros.
* Transações com `@Transactional`.
* Tratamento de concorrência quando necessário.
* Consultas otimizadas.
* Análise de problemas N+1.

## Qualidade

Implementar:

* Testes unitários com JUnit.
* Mocking com Mockito.
* Testes de integração.
* Testcontainers.
* Testes de contratos relevantes.
* Testes de regressão financeira.
* Validação dos cálculos monetários.

## Arquitetura

Avaliar:

* SOLID.
* Separação de responsabilidades.
* Acoplamento.
* Coesão.
* Injeção de dependência.
* Tratamento global de exceções.
* Observabilidade.
* Logging estruturado.
* Configuração por ambiente.

Não introduza padrões arquiteturais complexos sem justificativa.

Priorize clareza e manutenção.

## Documentação

Documente as decisões arquiteturais importantes.

Explique os motivos de utilizar cada tecnologia.

---

# FASE 5 — AMBIENTE LOCAL E POSSÍVEL DEPLOY FUTURO

Inicialmente, a aplicação funcionará apenas localmente.

Arquitetura:

```text
       REACT + TYPESCRIPT
          localhost:5173
                |
                | HTTP / JSON
                |
                ▼
       JAVA + SPRING BOOT
          localhost:8080
                |
                | JDBC / JPA
                |
                ▼
          POSTGRESQL
             DOCKER
```

Os números das portas são sugestões.

Configure o projeto para evitar conflitos com serviços existentes.

## Docker

Crie uma configuração Docker Compose para o PostgreSQL local.

Utilize volumes persistentes para desenvolvimento.

Documente como:

* Iniciar o banco.
* Parar o banco.
* Reiniciar o ambiente.
* Executar migrations.
* Criar dados fictícios.
* Restaurar um ambiente limpo.

O backend Java poderá inicialmente ser executado diretamente pela IDE ou Maven.

Não é necessário containerizar tudo na primeira etapa.

## Futuro deploy

Posteriormente, poderemos avaliar:

* React hospedado em serviço gratuito.
* Spring Boot hospedado em infraestrutura apropriada.
* PostgreSQL do Supabase.
* Integração com Supabase Auth.
* Capacitor para Android.

Não implemente deploy de produção nesta fase.

Evite assumir que Java poderá ser hospedado gratuitamente de forma contínua.

---

# 7. DOCUMENTAÇÃO DE APRENDIZADO

Este projeto possui uma finalidade educacional importante.

O desenvolvedor já possui experiência profissional com:

* TypeScript.
* Node.js.
* NestJS.
* APIs REST.
* PostgreSQL.
* Flutter.
* Arquitetura de aplicações.

Entretanto, possui experiência limitada com Java e Spring Boot.

A documentação deverá aproveitar esses conhecimentos anteriores.

Sempre que implementar um conceito importante do Spring Boot, explique sua relação com tecnologias equivalentes do NestJS.

Exemplos:

| NestJS               | Spring Boot                 |
| -------------------- | --------------------------- |
| Controller           | RestController              |
| Injectable Service   | Service                     |
| Dependency Injection | Dependency Injection        |
| DTO                  | DTO / Record                |
| ValidationPipe       | Jakarta Validation          |
| Prisma               | Spring Data JPA / Hibernate |
| Exception Filter     | ControllerAdvice            |
| Guard                | Spring Security             |

Explique especialmente:

* Anotações Java.
* Injeção de dependência.
* Interfaces.
* Classes.
* Records.
* Generics.
* Streams.
* Exceptions.
* JPA.
* Hibernate.
* Transações.
* Spring Security.

O objetivo é entender o código, não apenas gerar uma aplicação funcional.

Crie um documento:

`docs/java-react-migration/guia-aprendizado.md`

Utilize explicações práticas, preferencialmente comparando Java com TypeScript e Spring Boot com NestJS.

Inclua perguntas técnicas que poderiam surgir em entrevistas.

---

# 8. PADRÕES DE DESENVOLVIMENTO

Adote as seguintes regras:

1. Preserve o código existente sempre que possível.
2. Prefira pequenas alterações incrementais.
3. Não introduza complexidade desnecessária.
4. Utilize nomes de classes e métodos descritivos.
5. Separe regras de negócio de Controllers.
6. Evite lógica de negócio dentro de entidades JPA quando ela não pertencer ao modelo de domínio.
7. Utilize DTOs nas interfaces HTTP.
8. Evite expor entidades JPA diretamente nas respostas da API.
9. Centralize o tratamento de exceções.
10. Utilize migrations versionadas.
11. Não inclua segredos no repositório.
12. Não faça chamadas para serviços de produção sem necessidade e autorização.
13. Escreva testes para regras financeiras críticas.
14. Execute os testes pertinentes após alterações.
15. Não utilize soluções temporárias inseguras como implementação definitiva.

Sempre que identificar um problema arquitetural existente, documente-o antes de propor uma alteração relevante.

---

# 9. REGRAS PARA TRABALHAR COM O CÓDIGO EXISTENTE

A aplicação já possui funcionalidades implementadas em TypeScript.

Não reescreva automaticamente todas essas funcionalidades.

Antes de migrar uma regra:

1. Localize a implementação original.
2. Entenda suas entradas.
3. Entenda suas saídas.
4. Identifique dependências.
5. Identifique os casos de borda.
6. Localize os testes existentes.
7. Reproduza os mesmos comportamentos em Java.
8. Crie testes equivalentes.
9. Compare os resultados.

Especialmente para cálculos financeiros, não considere uma migração concluída apenas porque o endpoint retorna HTTP 200.

É necessário verificar a equivalência dos resultados.

A nova implementação deverá respeitar o comportamento funcional atual, exceto quando forem identificados problemas concretos e documentados.

---

# 10. ENTREGÁVEIS E ACOMPANHAMENTO

Crie um documento central:

`docs/java-react-migration/ROADMAP.md`

Ele deverá conter:

* Fases.
* Objetivos.
* Tarefas.
* Dependências.
* Critérios de aceitação.
* Status de implementação.
* Pendências.
* Riscos conhecidos.

Utilize marcações:

* [ ] Pendente
* [x] Concluído

Atualize o roadmap conforme o desenvolvimento avançar.

Para cada fase, registre:

* O que foi implementado.
* Quais arquivos foram criados.
* Quais arquivos foram modificados.
* Quais testes foram executados.
* Quais resultados foram obtidos.
* Quais decisões arquiteturais foram tomadas.
* Quais problemas permanecem.

Não marque uma etapa como concluída sem validação.

---

# 11. COMO DESEJO QUE VOCÊ TRABALHE

Você deverá atuar com autonomia técnica, mas respeitando os limites definidos.

Não quero apenas um exemplo acadêmico simples.

Quero uma implementação real, baseada no Financeiro Familiar, que possa ser ampliada progressivamente.

Entretanto, não quero uma reescrita completa e precipitada.

Priorize:

**Segurança → Análise → Planejamento → Implementação incremental → Testes → Documentação.**

Utilize os padrões profissionais do ecossistema Java, mas explique os conceitos importantes.

Sempre que houver múltiplas abordagens, escolha a que apresentar o melhor equilíbrio entre:

* Aprendizado.
* Manutenibilidade.
* Segurança.
* Simplicidade.
* Qualidade técnica.
* Possibilidade de evolução.

Não execute ações destrutivas.

Não modifique a infraestrutura de produção.

Não faça merge na `main`.

Não realize deploy de produção.

Não utilize dados financeiros reais para testes experimentais.

---

# 12. PRIMEIRA EXECUÇÃO — O QUE FAZER AGORA

Execute o trabalho inicial nesta ordem:

### PASSO 1 — Inspecionar o repositório

Analise a estrutura atual e identifique os pontos necessários para integrar um backend Spring Boot.

Verifique as condições de isolamento da produção.

### PASSO 2 — Preparar a branch

Verifique se `feat/react-springboot` já existe.

Caso não exista e o diretório de trabalho esteja em condições seguras, crie a branch a partir da `main` atualizada.

Não descarte alterações locais.

### PASSO 3 — Produzir a auditoria

Crie:

`docs/java-react-migration/01-auditoria.md`

Descreva a arquitetura existente e os pontos de integração com Spring Boot.

### PASSO 4 — Criar o roadmap

Crie:

`docs/java-react-migration/ROADMAP.md`

Organize a implementação em etapas pequenas e verificáveis.

### PASSO 5 — Preparar o ambiente Java

Após confirmar que isso não afetará a aplicação existente:

* Inicialize `backend-java`.
* Configure Spring Boot.
* Configure Maven.
* Configure PostgreSQL local com Docker.
* Configure Flyway.
* Crie o primeiro endpoint de verificação de funcionamento.
* Crie os primeiros testes automatizados.
* Documente os comandos necessários para executar o ambiente.

### PASSO 6 — Validar

Verifique:

* Se o Spring Boot inicia.
* Se o PostgreSQL local está acessível.
* Se as migrations executam corretamente.
* Se o endpoint inicial responde.
* Se os testes passam.
* Se a aplicação Nuxt original permanece intacta.
* Se nenhuma operação atingiu a infraestrutura de produção.

### PASSO 7 — Apresentar os resultados

Ao terminar essa primeira entrega, apresente:

1. Resumo da arquitetura encontrada.
2. Riscos e particularidades identificados.
3. Arquivos criados e modificados.
4. Comandos para executar o backend localmente.
5. Evidências dos testes realizados.
6. Próximas tarefas da Fase 1.
7. Explicação dos principais conceitos Java utilizados.

Não avance automaticamente para a migração do frontend React.

Primeiro precisamos consolidar o backend Java.

---

# 13. RESULTADO FINAL ESPERADO

Ao longo das próximas etapas, quero chegar à seguinte situação:

### Aplicação original

* Nuxt + Vue.
* Nitro.
* Supabase.
* Funcionando em produção.
* Sem regressões provocadas pelo laboratório.

### Aplicação experimental

* React + TypeScript.
* Java + Spring Boot.
* PostgreSQL.
* API REST.
* Arquitetura modular.
* Autenticação e autorização.
* Testes automatizados.
* Documentação técnica.
* Ambiente de execução local reproduzível.

### Resultado profissional

Quero conseguir explicar e demonstrar:

* Como desenvolver APIs REST com Spring Boot.
* Como organizar Controllers, Services e Repositories.
* Como implementar persistência com JPA e Hibernate.
* Como realizar validações.
* Como configurar segurança.
* Como escrever testes automatizados em Java.
* Como integrar React e Spring Boot.
* Como organizar um projeto Full Stack.
* Como tomar decisões arquiteturais.
* Como identificar e corrigir problemas de desempenho.
* Como migrar uma aplicação entre diferentes tecnologias.

O objetivo é adquirir experiência prática e conhecimento técnico suficiente para discutir essas tecnologias com segurança em processos seletivos e aplicá-las profissionalmente.

**INICIE PELA AUDITORIA DO REPOSITÓRIO, PREPARAÇÃO DA BRANCH E IMPLEMENTAÇÃO INICIAL DO BACKEND SPRING BOOT.**
