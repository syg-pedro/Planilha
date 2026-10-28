package com.financeiro.lancamentos;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Locale;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

final class FiltroLancamentos {
    private FiltroLancamentos() {
    }

    static Specification<Lancamento> de(String familiaId, ConsultaLancamentos consulta) {
        return (raiz, query, construtor) -> {
            var filtros = new ArrayList<Predicate>();
            filtros.add(construtor.equal(raiz.get("grupoFamiliarId"), familiaId));
            var data = raiz.<LocalDate>get(consulta.periodMode().equals("competence") ? "competencia" : "vencimento");
            if (consulta.from() != null) filtros.add(construtor.greaterThanOrEqualTo(data, consulta.from()));
            if (consulta.to() != null) filtros.add(construtor.lessThanOrEqualTo(data, consulta.to()));
            if (!consulta.kind().equals("all")) filtros.add(construtor.equal(raiz.get("tipo"), consulta.kind()));
            if (!consulta.status().equals("all")) filtros.add(construtor.equal(raiz.get("estado"), consulta.status()));
            if (!consulta.accountId().isEmpty()) filtros.add(consulta.accountId().equals("none")
                    ? construtor.isNull(raiz.get("contaId")) : construtor.equal(raiz.get("contaId"), consulta.accountId()));
            if (!consulta.categoryId().isEmpty()) filtros.add(consulta.categoryId().equals("none")
                    ? construtor.isNull(raiz.get("categoriaId")) : construtor.equal(raiz.get("categoriaId"), consulta.categoryId()));
            if (!consulta.search().isEmpty()) {
                String termo = "%" + consulta.search().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                filtros.add(construtor.or(construtor.like(construtor.lower(raiz.get("titulo")), termo, '\\'),
                        construtor.like(construtor.lower(raiz.get("descricao")), termo, '\\')));
            }
            return construtor.and(filtros.toArray(Predicate[]::new));
        };
    }
}
