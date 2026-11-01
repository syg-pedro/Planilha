# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

O APK Android (Capacitor, `com.pedro.financeirofamiliar`) é um shell que carrega a versão web de produção; só widgets, notificações e ícone são nativos.

## Users

Pedro e as pessoas da casa, que controlam juntos as finanças da família. Cada família tem seu grupo e convida os membros por link (`/invite/[token]`). Os lançamentos citam pessoas da família (ex.: Juli, Will) como responsáveis por contas, cartões e receitas.

## Product Purpose

Reunir receitas, despesas, contas, cartões e vencimentos em um só lugar, substituindo a planilha de controle que a família mantinha no Google Sheets. Sucesso é:

- nunca perder um vencimento;
- enxergar a sobra (ou o vermelho) dos próximos meses, já contando parcelas e salários;
- manter limite, faturas e parcelas de cada cartão sob controle.

## Operating Context

- Usado por igual no celular (consultas rápidas, marcar contas como pagas, alertas) e no computador (sessões de planejamento com a visão ampla da Planilha).
- A tela Planilha reproduz o formato da planilha original: meses nas linhas, contas nas colunas, Soma por mês, limite e vencimento dos cartões, e o bloco de Receitas com Total e Sobra. Precisa funcionar como uma planilha (teclado, copiar/colar, desfazer) e cada edição muda os mesmos lançamentos usados em todo o app.
- Valores em reais (pt-BR), datas por vencimento ou por competência.

## Capabilities and Constraints

- Nuxt 4 + Nuxt UI, com Supabase em produção e repositório em memória para desenvolvimento e testes.
- Telas: Planilha (grade editável e Lista), Resumo, Contas e cartões, Relatórios, Planejamento anual, Dívidas e parcelas, Assinaturas, Lista de desejos, Alertas, Primeiros passos.
- Cartões são contas do tipo `credit_card`, com limite, dia de fechamento e de vencimento; a célula do cartão é a fatura, composta por compras parceladas.
- Regras mensais geram lançamentos recorrentes (ex.: salários).
- O tema é escolhido pelo usuário entre os presets do Nuxt UI; as telas usam os tokens do app, nunca cores fixas.
- Limite existe só em cartões; colunas que não são cartão não guardam limite.
- A planilha original do Google Sheets serviu apenas como exemplo de formato; seus valores, pessoas e contas não são dados reais atuais e não devem ser replicados.

## Brand Commitments

- Nome: Planilha.
- Interface e textos em português do Brasil, com linguagem direta do dia a dia da casa.

## Evidence on Hand

- `dados.txt` e `shared/defaultDadosText.ts`: dados reais de exemplo usados para semear o modo em memória.
- Conta de demonstração com dados fictícios descrita no README.
- Não há depoimentos, clientes ou métricas de uso; não inventar.

## Product Principles

- Um lançamento é a única verdade: toda tela (Planilha, Resumo, Cartões, Alertas) lê e edita os mesmos registros.
- O futuro importa tanto quanto o mês atual: parcelas e regras aparecem nos meses em que vão pesar.
- Rápido no celular, completo no computador.
- Familiar para quem vinha da planilha: os mesmos números, totais e sobra, calculados sem erro de fórmula.
