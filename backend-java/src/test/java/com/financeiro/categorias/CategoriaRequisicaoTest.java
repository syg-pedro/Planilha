package com.financeiro.categorias;

import static org.assertj.core.api.Assertions.assertThat;

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

class CategoriaRequisicaoTest {
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
    @ValueSource(strings = {"income", "expense"})
    void aceitaTiposEHexadecimal(String tipo) {
        CategoriaRequisicao requisicao = new CategoriaRequisicao(" Categoria ficticia ", tipo, "#12aBef");

        assertThat(validator.validate(requisicao)).isEmpty();
        assertThat(requisicao.name()).isEqualTo("Categoria ficticia");
    }

    @ParameterizedTest
    @MethodSource("requisicoesInvalidas")
    void rejeitaDadosInvalidos(CategoriaRequisicao requisicao, String campo) {
        assertThat(validator.validate(requisicao))
                .anySatisfy(violacao -> assertThat(violacao.getPropertyPath().toString()).isEqualTo(campo));
    }

    static Stream<Arguments> requisicoesInvalidas() {
        return Stream.of(
                Arguments.of(new CategoriaRequisicao(null, "expense", "#123456"), "name"),
                Arguments.of(new CategoriaRequisicao("   ", "expense", "#123456"), "name"),
                Arguments.of(new CategoriaRequisicao("a".repeat(101), "expense", "#123456"), "name"),
                Arguments.of(new CategoriaRequisicao("Categoria", null, "#123456"), "kind"),
                Arguments.of(new CategoriaRequisicao("Categoria", "outro", "#123456"), "kind"),
                Arguments.of(new CategoriaRequisicao("Categoria", "expense", null), "color"),
                Arguments.of(new CategoriaRequisicao("Categoria", "expense", "red"), "color"),
                Arguments.of(new CategoriaRequisicao("Categoria", "expense", "#fff"), "color"),
                Arguments.of(new CategoriaRequisicao("Categoria", "expense", "#zzzzzz"), "color"));
    }
}
