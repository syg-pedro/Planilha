package com.financeiro.lancamentos;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "entries")
public class Lancamento {
    @Id
    @Column(length = 64, nullable = false, updatable = false)
    String id;

    @Column(name = "household_id", length = 64, nullable = false, updatable = false)
    String grupoFamiliarId;

    @Column(name = "rule_id", length = 64)
    String regraId;

    @Column(name = "account_id", length = 64)
    String contaId;

    @Column(name = "category_id", length = 64)
    String categoriaId;

    @Column(name = "title", length = 100, nullable = false)
    String titulo;

    @Column(name = "description", nullable = false, columnDefinition = "text")
    String descricao;

    @Column(name = "amount", precision = 14, scale = 2, nullable = false)
    BigDecimal valor;

    @Column(name = "kind", length = 20, nullable = false)
    String tipo;

    @Column(name = "due_date", nullable = false)
    LocalDate vencimento;

    @Column(name = "competence_date", nullable = false)
    LocalDate competencia;

    @Column(name = "installment_index")
    Integer numeroParcela;

    @Column(name = "installment_total")
    Integer totalParcelas;

    @Column(name = "status", length = 20, nullable = false)
    String estado = "pending";

    @Column(name = "origin", length = 20, nullable = false)
    String origem = "manual";

    @Column(name = "exclude_from_calc", nullable = false)
    boolean excluirDosTotais;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    Map<String, Object> metadados;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant criadoEm;

    @Column(name = "updated_at", nullable = false)
    Instant atualizadoEm;

    protected Lancamento() {
    }
}
