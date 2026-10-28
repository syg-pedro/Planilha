package com.financeiro.compatibilidade;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LoteRequisicao<T>(
        @NotNull @Size(max = 1000) List<@NotNull @Valid Alteracao<T>> upserts,
        @NotNull @Size(max = 1000) List<@NotBlank @Size(max = 64) String> deletes) {
    public record Alteracao<T>(@Size(min = 1, max = 64) String id, @NotNull @Valid T data) {
    }
}
