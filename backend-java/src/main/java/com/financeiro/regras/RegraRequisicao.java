package com.financeiro.regras;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.OptBoolean;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegraRequisicao(
        @NotBlank(message = "Informe o título da regra.")
        @Size(max = 100, message = "Use até 100 caracteres.") String title,
        String description,
        @Size(max = 64, message = "Informe uma conta válida.") String accountId,
        @Size(max = 64, message = "Informe uma categoria válida.") String categoryId,
        @NotNull(message = "Informe o valor.")
        @DecimalMin(value = "0", message = "Use um valor igual ou maior que zero.")
        @Digits(integer = 12, fraction = 2, message = "Use até 12 dígitos inteiros e 2 casas decimais.") BigDecimal amount,
        @NotBlank(message = "Informe o tipo.")
        @Pattern(regexp = "income|expense", message = "Escolha receita ou despesa.") String kind,
        @Min(value = 1, message = "Use um dia entre 1 e 31.")
        @Max(value = 31, message = "Use um dia entre 1 e 31.") Integer dueDay,
        @NotBlank(message = "Informe a frequência.")
        @Pattern(regexp = "monthly|manual", message = "Escolha mensal ou manual.") String frequency,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "uuuu-MM-dd", lenient = OptBoolean.FALSE) LocalDate startsAt,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "uuuu-MM-dd", lenient = OptBoolean.FALSE) LocalDate endsAt,
        Boolean autoGenerate,
        Map<String, Object> metadata) {
    public RegraRequisicao {
        title = title == null ? null : title.trim();
        description = description == null ? "" : description;
        accountId = accountId == null ? null : accountId.trim();
        categoryId = categoryId == null ? null : categoryId.trim();
    }
}
