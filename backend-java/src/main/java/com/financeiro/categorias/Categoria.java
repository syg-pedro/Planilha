package com.financeiro.categorias;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Categoria {
    @Id
    @Column(length = 64, nullable = false, updatable = false)
    String id;

    @Column(name = "household_id", length = 64, nullable = false, updatable = false)
    String grupoFamiliarId;

    @Column(name = "name", length = 100, nullable = false)
    String nome;

    @Column(name = "kind", length = 20, nullable = false)
    String tipo;

    @Column(name = "color", length = 7, nullable = false)
    String cor;

    protected Categoria() {
    }
}
