package com.financeiro.relatorios;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

public record ConsultaRelatorio(
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @Pattern(regexp = "due_date|competence", message = "Escolha vencimento ou competência.") String periodMode,
        @Size(max = 100, message = "Informe uma conta válida.") String accountId,
        @Size(max = 100, message = "Informe uma categoria válida.") String categoryId,
        @Pattern(regexp = "all|income|expense", message = "Escolha receita, despesa ou todos.") String kind,
        @Pattern(regexp = "all|pending|paid|review", message = "Escolha uma situação válida.") String status,
        @Size(max = 200, message = "Use até 200 caracteres na busca.") String search) {
    public ConsultaRelatorio {
        periodMode = periodMode == null ? "due_date" : periodMode;
        accountId = accountId == null ? "" : accountId.trim();
        categoryId = categoryId == null ? "" : categoryId.trim();
        kind = kind == null ? "all" : kind;
        status = status == null ? "all" : status;
        search = search == null ? "" : search.trim();
    }

    @AssertTrue(message = "A data final deve ser igual ou posterior à inicial.")
    public boolean isPeriodoValido() {
        return from == null || to == null || !to.isBefore(from);
    }

    public ConsultaRelatorio noIntervalo(LocalDate inicio, LocalDate fim) {
        LocalDate primeiro = from == null || from.isBefore(inicio) ? inicio : from;
        LocalDate ultimo = to == null || to.isAfter(fim) ? fim : to;
        return new ConsultaRelatorio(primeiro, ultimo, periodMode, accountId, categoryId, kind, status, search);
    }
}
