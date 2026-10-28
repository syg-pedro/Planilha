package com.financeiro.importacao;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CsvRequisicao(
        @NotBlank(message = "Selecione um arquivo CSV preenchido.")
        @Size(max = 1048576, message = "Use um CSV com até 1048576 caracteres.") String csvText,
        @Size(max = 64, message = "Informe uma conta válida.") String accountId) {
}
