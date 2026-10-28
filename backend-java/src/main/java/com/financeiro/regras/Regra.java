package com.financeiro.regras;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "rules")
public class Regra {
    @Id
    @Column(length = 64, nullable = false, updatable = false)
    String id;

    @Column(name = "household_id", length = 64, nullable = false, updatable = false)
    String grupoFamiliarId;

    @Column(name = "title", length = 100, nullable = false)
    String titulo;

    @Column(name = "description", nullable = false, columnDefinition = "text")
    String descricao;

    @Column(name = "account_id", length = 64)
    String contaId;

    @Column(name = "category_id", length = 64)
    String categoriaId;

    @Column(name = "amount", precision = 14, scale = 2, nullable = false)
    BigDecimal valor;

    @Column(name = "kind", length = 20, nullable = false)
    String tipo;

    @Column(name = "due_day")
    Integer diaVencimento;

    @Column(name = "frequency", length = 20, nullable = false)
    String frequencia;

    @Column(name = "starts_at", nullable = false)
    LocalDate inicio;

    @Column(name = "ends_at")
    LocalDate fim;

    @Column(name = "auto_generate", nullable = false)
    boolean gerarAutomaticamente = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    Map<String, Object> metadados;

    protected Regra() {
    }
}
