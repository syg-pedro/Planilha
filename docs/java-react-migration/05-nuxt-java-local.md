# Nuxt conectado ao Java somente no laboratório local

O modo normal continua usando os contratos e a autenticação originais. O laboratório exige `NUXT_JAVA_LAB=1`, servidor de desenvolvimento e navegador em `http://127.0.0.1:3100` ou `http://localhost:3100`. O backend fica exclusivamente em `http://127.0.0.1:8080`. Não há fallback para Nitro/Supabase quando Java está indisponível.

## Executar

1. Inicie PostgreSQL e Java pelo procedimento de ambiente local. A API precisa incluir as migrations de autenticação e as rotas `/api/auth/*`, `/api/bootstrap` e `/api/legacy/*/batch`.
2. Abra um perfil de navegador separado, sem sessões ou dados financeiros da aplicação original.
3. No diretório raiz do worktree, execute:

```bash
node scripts/java-react/nuxt-lab.mjs
```

4. Abra `http://127.0.0.1:3100/signup` e crie uma conta de teste com e-mail fictício. O cadastro cria a família local; não envia confirmação por e-mail. Use somente lançamentos fictícios.

O iniciador usa apenas `infra/dev/nuxt-java-lab.env`, remove variáveis herdadas de Supabase/chaves originais do processo filho e fixa host/porta. Não copia `.env`, credenciais ou dados financeiros. `Ctrl+C` encerra o servidor. O Nuxt original continua disponível pelo comando habitual, sem a flag.

## Isolamento

| Fronteira | Regra |
| --- | --- |
| Build | A flag ativa é rejeitada fora de `nuxt dev`. `NUXT_PUBLIC_JAVA_LAB` é rejeitada para impedir ativação por configuração pública |
| API | Proxy local para a porta 8080. Destinos externos, outras portas, URLs com credenciais, caminhos extras ou query na configuração são recusados |
| Supabase | Configuração privada/pública zerada no modo local; clientes e autorização/repositório originais bloqueiam acesso antes de qualquer consulta ou seed |
| Sessão | JWT somente na memória. Renovação por cookie HttpOnly exclusivo, com `X-Requested-With: FinanceiroLab`. Nenhuma senha ou token vai para Web Storage ou logs |
| Dados no navegador | Fila, chave, usuários recentes, alertas e preferências usam `sessionStorage` com prefixo `finance-java-lab:`. A fila também inclui usuário e família. Não há leitura das chaves reais |
| Plataforma | PWA, atualizações remotas, notificações, widget e integrações nativas desativados neste modo. Fontes remotas de configuração também são omitidas |

## Adaptação dos contratos

O store mantém suas ações e componentes. Apenas a fonte HTTP muda. Antes de um batch, o adapter consulta a coleção Java, mescla alterações parciais com os registros atuais e seleciona somente campos editáveis. `id`, `householdId`, `createdAt` e `updatedAt` ficam fora de `data`; IDs novos do navegador viram `null` para o servidor gerar a identidade.

Os batches seguem para `/api/legacy/accounts/batch`, `/api/legacy/entries/batch`, `/api/legacy/rules/batch` e `/api/legacy/wishlist/batch`, cada qual em uma transação no servidor. As respostas conservam os envelopes originais. Endpoints já compatíveis, incluindo configurações, importação e reconstrução de regras, seguem diretamente ao Java.

A fila offline local é consolidada antes do envio: criar e depois editar o mesmo ID temporário gera um único registro. Um batch só sai da fila depois da confirmação; falha conserva os itens. Durante essa sincronização, outro salvamento é recusado com mensagem amigável para evitar duplicidade de identidades temporárias. A restauração por `dados.txt` é recusada no adapter e nunca consulta o arquivo original.

## Validação

Testes puros: `tests/javaLab.test.ts` e `tests/javaLabAdapter.test.ts`. Conferem ativação/ambiente, destinos e portas, namespace, merge parcial, identidade somente do servidor, campos somente de leitura, consolidação offline, batch único e bloqueio de seed/endereço externo.

```bash
npx vitest run tests/javaLab.test.ts tests/javaLabAdapter.test.ts
```

Para conferir os tipos, deixe a flag do laboratório ausente e execute o comando usual. Isso valida os dois ramos do código sem iniciar qualquer servidor.

```bash
npm run typecheck
```

A entrega do adapter não equivale à homologação visual ou de ponta a ponta. Login/cookie/proxy e CRUD precisam ser validados com o backend local autenticado. Nenhuma produção, banco Supabase, APK, commit ou push faz parte deste procedimento.

| Verificação executada nesta fatia | Resultado |
| --- | --- |
| Vitest dos guards e adapter | 9 testes passaram |
| Nuxt prepare e typecheck, com checagem Vue/TypeScript final | Passaram |
| ESLint dos arquivos centrais alterados, sintaxe do iniciador e diff check | Passaram |
| Carregamento de configuração com flag ativa em NODE_ENV=production | Recusado antes de carregar os módulos, conforme esperado |
| Navegador, proxy/cookie e CRUD com backend autenticado | Pendentes de validação integrada |
