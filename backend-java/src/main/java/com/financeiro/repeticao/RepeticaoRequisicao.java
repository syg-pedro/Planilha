package com.financeiro.repeticao;

import com.financeiro.lancamentos.LancamentoRequisicao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RepeticaoRequisicao(@NotNull @Valid LancamentoRequisicao entry,
        @NotNull @Min(1) @Max(120) Integer months) {
}
