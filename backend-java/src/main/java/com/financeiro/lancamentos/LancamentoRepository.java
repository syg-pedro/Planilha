package com.financeiro.lancamentos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LancamentoRepository extends JpaRepository<Lancamento, String>, JpaSpecificationExecutor<Lancamento> {
    @Query("select lancamento from Lancamento lancamento where lancamento.grupoFamiliarId = :grupoFamiliarId order by lancamento.vencimento, lancamento.id")
    List<Lancamento> listarPorFamilia(@Param("grupoFamiliarId") String grupoFamiliarId);

    @Query("select lancamento from Lancamento lancamento where lancamento.id = :id and lancamento.grupoFamiliarId = :grupoFamiliarId")
    Optional<Lancamento> buscarPorIdEFamilia(@Param("id") String id, @Param("grupoFamiliarId") String grupoFamiliarId);
}
