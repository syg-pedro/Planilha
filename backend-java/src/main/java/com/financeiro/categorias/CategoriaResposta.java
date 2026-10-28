package com.financeiro.categorias;

public record CategoriaResposta(String id, String householdId, String name, String kind, String color) {
    static CategoriaResposta de(Categoria categoria) {
        return new CategoriaResposta(categoria.id, categoria.grupoFamiliarId, categoria.nome, categoria.tipo, categoria.cor);
    }
}
