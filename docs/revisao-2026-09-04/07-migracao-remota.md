# Migração remota e testes autenticados — 04/09/2026

Aplicação autorizada pelo usuário. Projeto: `planilha` (`whltzvaqakgvqfylciot`). CLI 2.101.0, repositório vinculado via `supabase link`.

## Migração aplicada

`20260904142503_secure_finance_batches.sql` aplicada com sucesso e verificada em `supabase_migrations.schema_migrations`.

O histórico remoto registrava somente `0001/init` e `0002/auth_households`, embora o schema já contivesse as tabelas e colunas posteriores necessárias. O dry-run de `db push` tentaria reaplicar oito migrações antigas além da nova. Por isso foi executado **somente o SQL da nova migração**, usando `supabase db query --linked --file`, dentro de uma transação que também registrou versão, nome e conteúdo SQL no histórico. O histórico anterior não foi reparado, e migrações antigas não foram reaplicadas.

As duas funções novas não existiam antes da aplicação. A migração cria as RPCs, configura suas permissões e restringe criação direta de convites; não substitui dados financeiros.

## Testes realizados no remoto

Usada a conta `teste@teste.com`, autorizada pelo usuário.

| Verificação | Resultado |
|---|---|
| Login no navegador, site publicado | Sucesso, dashboard carregado |
| Login pela API Supabase | Sucesso |
| Bootstrap publicado com bearer | HTTP 200 e família correspondente à sessão |
| SELECT pela Data API sob RLS | 240 lançamentos retornados, todos da família da conta |
| RPC de lote chamada diretamente pelo usuário | Negada com código `42501`, como esperado para função exclusiva do servidor |
| Permissões SQL da RPC | `anon`/`authenticated` sem execução; `service_role` com execução |
| Delete/upsert cruzado entre famílias nas quatro tabelas | Rejeitado |
| Falha após exclusão em lote | Registro anterior preservado pelo rollback |
| Edição parcial de lançamento | Status atualizado preservando regra, origem e metadados |
| Convite com e-mail diferente | Rejeitado |
| Convite com e-mail normalizado | Aceito uma vez; reutilização rejeitada |
| Inserção direta de convite por authenticated | Sem privilégio |

Os testes SQL criaram registros temporários e uma família temporária **dentro de uma transação encerrada com ROLLBACK**. Inclusive a troca de família usada para testar convites foi revertida. Nenhum convite foi enviado por e-mail. Não houve alteração permanente dos lançamentos da conta de teste.

O teste autenticado via API utilizou apenas a chave pública e login normal. Uma tentativa de obter a chave `service_role` para iniciar o backend local foi rejeitada pela revisão automática de permissões; o retorno foi apenas “blocked by policy”, sem justificativa detalhada. A ação não foi repetida por outro meio. Portanto, o backend novo não foi homologado localmente contra o remoto nesta etapa. O código local já passou pelos testes descritos no documento 06, e as RPCs foram executadas diretamente no banco remoto.

## Advisor e limites

O Advisor de segurança retornou cinco warnings:

- `get_user_household_id`: execução SECURITY DEFINER disponível a anon e authenticated (dois avisos). O helper é usado nas políticas RLS; avaliar privilégios e localização sem quebrar essas políticas.
- `handle_new_user`: execução SECURITY DEFINER disponível a anon e authenticated (dois avisos). Revisar privilégios de chamada direta mantendo o trigger de criação de usuário.
- Proteção de senhas vazadas desativada (um aviso).

Esses avisos correspondem a funções/configuração anteriores e não foram alterados pela migração desta revisão. A nova RPC usa SECURITY INVOKER e não está exposta aos papéis públicos.

**Ainda não houve deploy do código da branch.** Os testes no site publicado verificam compatibilidade e autenticação da versão existente, não as melhorias locais de UI nem o transporte novo. Para ativar todas as correções na aplicação publicada, publicar o backend/frontend desta branch após revisão. Android físico, PWA instalada e notificações continuam pendentes. O histórico antigo também precisa de reconciliação própria antes de um futuro `db push` completo.

Referência operacional consultada: [Supabase CLI — migrações](https://supabase.com/docs/reference/cli/supabase-db-push).
