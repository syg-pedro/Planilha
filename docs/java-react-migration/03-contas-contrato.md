# Proposta da Fase 1B — contas financeiras

Data: 28/10/2026. Estado: aprovado pelo usuário com “ok, pode seguir”; CRUD implementado e validado. Branch: feat/react-springboot.

## Escopo e impacto

Banco: criar somente accounts no PostgreSQL local financeiro_lab, em V2 independente. Preservar V1 e o marcador técnico existente. Não copiar tabelas, seeds ou credenciais do Supabase.
API: CRUD REST em backend-java, com DTOs, JPA, service transacional, validação e tratamento centralizado de erros.
Front: nenhum nesta etapa. O futuro frontend React usará HeroUI por escolha explícita do usuário; a integração Nuxt pertence à Fase2.
Regra principal: somente contas fictícias do contexto local-demo; id e householdId são definidos pelo servidor.
Fora do escopo: lançamentos, categorias, recorrência, autenticação/JWT, integração Nuxt/React, produção, commit/push/deploy.

## Fontes conferidas

| Fonte | Evidência |
| --- | --- |
| shared/types.ts:51 | Account possui id, householdId, name, owner, type, limitTotal, closingDay, dueDay e active |
| AccountEditorSheet.vue:169 | Nome obrigatório e trim; owner vazio é permitido |
| AccountEditorSheet.vue:175 | Cartão aceita limite nulo/zero/positivo e dias nulos ou inteiros1–31; não existe regra fechamento menor que vencimento |
| AccountEditorSheet.vue:194 | Para tipo diferente de credit_card, os campos de cartão são enviados como null |
| server/utils/onboarding.ts:5 | Referência existente para nome até100 e responsável até80 caracteres |
| server/utils/repo.ts:524,1120 | Memória faz merge; Supabase reconstrói defaults. Não reproduzir a divergência no novo contrato |
| supabase/migrations/0001_init.sql:15 | Esquema atual de contas e numeric sem escala fixa |
| supabase/migrations/0001_init.sql:40,56,84 | Referências a conta usam SET NULL ao excluir; não há cascata de lançamentos |

Os nomes de campos JSON seguem o contrato TypeScript existente. Classes e métodos de domínio Java usarão nomes em português; nomes HTTP e de bibliotecas permanecem no idioma original.

## Contrato HTTP proposto

| Método/rota | Entrada | Resposta |
| --- | --- | --- |
| GET /api/accounts | Sem corpo | 200, {accounts:[...]} com ativas e inativas, ordem estável por nome e ID |
| GET /api/accounts/{id} | ID textual | 200 com conta ou404 |
| POST /api/accounts | Campos editáveis | 201, Location e conta criada |
| PUT /api/accounts/{id} | Campos editáveis | 200 com conta alterada; ID ausente404, nunca upsert |
| DELETE /api/accounts/{id} | ID textual | 204; ID ausente404 |

Paginação e filtros avançados permanecem na etapa de evolução definida no roadmap. A listagem inicial representa o conjunto de contas do laboratório e não é o bootstrap/batch Nitro. Não alterar chamadores atuais.

Exemplo de criação, exclusivamente fictício:

```json
{
  "name": "Cartão de demonstração",
  "owner": "Pessoa fictícia",
  "type": "credit_card",
  "limitTotal": 1234.56,
  "closingDay": 28,
  "dueDay": 5,
  "active": true
}
```

Resposta conserva os campos acima e acrescenta id textual account-UUID e householdId local-demo. IDs existentes não são necessariamente UUID puro; o path continua String. IDs e householdId enviados pelo cliente devem ser rejeitados, sem permitir sobrescrever identidade/contexto.

## Validação e normalização

| Campo | Regra proposta |
| --- | --- |
| name | Obrigatório, trim,1–100 caracteres |
| owner | Opcional; null/omitido vira string vazia, trim, até80 caracteres |
| type | Obrigatório; bank, credit_card, benefit ou external |
| limitTotal | BigDecimal nullable, não negativo, até12 inteiros e2decimais; rejeitar excesso, sem arredondar silenciosamente |
| closingDay/dueDay | Nullable; quando informados, inteiros1–31; cartão pode ter ambos nulos ou fechar28/vencer5 |
| active | Opcional: criação usa true; atualização preserva o estado anterior quando omitido |
| id/householdId | Somente servidor; household fixo local-demo, sem seletor vindo do cliente |

No service, conta que não for cartão terá limitTotal/closingDay/dueDay normalizados para null, como o editor atual. Nome não é único: não há essa restrição hoje.

Diferenças intencionais de validação: as rotas batch atuais são permissivas, o editor não limita efetivamente casas decimais e o PostgreSQL legado usa numeric sem escala. A proposta introduz duas casas monetárias e limites de texto baseados no onboarding. Nenhum dado original será migrado automaticamente, portanto não haverá truncamento de dados reais.

Erros de corpo/validação/enum/dias/precisão: HTTP400, com mensagem amigável e campos inválidos. Registro inexistente:404. Falha inesperada:500 genérico. Não expor SQL, JDBC, stacktrace ou credenciais na resposta. DTOs não expõem entidades JPA. Leitura/alteração/exclusão serão sempre pelo ID e contexto local, sem reproduzir o upsert global do legado.

## SQL aprovado

Histórico novo V2__create_accounts.sql, sem modificar V1. Nenhuma tabela de autenticação ou household_settings é necessária para esta conta demonstrativa; o CHECK explicita o limite local. Na etapa de autenticação, substituir essa restrição por vínculo familiar e autorização reais em nova migration.

```sql
CREATE TABLE accounts (id VARCHAR(64) PRIMARY KEY, household_id VARCHAR(64) NOT NULL CHECK (household_id = 'local-demo'), name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0), owner VARCHAR(80) NOT NULL, type VARCHAR(20) NOT NULL CHECK (type IN ('bank', 'credit_card', 'benefit', 'external')), limit_total NUMERIC(14,2) CHECK (limit_total >= 0), closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31), due_day INTEGER CHECK (due_day BETWEEN 1 AND 31), active BOOLEAN NOT NULL DEFAULT TRUE, CHECK (type = 'credit_card' OR (limit_total IS NULL AND closing_day IS NULL AND due_day IS NULL)));
```

Não é SQL SAGI/SGR/apps_web; a fonte é o contrato local e a migration versionada da aplicação. A aprovação autorizou implementação e execução somente local. V2 foi aplicada nos bancos descartáveis Testcontainers, com registros fictícios, e no PostgreSQL do Compose. Nenhum SQL foi executado em produção. Resultados finais:66unitários+58integrações aprovados, API local e Swagger conferidos; detalhes em evidencias.md.

## Exclusão e limites da fatia

Exclusão será física, coerente com a persistência atual. Não confundir excluir com active=false. Nesta fase ainda não há lançamentos/regras Java vinculados a contas.

Antes de adicionar lançamentos na Fase1C, definir FKs do mesmo contexto familiar e preservar o histórico financeiro ao excluir uma conta. O legado usa SET NULL, e excluir vínculo de benefício pode alterar sua participação nos totais; essa particularidade precisa de decisão e testes próprios. Não criar antecipadamente lógica para tabelas ainda inexistentes.

## Etapas e prova de conclusão

1. Implementar V2, entidade/repository de contas e DTOs com validação. Sem dependência nova.
2. Implementar service transacional, controller e advice de erros; atualizar teste health que hoje fixa Flyway em versão1.
3. Executar unitários e integração PostgreSQL/Testcontainers, conferir Swagger e atualizar evidências/guia.

| Cenário | Evidência esperada |
| --- | --- |
| CRUD | POST201+Location, GET/listagem, PUT200, DELETE204 e404 para desconhecidos |
| Valores válidos | Quatro tipos; responsável vazio; limite null/zero/0.10/0.20/1234.56; dias null/1/31 |
| Entrada inválida | Nome vazio/espaços/longo; tipo inválido; limite negativo/excesso de precisão; dias0/32/fracionários; corpo inválido |
| Normalização | Trim; troca cartão→bank/benefit/external limpa campos; omitir active no PUT preserva false |
| Isolamento | ID/contexto do cliente rejeitados; household sempre local-demo; constraints locais verificadas |
| Regressão | Guard continua bloqueando banco externo; health/OpenAPI/Swagger funcionam após V2; nenhum diff no Nuxt/Nitro/Supabase |

## HeroUI na Fase3

Escolha do usuário: [HeroUI](https://heroui.com/) para os componentes do frontend React. Linha atual v3: React19+, TailwindCSS4 e pacotes @heroui/react/@heroui/styles, conforme [requisitos oficiais](https://heroui.com/en/docs/react/getting-started/agents-md) e [quick-start](https://heroui.com/en/docs/react/getting-started/quick-start). Revalidar versões ao começar a implementação, preservando tokens/tema do produto, acessibilidade e uso claro/escuro/mobile.

Nenhuma instalação ou alteração de dependência React/Nuxt foi feita nesta preparação.
