package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.util.List;

import com.financeiro.lancamentos.LancamentoResposta;

public record DividasResposta(List<Grupo> groups, Resumo summary) {
    public record Grupo(String key, String title, String catName, String accountName, String accountId,
            List<LancamentoResposta> entries, long paidCount, int totalCount, BigDecimal totalAmount,
            BigDecimal pendingAmount, BigDecimal installmentAmount) {
    }

    public record Resumo(BigDecimal totalPending, BigDecimal totalAmount, long paidCount,
            long totalCount, BigDecimal thisMonth) {
    }
}
