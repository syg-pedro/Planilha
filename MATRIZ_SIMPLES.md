# Matriz simples

## Objetivo

Facilitar a consulta dos valores de cada mês, mantendo despesas, cartões e receitas na mesma grade. A versão simples é a entrada padrão; a matriz completa e a lista continuam disponíveis.

## Interface

- Meses em colunas e descrições fixas à esquerda. No celular, dois meses por vez.
- Grupos de despesas, cartões, receitas e itens fora do saldo. Os grupos podem ser recolhidos.
- Três totais principais: despesas, receitas e sobra prevista.
- Busca, novo lançamento e opções de período continuam acessíveis.
- Limites, vencimentos e composição dos valores aparecem nos detalhes de cada célula.
- Menus de linha, ocultação de meses, metadados e os seis totais permanecem na matriz completa.
- Um resumo adicional mostra os seis totais do mês e do período, sem ocupar a grade principal.

## Implementação

Reutilizar FinanceAnnualMatrix e o mesmo modelo de cálculo de shared/matrix.ts. A mudança controla a apresentação; não altera lançamentos, agrupamentos, status nem regras financeiras. Salvar a preferência de versão apenas no navegador.

## Validação

Conferir alternância entre versões, igualdade dos valores e totais, abertura de detalhes e cancelamento da edição. Verificar desktop e larguras mobile de 320 e 390 px, incluindo resumo e seleção de células. Executar tipos, lint dos arquivos alterados e os testes existentes da matriz. A validação usa a API de produção somente para leitura.

## Resultado local

- As 180 células consultadas mantiveram os mesmos valores, status e registros nas duas versões.
- Resumo adicional, edição seguida de cancelamento, alternância com Lista e preferência após recarregar foram conferidos no navegador.
- A seleção de duas células somou R$ 871,30 e permaneceu ativa ao trocar de mês. Não houve sobreposição com o resumo ou a navegação mobile.
- Desktop de 1280 px e mobile de 320 e 390 px foram conferidos. Isso não substitui teste em aparelho físico.
- Build, tipos, lint dos arquivos alterados e os 12 testes de matriz e seleção passaram.
- Os cenários E2E foram atualizados; a conferência de interface desta tarefa foi manual no navegador. Nenhum lançamento de produção foi alterado.
