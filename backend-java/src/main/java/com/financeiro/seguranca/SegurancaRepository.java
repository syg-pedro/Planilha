package com.financeiro.seguranca;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SegurancaRepository {
    public record Usuario(String id, String nome, String email, String senhaHash, boolean ativo) {
    }

    public record Sessao(String id, String usuarioId, String familiaId, String refreshHash,
            Instant expiraEm, Instant revogadaEm) {
        public boolean ativa(Instant agora) {
            return revogadaEm == null && expiraEm.isAfter(agora);
        }
    }

    private final JdbcTemplate jdbc;

    public SegurancaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Usuario> buscarUsuario(String id) {
        return jdbc.query("SELECT * FROM auth_users WHERE id = ?", this::usuario, id).stream().findFirst();
    }

    public Optional<Usuario> buscarPorEmail(String email) {
        return jdbc.query("SELECT * FROM auth_users WHERE email = ?", this::usuario, email).stream().findFirst();
    }

    public Optional<Usuario> bloquearUsuario(String id) {
        return jdbc.query("SELECT * FROM auth_users WHERE id = ? FOR UPDATE", this::usuario, id).stream().findFirst();
    }

    public void criarUsuario(Usuario usuario, Instant agora) {
        jdbc.update("INSERT INTO auth_users (id, name, email, password_hash, active, created_at) VALUES (?, ?, ?, ?, TRUE, ?)",
                usuario.id(), usuario.nome(), usuario.email(), usuario.senhaHash(), Timestamp.from(agora));
    }

    public Optional<Sessao> buscarSessao(String id) {
        return jdbc.query("SELECT * FROM auth_sessions WHERE id = ?", this::sessao, id).stream().findFirst();
    }

    public Optional<Sessao> bloquearRefresh(String hash) {
        return jdbc.query("SELECT * FROM auth_sessions WHERE refresh_hash = ? FOR UPDATE", this::sessao, hash)
                .stream().findFirst();
    }

    public Optional<Sessao> bloquearSessao(String id) {
        return jdbc.query("SELECT * FROM auth_sessions WHERE id = ? FOR UPDATE", this::sessao, id)
                .stream().findFirst();
    }

    public void criarSessao(Sessao sessao, Instant agora) {
        jdbc.update("INSERT INTO auth_sessions (id, user_id, household_id, refresh_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                sessao.id(), sessao.usuarioId(), sessao.familiaId(), sessao.refreshHash(),
                Timestamp.from(sessao.expiraEm()), Timestamp.from(agora));
    }

    public void renovarRefresh(String sessaoId, String hash) {
        jdbc.update("UPDATE auth_sessions SET refresh_hash = ? WHERE id = ?", hash, sessaoId);
    }

    public void selecionarFamilia(String sessaoId, String familiaId) {
        jdbc.update("UPDATE auth_sessions SET household_id = ? WHERE id = ?", familiaId, sessaoId);
    }

    public void revogarSessao(String sessaoId, Instant agora) {
        jdbc.update("UPDATE auth_sessions SET revoked_at = ? WHERE id = ?", Timestamp.from(agora), sessaoId);
    }

    private Usuario usuario(ResultSet resultado, int indice) throws SQLException {
        return new Usuario(resultado.getString("id"), resultado.getString("name"), resultado.getString("email"),
                resultado.getString("password_hash"), resultado.getBoolean("active"));
    }

    private Sessao sessao(ResultSet resultado, int indice) throws SQLException {
        Timestamp revogada = resultado.getTimestamp("revoked_at");
        return new Sessao(resultado.getString("id"), resultado.getString("user_id"), resultado.getString("household_id"),
                resultado.getString("refresh_hash"), resultado.getTimestamp("expires_at").toInstant(),
                revogada == null ? null : revogada.toInstant());
    }
}
