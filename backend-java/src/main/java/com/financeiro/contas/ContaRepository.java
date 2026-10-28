package com.financeiro.contas;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContaRepository extends JpaRepository<Conta, String> {
    @Query("select conta from Conta conta where conta.grupoFamiliarId = :grupoFamiliarId order by conta.nome, conta.id")
    List<Conta> listarPorFamilia(@Param("grupoFamiliarId") String grupoFamiliarId);

    @Query("select conta from Conta conta where conta.id = :id and conta.grupoFamiliarId = :grupoFamiliarId")
    Optional<Conta> buscarPorIdEFamilia(@Param("id") String id, @Param("grupoFamiliarId") String grupoFamiliarId);
}
