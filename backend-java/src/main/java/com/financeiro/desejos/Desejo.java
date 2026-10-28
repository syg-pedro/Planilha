package com.financeiro.desejos;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "wish_items")
public class Desejo {
    @Id
    @Column(length = 64, nullable = false, updatable = false)
    String id;
    @Column(name = "household_id", length = 64, nullable = false, updatable = false)
    String grupoFamiliarId;
    @Column(name = "name", length = 100, nullable = false)
    String nome;
    @Column(name = "price", precision = 14, scale = 2)
    BigDecimal preco;
    @Column(length = 2048)
    String url;
    @Column(name = "image_url", length = 2048)
    String imagemUrl;
    @Column(name = "notes", columnDefinition = "text")
    String observacoes;
    @Column(name = "priority", length = 20, nullable = false)
    String prioridade = "medium";
    @Column(name = "status", length = 20, nullable = false)
    String estado = "want";
    @Column(name = "category", length = 100)
    String categoria;
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant criadoEm;
    @Column(name = "updated_at", nullable = false)
    Instant atualizadoEm;

    protected Desejo() {
    }
}
