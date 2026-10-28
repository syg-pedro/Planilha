package com.financeiro.regras;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.stream.Stream;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

class RegraRequisicaoTest {
    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void iniciarValidacao() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void encerrarValidacao() {
        factory.close();
    }

    @ParameterizedTest
    @ValueSource(strings = {"monthly", "manual"})
    void aceitaFrequenciasComDiaOpcional(String frequencia) {
        RegraRequisicao requisicao = new RegraRequisicao(" Regra ficticia ", null, null, null,
                BigDecimal.ZERO, "income", null, frequencia, null, null, null, null);

        assertThat(validator.validate(requisicao)).isEmpty();
        assertThat(requisicao.title()).isEqualTo("Regra ficticia");
        assertThat(requisicao.description()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("requisicoesInvalidas")
    void rejeitaDadosInvalidos(RegraRequisicao requisicao, String campo) {
        assertThat(validator.validate(requisicao))
                .anySatisfy(violacao -> assertThat(violacao.getPropertyPath().toString()).isEqualTo(campo));
    }

    static Stream<Arguments> requisicoesInvalidas() {
        return Stream.of(
                Arguments.of(requisicao("   ", BigDecimal.ONE, "expense", 1, "monthly"), "title"),
                Arguments.of(requisicao("a".repeat(101), BigDecimal.ONE, "expense", 1, "monthly"), "title"),
                Arguments.of(requisicao("Regra", null, "expense", 1, "monthly"), "amount"),
                Arguments.of(requisicao("Regra", new BigDecimal("-0.01"), "expense", 1, "monthly"), "amount"),
                Arguments.of(requisicao("Regra", new BigDecimal("0.001"), "expense", 1, "monthly"), "amount"),
                Arguments.of(requisicao("Regra", new BigDecimal("1000000000000"), "expense", 1, "monthly"), "amount"),
                Arguments.of(requisicao("Regra", BigDecimal.ONE, "outro", 1, "monthly"), "kind"),
                Arguments.of(requisicao("Regra", BigDecimal.ONE, "expense", 0, "monthly"), "dueDay"),
                Arguments.of(requisicao("Regra", BigDecimal.ONE, "expense", 32, "monthly"), "dueDay"),
                Arguments.of(requisicao("Regra", BigDecimal.ONE, "expense", 1, "outro"), "frequency"));
    }

    private static RegraRequisicao requisicao(String titulo, BigDecimal valor, String tipo, Integer dia, String frequencia) {
        return new RegraRequisicao(titulo, "", null, null, valor, tipo, dia, frequencia,
                LocalDate.of(2028, 1, 1), null, true, null);
    }
}
