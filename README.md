# Financeiro Familiar

<!-- O deploy de produção é validado pela integração do Vercel. -->

Organize receitas, despesas, contas, cartões e vencimentos em um só lugar.

## Testar pelo navegador

[**Abrir o Financeiro Familiar na web**](https://planilha-cyan.vercel.app)

Use a conta de demonstração para explorar o aplicativo:

- **E-mail:** `teste@teste.com`
- **Senha:** `teste123`

> A conta de demonstração contém apenas dados fictícios para testes.

## Baixar para Android

[**Baixar o APK do Financeiro Familiar**](https://github.com/syg-pedro/Planilha/releases)

> O aplicativo é instalado diretamente pelo APK; ele não está na Play Store.

1. Abra o link acima no celular Android.
2. Baixe o APK mais recente e abra o arquivo.
3. Se solicitado, permita a instalação pela fonte usada (Chrome, WhatsApp ou Arquivos).
4. Abra o aplicativo, permita as notificações e entre ou crie sua conta.

## Atualizações

O APK Android funciona como um shell nativo que carrega a versão web publicada em produção. Assim, melhorias de tela, tema, textos e usabilidade chegam pelo deploy web sem precisar instalar um APK novo.

Um novo APK só é necessário quando houver mudança nativa, como widget Android, permissões, ícone, splash screen, plugins Capacitor ou versão do app.

## Desenvolvimento e revisão

Use Node.js 22 (`.nvmrc`), `npm ci` e `npm run dev`. Sem variáveis Supabase, acesse `http://localhost:3000/?key=demo-finance-key`: os dados ficam em memória e reiniciar o servidor restaura a demonstração. Com Supabase, o aplicativo exige login e resolve a família pelo usuário autenticado.

Execute `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`. Para E2E, instale Chromium com `npx playwright install chromium` e execute `npm run test:e2e`.

As correções desta revisão requerem a migração `supabase/migrations/20260904142503_secure_finance_batches.sql` antes da publicação do backend. Ela foi testada em PostgreSQL descartável e aplicada no projeto Supabase `planilha` em 04/09/2026; outros ambientes também precisam recebê-la. Confira os pré-requisitos, limitações e resultados na [documentação da revisão](docs/revisao-2026-09-04/README.md).
