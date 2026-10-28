package com.financeiro.contas;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
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

class ContaRequisicaoTest {
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
    @ValueSource(strings = {"bank", "credit_card", "benefit", "external"})
    void aceitaTiposDoContratoECamposOpcionais(String tipo) {
        ContaRequisicao requisicao = new ContaRequisicao(" Conta ficticia ", null, tipo, null, null, null, null);

        assertThat(validator.validate(requisicao)).isEmpty();
        assertThat(requisicao.name()).isEqualTo("Conta ficticia");
        assertThat(requisicao.owner()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("requisicoesInvalidas")
    void rejeitaEntradaForaDoContrato(ContaRequisicao requisicao, String campo) {
        assertThat(validator.validate(requisicao))
                .anySatisfy(violacao -> assertThat(violacao.getPropertyPath().toString()).isEqualTo(campo));
    }

    static Stream<Arguments> requisicoesInvalidas() {
        return Stream.of(
                Arguments.of(new ContaRequisicao(null, "", "bank", null, null, null, null), "name"),
                Arguments.of(new ContaRequisicao("   ", "", "bank", null, null, null, null), "name"),
                Arguments.of(new ContaRequisicao("a".repeat(101), "", "bank", null, null, null, null), "name"),
                Arguments.of(new ContaRequisicao("Conta", "a".repeat(81), "bank", null, null, null, null), "owner"),
                Arguments.of(new ContaRequisicao("Conta", "", null, null, null, null, null), "type"),
                Arguments.of(new ContaRequisicao("Conta", "", "outro", null, null, null, null), "type"),
                Arguments.of(new ContaRequisicao("Conta", "", "credit_card", new BigDecimal("-0.01"), null, null, null), "limitTotal"),
                Arguments.of(new ContaRequisicao("Conta", "", "credit_card", new BigDecimal("0.001"), null, null, null), "limitTotal"),
                Arguments.of(new ContaRequisicao("Conta", "", "credit_card", new BigDecimal("1000000000000"), null, null, null), "limitTotal"),
                Arguments.of(new ContaRequisicao("Conta", "", "credit_card", null, 0, null, null), "closingDay"),
                Arguments.of(new ContaRequisicao("Conta", "", "credit_card", null, 32, null, null), "closingDay"),
                Arguments.of(new ContaRequisicao("Conta", "", "credit_card", null, null, 0, null), "dueDay"),
                Arguments.of(new ContaRequisicao("Conta", "", "credit_card", null, null, 32, null), "dueDay"));
    }
}
