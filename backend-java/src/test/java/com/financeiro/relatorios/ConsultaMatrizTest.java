package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ConsultaMatrizTest {
    @ParameterizedTest
    @ValueSource(strings = {"2028-00", "2028-13", "2028-1", "0000-01", "texto"})
    void rejeitaMesInvalido(String mes) {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(new ConsultaMatriz(mes, 12, null, null, null, null, null)))
                    .anySatisfy(erro -> assertThat(erro.getPropertyPath().toString()).isEqualTo("startMonth"));
        }
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 25})
    void limitaHorizonteAteVinteQuatroMeses(int meses) {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(new ConsultaMatriz("2028-01", meses, null, null, null, null, null)))
                    .anySatisfy(erro -> assertThat(erro.getPropertyPath().toString()).isEqualTo("count"));
        }
    }

    @Test
    void aceitaIntervaloMaximoERejeitaFiltrosDesconhecidos() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validador = factory.getValidator();
            assertThat(validador.validate(new ConsultaMatriz("2028-01", 24, "competence", "none", "expense", "review", ""))).isEmpty();
            assertThat(validador.validate(new ConsultaMatriz("2028-01", 12, "other", null, "other", "other", null)))
                    .hasSize(3);
        }
    }
}
