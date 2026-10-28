package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;

public record MatrizResposta(List<String> months, List<Linha> rows, Map<String, Resumo> summaries,
        Resumo totals, Map<String, Compromisso> cardCommitments) {
    public record Celula(List<LancamentoResposta> entries, BigDecimal amount, BigDecimal paid,
            BigDecimal pending, String status) {
    }

    public record Linha(String id, String title, String kind, String group, ContaResposta account,
            List<LancamentoResposta> entries, Map<String, Celula> cells, BigDecimal total, List<Integer> dueDays) {
    }

    public record Resumo(BigDecimal income, BigDecimal expense, BigDecimal net, BigDecimal paid,
            BigDecimal received, BigDecimal pendingExpense, BigDecimal pendingIncome, BigDecimal settledNet,
            BigDecimal excluded, long incomeCount, long expenseCount) {
    }

    public record Compromisso(BigDecimal committed, BigDecimal available) {
    }
}
