package com.financeiro.configuracoes;

import java.time.Instant;
import java.util.List;

import com.financeiro.configuracoes.ConfiguracaoRequisicao.Cores;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Introducao;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Painel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "household_settings")
public class Configuracao {
    @Id
    @Column(length = 64, nullable = false, updatable = false)
    String id;
    @Column(name = "currency", length = 3, nullable = false)
    String moeda;
    @Column(name = "timezone", length = 60, nullable = false)
    String fusoHorario;
    @Column(name = "theme_mode", length = 20, nullable = false)
    String tema;
    @Column(name = "density_mode", length = 20, nullable = false)
    String densidade;
    @Column(name = "period_mode", length = 20, nullable = false)
    String criterioPeriodo;
    @Column(name = "horizon_months", nullable = false)
    int horizonteMeses;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notification_days", columnDefinition = "jsonb", nullable = false)
    List<Integer> diasNotificacao;
    @Column(name = "notification_time", length = 5, nullable = false)
    String horarioNotificacao;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "color_tokens", columnDefinition = "jsonb", nullable = false)
    Cores cores;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dashboard_config", columnDefinition = "jsonb", nullable = false)
    Painel painel;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "onboarding_state", columnDefinition = "jsonb", nullable = false)
    Introducao introducao;
    @Column(name = "updated_at", nullable = false)
    Instant atualizadoEm;

    protected Configuracao() {
    }
}
