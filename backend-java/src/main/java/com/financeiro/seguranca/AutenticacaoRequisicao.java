package com.financeiro.seguranca;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AutenticacaoRequisicao {
    private AutenticacaoRequisicao() {
    }

    public record Cadastro(
            @NotBlank(message = "Informe seu nome.") @Size(max = 100, message = "Use até 100 caracteres.") String name,
            @NotBlank(message = "Informe o e-mail.") @Email(message = "Informe um e-mail válido.")
            @Size(max = 254, message = "Use até 254 caracteres.") String email,
            @NotBlank(message = "Informe a senha.") @Size(min = 8, max = 72, message = "Use uma senha entre 8 e 72 caracteres.") String password,
            @NotBlank(message = "Informe o nome da família.") @Size(max = 100, message = "Use até 100 caracteres.") String familyName) {
        public Cadastro {
            name = name == null ? null : name.trim();
            email = email == null ? null : email.trim();
            familyName = familyName == null ? null : familyName.trim();
        }
    }

    public record Login(
            @NotBlank(message = "Informe o e-mail.") @Email(message = "Informe um e-mail válido.")
            @Size(max = 254, message = "Use até 254 caracteres.") String email,
            @NotBlank(message = "Informe a senha.") @Size(max = 72, message = "Use até 72 caracteres.") String password) {
    }

    public record Selecao(
            @NotBlank(message = "Escolha uma família.") @Size(max = 64, message = "Escolha uma família válida.") String id) {
    }
}
