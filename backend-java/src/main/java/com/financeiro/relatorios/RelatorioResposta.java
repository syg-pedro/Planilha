package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record RelatorioResposta(
        Totais totals,
        Indicadores kpis,
        List<FluxoMensal> cashflow,
        Map<String, BigDecimal> categories,
        List<Cartao> cards,
        List<CicloPagamento> paymentCycles,
        List<ProjecaoMensal> projection,
        BigDecimal savingsRate,
        List<Pessoa> persons,
        Map<String, BigDecimal> dailyExpenses) {
    public record Totais(BigDecimal income, BigDecimal expense, BigDecimal net, BigDecimal paid,
            BigDecimal received, BigDecimal pendingExpense, BigDecimal pendingIncome,
            BigDecimal settledNet, BigDecimal excluded, long incomeCount, long expenseCount) {
    }

    public record Indicadores(BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal net,
            BigDecimal pendingAmount, BigDecimal upcoming7Days, BigDecimal cardsUsedPercent) {
    }

    public record FluxoMensal(String month, BigDecimal income, BigDecimal expense, BigDecimal net) {
    }

    public record Cartao(String accountId, String name, BigDecimal limitTotal, BigDecimal expense,
            BigDecimal globalCommitted, BigDecimal available, BigDecimal usagePercent) {
    }

    public record CicloPagamento(String id, int startDay, int endDay, BigDecimal pendingTotal,
            long pendingCount, BigDecimal projectedBalanceImpact) {
    }

    public record ProjecaoMensal(String month, BigDecimal balance) {
    }

    public record Pessoa(String name, BigDecimal income, BigDecimal expense, BigDecimal net) {
    }
}
