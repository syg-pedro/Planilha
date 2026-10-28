package com.financeiro.contas;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "accounts")
public class Conta {
    @Id
    @Column(length = 64, nullable = false, updatable = false)
    String id;

    @Column(name = "household_id", length = 64, nullable = false, updatable = false)
    String grupoFamiliarId;

    @Column(name = "name", length = 100, nullable = false)
    String nome;

    @Column(name = "owner", length = 80, nullable = false)
    String responsavel;

    @Column(name = "type", length = 20, nullable = false)
    String tipo;

    @Column(name = "limit_total", precision = 14, scale = 2)
    BigDecimal limiteTotal;

    @Column(name = "closing_day")
    Integer diaFechamento;

    @Column(name = "due_day")
    Integer diaVencimento;

    @Column(name = "active", nullable = false)
    boolean ativa = true;

    protected Conta() {
    }
}
