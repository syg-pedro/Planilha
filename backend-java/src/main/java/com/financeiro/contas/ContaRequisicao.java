package com.financeiro.contas;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ContaRequisicao(
        @NotBlank(message = "Informe o nome da conta.")
        @Size(max = 100, message = "Use até 100 caracteres.") String name,
        @Size(max = 80, message = "Use até 80 caracteres.") String owner,
        @NotBlank(message = "Informe o tipo da conta.")
        @Pattern(regexp = "bank|credit_card|benefit|external", message = "Escolha um tipo de conta válido.") String type,
        @DecimalMin(value = "0", message = "Informe um limite igual ou maior que zero.")
        @Digits(integer = 12, fraction = 2, message = "Use até 12 dígitos inteiros e 2 casas decimais.") BigDecimal limitTotal,
        @Min(value = 1, message = "Use um dia entre 1 e 31.")
        @Max(value = 31, message = "Use um dia entre 1 e 31.") Integer closingDay,
        @Min(value = 1, message = "Use um dia entre 1 e 31.")
        @Max(value = 31, message = "Use um dia entre 1 e 31.") Integer dueDay,
        Boolean active) {
    public ContaRequisicao {
        name = name == null ? null : name.trim();
        owner = owner == null ? "" : owner.trim();
    }
}
