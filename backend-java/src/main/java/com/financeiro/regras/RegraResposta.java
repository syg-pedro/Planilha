package com.financeiro.regras;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record RegraResposta(
        String id, String householdId, String title, String description, String accountId, String categoryId,
        BigDecimal amount, String kind, Integer dueDay, String frequency, LocalDate startsAt,
        LocalDate endsAt, boolean autoGenerate, Map<String, Object> metadata) {
    static RegraResposta de(Regra regra) {
        return new RegraResposta(regra.id, regra.grupoFamiliarId, regra.titulo, regra.descricao,
                regra.contaId, regra.categoriaId, regra.valor, regra.tipo, regra.diaVencimento,
                regra.frequencia, regra.inicio, regra.fim, regra.gerarAutomaticamente, regra.metadados);
    }
}
