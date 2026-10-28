package com.financeiro.familias;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class FamiliaRequisicao {
    private FamiliaRequisicao() {
    }

    public record Convite(
            @NotBlank(message = "Informe o e-mail.") @Email(message = "Informe um e-mail válido.")
            @Size(max = 254, message = "Use até 254 caracteres.") String email,
            @Pattern(regexp = "owner|member", message = "Escolha proprietário ou membro.") String role) {
        public Convite {
            email = email == null ? null : email.trim();
            role = role == null ? "member" : role;
        }
    }

    public record Aceite(
            @NotBlank(message = "Informe o convite.") @Size(max = 128, message = "Informe um convite válido.") String token) {
    }
}
