package com.financeiro.familias;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class FamiliaRepository {
    public record Membro(String userId, String name, String email, String role, Instant joinedAt) {
    }

    public record Convite(String id, String familiaId, String email, String role, Instant expiresAt,
            Instant acceptedAt, Instant revokedAt, Instant createdAt) {
        public boolean disponivel(Instant agora) {
            return acceptedAt == null && revokedAt == null && expiresAt.isAfter(agora);
        }
    }

    private final JdbcTemplate jdbc;

    public FamiliaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<FamiliaResposta> listar(String usuarioId) {
        return jdbc.query("SELECT h.id, h.name, m.role FROM households h JOIN household_members m ON m.household_id = h.id WHERE m.user_id = ? ORDER BY h.created_at, h.id",
                (resultado, indice) -> new FamiliaResposta(resultado.getString("id"), resultado.getString("name"),
                        resultado.getString("role")), usuarioId);
    }

    public Optional<FamiliaResposta> buscarVinculo(String usuarioId, String familiaId) {
        return jdbc.query("SELECT h.id, h.name, m.role FROM households h JOIN household_members m ON m.household_id = h.id WHERE m.user_id = ? AND h.id = ?",
                (resultado, indice) -> new FamiliaResposta(resultado.getString("id"), resultado.getString("name"),
                        resultado.getString("role")), usuarioId, familiaId).stream().findFirst();
    }

    public void criar(String id, String nome, Instant agora) {
        jdbc.update("INSERT INTO households (id, name, created_at) VALUES (?, ?, ?)", id, nome, Timestamp.from(agora));
        jdbc.update("""
                INSERT INTO household_settings (id, currency, timezone, theme_mode, density_mode, period_mode,
                    horizon_months, notification_days, notification_time, color_tokens, dashboard_config,
                    onboarding_state, updated_at)
                VALUES (?, 'BRL', 'America/Sao_Paulo', 'system', 'compact', 'due_date', 18, '[3,1]'::jsonb, '09:00',
                    '{"primary":"#00C16A","accent":"#3b82f6","positive":"#00C16A","negative":"#ef4444","neutral":"#64748b","background":"#ffffff","card":"#ffffff"}'::jsonb,
                    '{"visibleWidgets":["kpis","cashflow","projection","category","cards","limits","heatmap","upcoming"],"sortMode":"date_asc","defaultRange":"month","uiTheme":{"version":1,"preset":"default"}}'::jsonb,
                    jsonb_build_object('version',1,'status','new','completedSteps','[]'::jsonb,'updatedAt',?::text), ?)
                """, id, agora.toString(), Timestamp.from(agora));
    }

    public void adicionarMembro(String usuarioId, String familiaId, String papel, Instant agora) {
        jdbc.update("INSERT INTO household_members (user_id, household_id, role, created_at) VALUES (?, ?, ?, ?)",
                usuarioId, familiaId, papel, Timestamp.from(agora));
    }

    public List<Membro> membros(String familiaId) {
        return jdbc.query("SELECT u.id, u.name, u.email, m.role, m.created_at FROM household_members m JOIN auth_users u ON u.id = m.user_id WHERE m.household_id = ? ORDER BY m.created_at, u.id",
                (resultado, indice) -> new Membro(resultado.getString("id"), resultado.getString("name"),
                        resultado.getString("email"), resultado.getString("role"),
                        resultado.getTimestamp("created_at").toInstant()), familiaId);
    }

    public void bloquearFamilia(String familiaId) {
        jdbc.queryForObject("SELECT id FROM households WHERE id = ? FOR UPDATE", String.class, familiaId);
    }

    public void removerMembro(String usuarioId, String familiaId) {
        jdbc.update("DELETE FROM household_members WHERE user_id = ? AND household_id = ?", usuarioId, familiaId);
    }

    public void criarConvite(String id, String familiaId, String email, String papel, String hash, Instant expira, Instant agora) {
        jdbc.update("INSERT INTO household_invitations (id, household_id, email, role, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                id, familiaId, email, papel, hash, Timestamp.from(expira), Timestamp.from(agora));
    }

    public List<Convite> convites(String familiaId, Instant agora) {
        return jdbc.query("SELECT * FROM household_invitations WHERE household_id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at, id",
                this::convite, familiaId, Timestamp.from(agora));
    }

    public Optional<Convite> bloquearConvite(String hash) {
        return jdbc.query("SELECT * FROM household_invitations WHERE token_hash = ? FOR UPDATE", this::convite, hash)
                .stream().findFirst();
    }

    public Optional<Convite> buscarPorToken(String hash) {
        return jdbc.query("SELECT * FROM household_invitations WHERE token_hash = ?", this::convite, hash)
                .stream().findFirst();
    }

    public Optional<Convite> buscarConvite(String id, String familiaId) {
        return jdbc.query("SELECT * FROM household_invitations WHERE id = ? AND household_id = ?",
                this::convite, id, familiaId).stream().findFirst();
    }

    public void aceitar(String id, Instant agora) {
        jdbc.update("UPDATE household_invitations SET accepted_at = ? WHERE id = ?", Timestamp.from(agora), id);
    }

    public void revogar(String id, Instant agora) {
        jdbc.update("UPDATE household_invitations SET revoked_at = ? WHERE id = ?", Timestamp.from(agora), id);
    }

    private Convite convite(ResultSet resultado, int indice) throws SQLException {
        Timestamp aceito = resultado.getTimestamp("accepted_at");
        Timestamp revogado = resultado.getTimestamp("revoked_at");
        return new Convite(resultado.getString("id"), resultado.getString("household_id"), resultado.getString("email"),
                resultado.getString("role"), resultado.getTimestamp("expires_at").toInstant(),
                aceito == null ? null : aceito.toInstant(), revogado == null ? null : revogado.toInstant(),
                resultado.getTimestamp("created_at").toInstant());
    }
}
