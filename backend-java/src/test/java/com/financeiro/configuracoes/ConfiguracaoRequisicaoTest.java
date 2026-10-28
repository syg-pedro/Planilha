package com.financeiro.configuracoes;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import com.financeiro.configuracoes.ConfiguracaoRequisicao.Cores;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Introducao;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Painel;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Tema;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ConfiguracaoRequisicaoTest {
    private static ValidatorFactory fabrica;
    private static Validator validator;

    @BeforeAll
    static void preparar() {
        fabrica = Validation.buildDefaultValidatorFactory();
        validator = fabrica.getValidator();
    }

    @AfterAll
    static void encerrar() {
        fabrica.close();
    }

    @Test
    void aceitaPreferenciasLocaisComCoresEIntroducaoTipadas() {
        assertThat(validator.validate(requisicao(18, "America/Sao_Paulo"))).isEmpty();
        assertThat(validator.validate(new Tema("custom", "compact", cores()))).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 121})
    void rejeitaHorizonteForaDoContrato(int horizonte) {
        assertThat(validator.validate(requisicao(horizonte, "America/Sao_Paulo")))
                .extracting(violacao -> violacao.getPropertyPath().toString()).contains("horizonMonths");
    }

    @Test
    void rejeitaFusoTemaECoresInvalidos() {
        assertThat(validator.validate(requisicao(18, "Fuso/Inventado")))
                .extracting(violacao -> violacao.getPropertyPath().toString()).contains("fusoValido");
        assertThat(validator.validate(new Tema("inventado", "compact", cores())))
                .extracting(violacao -> violacao.getPropertyPath().toString()).contains("themeMode");
        var coresInvalidas = new Cores("url(javascript:alert(1))", "#000", "#000", "#000", "#000", "#000", "#000");
        assertThat(validator.validate(new Tema("custom", "compact", coresInvalidas)))
                .extracting(violacao -> violacao.getPropertyPath().toString()).contains("colorTokens.primary");
    }

    static ConfiguracaoRequisicao requisicao(int horizonte, String fuso) {
        return new ConfiguracaoRequisicao("BRL", fuso, "system", "compact", "due_date", horizonte,
                List.of(3, 1), "09:00", cores(), new Painel(List.of("kpis"), "date_asc", "month", null),
                new Introducao(1, "new", List.of(), null));
    }

    static Cores cores() {
        return new Cores("#00C16A", "#3b82f6", "#00C16A", "#ef4444", "#64748b", "#ffffff", "#ffffff");
    }
}
