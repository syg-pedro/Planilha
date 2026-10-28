package com.financeiro.lancamentos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
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

class LancamentoRequisicaoTest {
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
    @ValueSource(strings = {"0", "0.10", "0.20", "1234.56", "999999999999.99"})
    void aceitaValoresExatosSemArredondamento(String valor) {
        LancamentoRequisicao requisicao = requisicao("Despesa", new BigDecimal(valor), "expense",
                LocalDate.of(2024, 2, 29), null, null, null, null, null);

        assertThat(validator.validate(requisicao)).isEmpty();
        assertThat(requisicao.amount()).isEqualTo(new BigDecimal(valor));
        assertThat(requisicao.competenceDate()).isEqualTo(LocalDate.of(2024, 2, 29));
        assertThat(requisicao.description()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("requisicoesInvalidas")
    void rejeitaCamposForaDoContrato(LancamentoRequisicao requisicao, String campo) {
        assertThat(validator.validate(requisicao))
                .anySatisfy(violacao -> assertThat(violacao.getPropertyPath().toString()).isEqualTo(campo));
    }

    @ParameterizedTest
    @MethodSource("parcelamentosInvalidos")
    void exigeParcelamentoCompletoSemSuperarTotal(Integer indice, Integer total) {
        assertThatThrownBy(() -> requisicao("Despesa", BigDecimal.ONE, "expense",
                LocalDate.of(2026, 10, 28), indice, total, null, null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aceitaIdentificadorDeRegraParaValidacaoNoService() {
        LancamentoRequisicao requisicao = new LancamentoRequisicao("rule-ausente", null, null,
                "Despesa", "", BigDecimal.ONE, "expense", LocalDate.of(2026, 10, 28), null,
                null, null, null, null, null, null);

        assertThat(validator.validate(requisicao)).isEmpty();
    }

    static Stream<Arguments> parcelamentosInvalidos() {
        return Stream.of(Arguments.of(1, null), Arguments.of(null, 2), Arguments.of(3, 2));
    }

    static Stream<Arguments> requisicoesInvalidas() {
        LocalDate data = LocalDate.of(2026, 10, 28);
        return Stream.of(
                Arguments.of(requisicao(null, BigDecimal.ONE, "expense", data, null, null, null, null, null), "title"),
                Arguments.of(requisicao("  ", BigDecimal.ONE, "expense", data, null, null, null, null, null), "title"),
                Arguments.of(requisicao("a".repeat(101), BigDecimal.ONE, "expense", data, null, null, null, null, null), "title"),
                Arguments.of(requisicao("Despesa", null, "expense", data, null, null, null, null, null), "amount"),
                Arguments.of(requisicao("Despesa", new BigDecimal("-0.01"), "expense", data, null, null, null, null, null), "amount"),
                Arguments.of(requisicao("Despesa", new BigDecimal("0.001"), "expense", data, null, null, null, null, null), "amount"),
                Arguments.of(requisicao("Despesa", new BigDecimal("1000000000000"), "expense", data, null, null, null, null, null), "amount"),
                Arguments.of(requisicao("Despesa", BigDecimal.ONE, "outro", data, null, null, null, null, null), "kind"),
                Arguments.of(requisicao("Despesa", BigDecimal.ONE, "expense", null, null, null, null, null, null), "dueDate"),
                Arguments.of(requisicao("Despesa", BigDecimal.ONE, "expense", data, 0, 2, null, null, null), "installmentIndex"),
                Arguments.of(requisicao("Despesa", BigDecimal.ONE, "expense", data, 0, 0, null, null, null), "installmentTotal"),
                Arguments.of(requisicao("Despesa", BigDecimal.ONE, "expense", data, null, null, "outro", null, null), "status"),
                Arguments.of(requisicao("Despesa", BigDecimal.ONE, "expense", data, null, null, null, "outro", null), "origin"));
    }

    private static LancamentoRequisicao requisicao(String titulo, BigDecimal valor, String tipo, LocalDate vencimento,
            Integer indice, Integer total, String estado, String origem, Boolean excluir) {
        return new LancamentoRequisicao(null, null, null, titulo, null, valor, tipo, vencimento, null,
                indice, total, estado, origem, excluir, null);
    }
}
