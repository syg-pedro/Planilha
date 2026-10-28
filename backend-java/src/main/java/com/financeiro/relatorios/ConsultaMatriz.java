package com.financeiro.relatorios;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ConsultaMatriz(
        @Pattern(regexp = "(19|20|21)[0-9]{2}-(0[1-9]|1[0-2])", message = "Informe um mês válido no formato ano-mês.") String startMonth,
        @Min(value = 1, message = "Use entre 1 e 24 meses.") @Max(value = 24, message = "Use entre 1 e 24 meses.") Integer count,
        @Pattern(regexp = "due_date|competence", message = "Escolha vencimento ou competência.") String periodMode,
        @Size(max = 100, message = "Informe uma conta válida.") String accountId,
        @Pattern(regexp = "all|income|expense", message = "Escolha receita, despesa ou todos.") String kind,
        @Pattern(regexp = "all|pending|paid|review", message = "Escolha uma situação válida.") String status,
        @Size(max = 200, message = "Use até 200 caracteres na busca.") String search) {
    public ConsultaMatriz {
        count = count == null ? 12 : count;
        accountId = accountId == null ? "" : accountId.trim();
        kind = kind == null ? "all" : kind;
        status = status == null ? "all" : status;
        search = search == null ? "" : search.trim();
    }

    public boolean filtrada() {
        return !accountId.isEmpty() || !"all".equals(kind) || !"all".equals(status) || !search.isEmpty();
    }
}
