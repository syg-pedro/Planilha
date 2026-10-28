package com.financeiro.onboarding;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import com.financeiro.onboarding.OnboardingRequisicao.ContaImportada;
import com.financeiro.onboarding.OnboardingRequisicao.LancamentoImportado;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class OnboardingRequisicaoTest {
    private static ValidatorFactory factory;
    private static Validator validador;

    @BeforeAll
    static void iniciarValidacao() {
        factory = Validation.buildDefaultValidatorFactory();
        validador = factory.getValidator();
    }

    @AfterAll
    static void encerrarValidacao() {
        factory.close();
    }

    @Test
    void exigeVersaoUmEListasPresentes() {
        var requisicao = new OnboardingRequisicao(2, null, List.of(), List.of(), List.of());

        assertThat(validador.validate(requisicao)).extracting(erro -> erro.getPropertyPath().toString())
                .contains("version", "accounts");
    }

    @Test
    void limitaQuantidadeDeContas() {
        var conta = new ContaImportada(2, "Conta ficticia", "bank", "", null, null, null);
        var requisicao = new OnboardingRequisicao(1, Collections.nCopies(101, conta), List.of(), List.of(), List.of());

        assertThat(validador.validate(requisicao))
                .anySatisfy(erro -> assertThat(erro.getPropertyPath().toString()).isEqualTo("accounts"));
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 1003})
    void restringeLinhasDaPlanilha(int linha) {
        var conta = new ContaImportada(linha, "Conta ficticia", "bank", "", null, null, null);

        assertThat(validador.validate(conta))
                .anySatisfy(erro -> assertThat(erro.getPropertyPath().toString()).isEqualTo("sourceRow"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-0.01", "0.001", "1000000000000"})
    void exigeValorPositivoComPrecisaoSuportada(String valor) {
        var entrada = entrada(new BigDecimal(valor), null, null);

        assertThat(validador.validate(entrada))
                .anySatisfy(erro -> assertThat(erro.getPropertyPath().toString()).isEqualTo("amount"));
    }

    @Test
    void validaParcelasObrigatoriamenteEmPar() {
        assertThatThrownBy(() -> entrada(BigDecimal.ONE, 1, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> entrada(BigDecimal.ONE, null, 2)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> entrada(BigDecimal.ONE, 3, 2)).isInstanceOf(IllegalArgumentException.class);
        assertThat(validador.validate(entrada(BigDecimal.ONE, 1000, 1000))).isNotEmpty();
        assertThat(validador.validate(entrada(BigDecimal.ONE, 1, 999))).isEmpty();
    }

    private LancamentoImportado entrada(BigDecimal valor, Integer indice, Integer total) {
        return new LancamentoImportado(2, "Despesa ficticia", "expense", valor,
                LocalDate.of(2028, 2, 29), null, null, "pending", indice, total);
    }
}
