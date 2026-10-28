package com.financeiro.desejos;

import java.math.BigDecimal;
import java.net.URI;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DesejoRequisicao(
        @NotBlank(message = "Informe o nome do desejo.") @Size(max = 100, message = "Use até 100 caracteres.") String name,
        @DecimalMin(value = "0", message = "Informe um preço igual ou maior que zero.")
        @Digits(integer = 12, fraction = 2, message = "Use até 12 dígitos inteiros e 2 casas decimais.") BigDecimal price,
        @Size(max = 2048, message = "Use um endereço com até 2048 caracteres.") String url,
        @Size(max = 2048, message = "Use um endereço com até 2048 caracteres.") String imageUrl,
        @Size(max = 5000, message = "Use até 5000 caracteres nas observações.") String notes,
        @Pattern(regexp = "high|medium|low", message = "Escolha uma prioridade válida.") String priority,
        @Pattern(regexp = "want|saving|bought", message = "Escolha uma situação válida.") String status,
        @Size(max = 100, message = "Use até 100 caracteres na categoria.") String category) {
    public DesejoRequisicao {
        name = name == null ? null : name.trim();
        url = opcional(url);
        imageUrl = opcional(imageUrl);
        notes = opcional(notes);
        category = opcional(category);
    }

    @AssertTrue(message = "Use endereços completos iniciados por http:// ou https://.")
    public boolean isUrlsValidas() {
        return urlValida(url) && urlValida(imageUrl);
    }

    private static boolean urlValida(String valor) {
        if (valor == null) return true;
        try {
            URI endereco = URI.create(valor);
            return ("http".equalsIgnoreCase(endereco.getScheme()) || "https".equalsIgnoreCase(endereco.getScheme()))
                    && endereco.getHost() != null && endereco.getRawUserInfo() == null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static String opcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
