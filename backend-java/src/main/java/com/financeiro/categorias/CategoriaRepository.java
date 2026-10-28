package com.financeiro.categorias;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoriaRepository extends JpaRepository<Categoria, String> {
    @Query("select categoria from Categoria categoria where categoria.grupoFamiliarId = :grupoFamiliarId order by categoria.nome, categoria.id")
    List<Categoria> listarPorFamilia(@Param("grupoFamiliarId") String grupoFamiliarId);

    @Query("select categoria from Categoria categoria where categoria.id = :id and categoria.grupoFamiliarId = :grupoFamiliarId")
    Optional<Categoria> buscarPorIdEFamilia(@Param("id") String id, @Param("grupoFamiliarId") String grupoFamiliarId);
}
