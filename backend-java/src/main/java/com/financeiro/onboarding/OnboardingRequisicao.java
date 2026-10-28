package com.financeiro.onboarding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.OptBoolean;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OnboardingRequisicao(
        @NotNull(message = "Informe a versão.") @Min(value = 1, message = "Use a versão 1.")
        @Max(value = 1, message = "Use a versão 1.") Integer version,
        @NotNull(message = "Informe as contas.") @Size(max = 100, message = "Use até 100 contas.")
        List<@NotNull(message = "Informe uma conta válida.") @Valid ContaImportada> accounts,
        @NotNull(message = "Informe as categorias.") @Size(max = 200, message = "Use até 200 categorias.")
        List<@NotNull(message = "Informe uma categoria válida.") @Valid CategoriaImportada> categories,
        @NotNull(message = "Informe as regras.") @Size(max = 500, message = "Use até 500 regras.")
        List<@NotNull(message = "Informe uma regra válida.") @Valid RegraImportada> rules,
        @NotNull(message = "Informe os lançamentos.") @Size(max = 1000, message = "Use até 1000 lançamentos.")
        List<@NotNull(message = "Informe um lançamento válido.") @Valid LancamentoImportado> entries) {
    public record ContaImportada(
            @NotNull(message = "Informe a linha.") @Min(value = 2, message = "Use uma linha entre 2 e 1002.")
            @Max(value = 1002, message = "Use uma linha entre 2 e 1002.") Integer sourceRow,
            @NotBlank(message = "Informe o nome.") @Size(max = 100, message = "Use até 100 caracteres.") String name,
            @NotBlank(message = "Informe o tipo.")
            @Pattern(regexp = "bank|credit_card|benefit|external", message = "Escolha um tipo de conta válido.") String type,
            @NotNull(message = "Informe o responsável.") @Size(max = 80, message = "Use até 80 caracteres.") String owner,
            @DecimalMin(value = "0", message = "Use um limite igual ou maior que zero.")
            @Digits(integer = 12, fraction = 2, message = "Use até 12 dígitos inteiros e 2 casas decimais.") BigDecimal limitTotal,
            @Min(value = 1, message = "Use um dia entre 1 e 31.") @Max(value = 31, message = "Use um dia entre 1 e 31.") Integer closingDay,
            @Min(value = 1, message = "Use um dia entre 1 e 31.") @Max(value = 31, message = "Use um dia entre 1 e 31.") Integer dueDay) {
        public ContaImportada {
            name = name == null ? null : name.trim();
            owner = owner == null ? null : owner.trim();
        }
    }

    public record CategoriaImportada(
            @NotNull(message = "Informe a linha.") @Min(value = 2, message = "Use uma linha entre 2 e 1002.")
            @Max(value = 1002, message = "Use uma linha entre 2 e 1002.") Integer sourceRow,
            @NotBlank(message = "Informe o nome.") @Size(max = 100, message = "Use até 100 caracteres.") String name,
            @NotBlank(message = "Informe o tipo.") @Pattern(regexp = "income|expense", message = "Escolha receita ou despesa.") String kind,
            @NotBlank(message = "Informe a cor.") @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "Use uma cor hexadecimal com seis dígitos.") String color) {
        public CategoriaImportada {
            name = name == null ? null : name.trim();
        }
    }

    public record RegraImportada(
            @NotNull(message = "Informe a linha.") @Min(value = 2, message = "Use uma linha entre 2 e 1002.")
            @Max(value = 1002, message = "Use uma linha entre 2 e 1002.") Integer sourceRow,
            @NotBlank(message = "Informe o título.") @Size(max = 100, message = "Use até 100 caracteres.") String title,
            @NotBlank(message = "Informe o tipo.") @Pattern(regexp = "income|expense", message = "Escolha receita ou despesa.") String kind,
            @NotNull(message = "Informe o valor.") @DecimalMin(value = "0", inclusive = false, message = "Use um valor maior que zero.")
            @Digits(integer = 12, fraction = 2, message = "Use até 12 dígitos inteiros e 2 casas decimais.") BigDecimal amount,
            @NotNull(message = "Informe o vencimento.") @Min(value = 1, message = "Use um dia entre 1 e 31.")
            @Max(value = 31, message = "Use um dia entre 1 e 31.") Integer dueDay,
            @Size(max = 100, message = "Use até 100 caracteres.") String accountName,
            @Size(max = 100, message = "Use até 100 caracteres.") String categoryName) {
        public RegraImportada {
            title = title == null ? null : title.trim();
            accountName = referencia(accountName);
            categoryName = referencia(categoryName);
        }
    }

    public record LancamentoImportado(
            @NotNull(message = "Informe a linha.") @Min(value = 2, message = "Use uma linha entre 2 e 1002.")
            @Max(value = 1002, message = "Use uma linha entre 2 e 1002.") Integer sourceRow,
            @NotBlank(message = "Informe o título.") @Size(max = 100, message = "Use até 100 caracteres.") String title,
            @NotBlank(message = "Informe o tipo.") @Pattern(regexp = "income|expense", message = "Escolha receita ou despesa.") String kind,
            @NotNull(message = "Informe o valor.") @DecimalMin(value = "0", inclusive = false, message = "Use um valor maior que zero.")
            @Digits(integer = 12, fraction = 2, message = "Use até 12 dígitos inteiros e 2 casas decimais.") BigDecimal amount,
            @NotNull(message = "Informe a data.")
            @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "uuuu-MM-dd", lenient = OptBoolean.FALSE) LocalDate dueDate,
            @Size(max = 100, message = "Use até 100 caracteres.") String accountName,
            @Size(max = 100, message = "Use até 100 caracteres.") String categoryName,
            @NotBlank(message = "Informe a situação.") @Pattern(regexp = "pending|paid|review", message = "Escolha uma situação válida.") String status,
            @Min(value = 1, message = "Use parcelas entre 1 e 999.") @Max(value = 999, message = "Use parcelas entre 1 e 999.") Integer installmentIndex,
            @Min(value = 1, message = "Use parcelas entre 1 e 999.") @Max(value = 999, message = "Use parcelas entre 1 e 999.") Integer installmentTotal) {
        public LancamentoImportado {
            title = title == null ? null : title.trim();
            accountName = referencia(accountName);
            categoryName = referencia(categoryName);
            if ((installmentIndex == null) != (installmentTotal == null)
                    || (installmentIndex != null && installmentIndex > installmentTotal)) {
                throw new IllegalArgumentException("Informe as duas parcelas ou deixe ambas vazias.");
            }
        }
    }

    private static String referencia(String nome) {
        return nome == null || nome.isBlank() ? null : nome.trim();
    }
}
