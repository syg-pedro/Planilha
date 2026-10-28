package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

class ConsultaRelatorioTest {
    @Test
    void normalizaConsultaSemExigirFiltros() {
        var consulta = new ConsultaRelatorio(null, null, null, null, null, null, null, null);
        try (var fabrica = Validation.buildDefaultValidatorFactory()) {
            assertThat(fabrica.getValidator().validate(consulta)).isEmpty();
        }
        assertThat(consulta.periodMode()).isEqualTo("due_date");
        assertThat(consulta.kind()).isEqualTo("all");
        assertThat(consulta.status()).isEqualTo("all");
        assertThat(consulta.search()).isEmpty();
    }

    @Test
    void rejeitaPeriodoInvertidoETiposDeFiltroDesconhecidos() {
        var consulta = new ConsultaRelatorio(LocalDate.parse("2026-02-02"), LocalDate.parse("2026-02-01"),
                "outro", null, null, "outro", "outro", null);
        try (var fabrica = Validation.buildDefaultValidatorFactory()) {
            assertThat(fabrica.getValidator().validate(consulta))
                    .extracting(violacao -> violacao.getPropertyPath().toString())
                    .contains("periodMode", "kind", "status", "periodoValido");
        }
    }
}
