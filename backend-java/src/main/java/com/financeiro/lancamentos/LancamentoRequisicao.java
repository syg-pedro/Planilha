package com.financeiro.lancamentos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.OptBoolean;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LancamentoRequisicao(
        @Size(max = 64, message = "Informe uma regra válida.") String ruleId,
        @Size(max = 64, message = "Informe uma conta válida.") String accountId,
        @Size(max = 64, message = "Informe uma categoria válida.") String categoryId,
        @NotBlank(message = "Informe a descrição do lançamento.")
        @Size(max = 100, message = "Use até 100 caracteres.") String title,
        String description,
        @NotNull(message = "Informe o valor.") @DecimalMin(value = "0", message = "Use um valor igual ou maior que zero.")
        @Digits(integer = 12, fraction = 2, message = "Use até 12 dígitos inteiros e 2 casas decimais.") BigDecimal amount,
        @NotBlank(message = "Informe o tipo.")
        @Pattern(regexp = "income|expense", message = "Escolha receita ou despesa.") String kind,
        @NotNull(message = "Informe o vencimento.") @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "uuuu-MM-dd", lenient = OptBoolean.FALSE) LocalDate dueDate,
        @NotNull(message = "Informe a competência.") @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "uuuu-MM-dd", lenient = OptBoolean.FALSE) LocalDate competenceDate,
        @Min(value = 1, message = "Informe uma parcela maior que zero.") Integer installmentIndex,
        @Min(value = 1, message = "Informe o total de parcelas maior que zero.") Integer installmentTotal,
        @Pattern(regexp = "pending|paid|review", message = "Escolha uma situação válida.") String status,
        @Pattern(regexp = "auto|manual|imported", message = "Escolha uma origem válida.") String origin,
        Boolean excludeFromCalc,
        Map<String, Object> metadata) {
    public LancamentoRequisicao {
        ruleId = ruleId == null ? null : ruleId.trim();
        accountId = accountId == null ? null : accountId.trim();
        categoryId = categoryId == null ? null : categoryId.trim();
        title = title == null ? null : title.trim();
        description = description == null ? "" : description;
        competenceDate = competenceDate == null ? dueDate : competenceDate;
        if ((installmentIndex == null) != (installmentTotal == null)
                || (installmentIndex != null && installmentIndex > installmentTotal)) {
            throw new IllegalArgumentException("Informe numero e total de parcelas validos.");
        }
    }
}
