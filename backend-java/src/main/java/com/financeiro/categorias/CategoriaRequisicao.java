package com.financeiro.categorias;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoriaRequisicao(
        @NotBlank(message = "Informe o nome da categoria.") @Size(max = 100, message = "Use até 100 caracteres.") String name,
        @NotBlank(message = "Informe o tipo da categoria.")
        @Pattern(regexp = "income|expense", message = "Escolha receita ou despesa.") String kind,
        @NotBlank(message = "Informe a cor da categoria.")
        @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "Informe uma cor no formato #RRGGBB.") String color) {
    public CategoriaRequisicao {
        name = name == null ? null : name.trim();
    }
}
