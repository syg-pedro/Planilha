package com.financeiro.seguranca;

import java.time.Instant;

import com.financeiro.familias.FamiliaResposta;

public record SessaoResposta(String accessToken, Instant expiresAt, UsuarioResposta user, FamiliaResposta family) {
    public record UsuarioResposta(String id, String name, String email) {
    }

    public record Atual(UsuarioResposta user, FamiliaResposta family) {
    }
}
