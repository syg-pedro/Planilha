package com.financeiro.regras;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RegraRepository extends JpaRepository<Regra, String> {
    @Query("select regra from Regra regra where regra.grupoFamiliarId = :grupoFamiliarId order by regra.titulo, regra.id")
    List<Regra> listarPorFamilia(@Param("grupoFamiliarId") String grupoFamiliarId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select regra from Regra regra where regra.grupoFamiliarId = :grupoFamiliarId order by regra.id")
    List<Regra> listarComBloqueio(@Param("grupoFamiliarId") String grupoFamiliarId);

    @Query("select regra from Regra regra where regra.id = :id and regra.grupoFamiliarId = :grupoFamiliarId")
    Optional<Regra> buscarPorIdEFamilia(@Param("id") String id, @Param("grupoFamiliarId") String grupoFamiliarId);
}
