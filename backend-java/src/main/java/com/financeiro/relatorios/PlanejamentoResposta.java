package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.util.List;

public record PlanejamentoResposta(List<Mes> rows, Totais totals) {
    public record Mes(String month, String label, BigDecimal income, BigDecimal expense, BigDecimal net,
            BigDecimal accumulated, boolean hasRecords, boolean isCurrentMonth) {
    }

    public record Totais(BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal totalNet,
            BigDecimal projectedIncome, BigDecimal projectedExpense, BigDecimal projectedNet,
            long riskMonths, int recordedMonths) {
    }
}
