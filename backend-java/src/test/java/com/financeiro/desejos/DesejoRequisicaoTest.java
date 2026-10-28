package com.financeiro.desejos;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.stream.Stream;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

class DesejoRequisicaoTest {
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
    void aceitaOpcionaisENormalizaNome() {
        var requisicao = new DesejoRequisicao("  Desejo fictício  ", null, " ", null, " ", null, null, " ");
        assertThat(validator.validate(requisicao)).isEmpty();
        assertThat(requisicao.name()).isEqualTo("Desejo fictício");
        assertThat(requisicao.url()).isNull();
        assertThat(requisicao.notes()).isNull();
        assertThat(requisicao.category()).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://example.test/item", "https://example.test/item?q=ficticio#detalhe", "HTTPS://example.test/image.png"})
    void aceitaSomenteEnderecosWebSemConsultarRede(String url) {
        assertThat(validator.validate(new DesejoRequisicao("Desejo fictício", new BigDecimal("0.10"),
                url, url, null, "medium", "want", null))).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"javascript:alert(1)", "data:image/png;base64,AAAA", "file:///C:/arquivo", "/imagem.png",
            "https://", "https://usuario:senha@example.test/imagem", "https://example.test/com espaço"})
    void rejeitaProtocolosExecutaveisERelativos(String url) {
        assertThat(validator.validate(new DesejoRequisicao("Desejo fictício", null, url, null,
                null, null, null, null))).extracting(violacao -> violacao.getPropertyPath().toString())
                .contains("urlsValidas");
        assertThat(validator.validate(new DesejoRequisicao("Desejo fictício", null, null, url,
                null, null, null, null))).isNotEmpty();
    }

    @ParameterizedTest
    @MethodSource("invalidas")
    void rejeitaEntradasForaDoContrato(DesejoRequisicao requisicao, String campo) {
        assertThat(validator.validate(requisicao)).extracting(violacao -> violacao.getPropertyPath().toString())
                .contains(campo);
    }

    static Stream<Arguments> invalidas() {
        return Stream.of(
                Arguments.of(new DesejoRequisicao(" ", null, null, null, null, null, null, null), "name"),
                Arguments.of(new DesejoRequisicao("n".repeat(101), null, null, null, null, null, null, null), "name"),
                Arguments.of(new DesejoRequisicao("Item", new BigDecimal("-0.01"), null, null, null, null, null, null), "price"),
                Arguments.of(new DesejoRequisicao("Item", new BigDecimal("0.001"), null, null, null, null, null, null), "price"),
                Arguments.of(new DesejoRequisicao("Item", new BigDecimal("1000000000000"), null, null, null, null, null, null), "price"),
                Arguments.of(new DesejoRequisicao("Item", null, null, null, null, "urgent", null, null), "priority"),
                Arguments.of(new DesejoRequisicao("Item", null, null, null, null, null, "paid", null), "status"));
    }
}
