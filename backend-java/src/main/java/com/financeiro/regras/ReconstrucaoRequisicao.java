package com.financeiro.regras;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ReconstrucaoRequisicao(
        @Min(value = 1, message = "Use um horizonte entre 1 e 120 meses.")
        @Max(value = 120, message = "Use um horizonte entre 1 e 120 meses.") Integer months) {
}
