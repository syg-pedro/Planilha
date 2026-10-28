package com.financeiro.desejos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DesejoRepository extends JpaRepository<Desejo, String> {
    @Query("select desejo from Desejo desejo where desejo.grupoFamiliarId = :familia order by desejo.criadoEm, desejo.id")
    List<Desejo> listarPorFamilia(@Param("familia") String familia);

    @Query("select desejo from Desejo desejo where desejo.id = :id and desejo.grupoFamiliarId = :familia")
    Optional<Desejo> buscarPorIdEFamilia(@Param("id") String id, @Param("familia") String familia);
}
