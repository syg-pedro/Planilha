package com.financeiro.lancamentos;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

public record LancamentoResposta(
        String id,
        String householdId,
        String ruleId,
        String accountId,
        String categoryId,
        String title,
        String description,
        BigDecimal amount,
        String kind,
        LocalDate dueDate,
        LocalDate competenceDate,
        Integer installmentIndex,
        Integer installmentTotal,
        String status,
        String origin,
        boolean excludeFromCalc,
        Map<String, Object> metadata,
        Instant createdAt,
        Instant updatedAt) {
    static LancamentoResposta de(Lancamento lancamento) {
        return new LancamentoResposta(lancamento.id, lancamento.grupoFamiliarId, lancamento.regraId,
                lancamento.contaId, lancamento.categoriaId, lancamento.titulo, lancamento.descricao,
                lancamento.valor, lancamento.tipo, lancamento.vencimento, lancamento.competencia,
                lancamento.numeroParcela, lancamento.totalParcelas, lancamento.estado, lancamento.origem,
                lancamento.excluirDosTotais, lancamento.metadados, lancamento.criadoEm, lancamento.atualizadoEm);
    }
}
