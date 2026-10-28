package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class JavaFinanceParityTest {
    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules()
            .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS);

    @ParameterizedTest(name = "{0}")
    @MethodSource("cenarios")
    void produzMesmosResultadosDasFuncoesTypescript(String nome, JsonNode cenario) {
        List<ContaResposta> contas = JSON.convertValue(cenario.get("accounts"), new TypeReference<>() { });
        List<LancamentoResposta> lancamentos = JSON.convertValue(cenario.get("entries"), new TypeReference<>() { });
        Instant agora = Instant.parse(cenario.path("now").asText());
        var vencimento = CalculosRelatorios.calcular(lancamentos, contas,
                new ConsultaRelatorio(null, null, null, null, null, null, null, null), agora);
        var competencia = CalculosRelatorios.calcular(lancamentos, contas,
                new ConsultaRelatorio(null, null, "competence", null, null, null, null, null), agora);
        JsonNode esperado = cenario.get("expected");

        comparar(esperado.get("kpis"), JSON.valueToTree(vencimento.kpis()), nome + ".kpis");
        comparar(esperado.get("paymentCycles"), JSON.valueToTree(vencimento.paymentCycles()), nome + ".paymentCycles");
        comparar(esperado.get("dueCashflow"), JSON.valueToTree(vencimento.cashflow()), nome + ".dueCashflow");
        comparar(esperado.get("competenceCashflow"), JSON.valueToTree(competencia.cashflow()), nome + ".competenceCashflow");
    }

    static Stream<Arguments> cenarios() throws IOException {
        try (var arquivo = JavaFinanceParityTest.class.getResourceAsStream("/parity/finance-parity.json")) {
            assertThat(arquivo).isNotNull();
            return StreamSupport.stream(JSON.readTree(arquivo).spliterator(), false)
                    .map(cenario -> Arguments.of(cenario.path("name").asText(), cenario));
        }
    }

    private static void comparar(JsonNode esperado, JsonNode atual, String caminho) {
        if (esperado.isNumber()) {
            assertThat(atual.isNumber()).as(caminho).isTrue();
            assertThat(atual.decimalValue()).as(caminho).isEqualByComparingTo(esperado.decimalValue());
        } else if (esperado.isArray()) {
            assertThat(atual.isArray()).as(caminho).isTrue();
            assertThat(atual.size()).as(caminho).isEqualTo(esperado.size());
            for (int indice = 0; indice < esperado.size(); indice++) {
                comparar(esperado.get(indice), atual.get(indice), caminho + "[" + indice + "]");
            }
        } else if (esperado.isObject()) {
            assertThat(atual.isObject()).as(caminho).isTrue();
            assertThat(atual.size()).as(caminho).isEqualTo(esperado.size());
            esperado.fields().forEachRemaining(campo -> comparar(campo.getValue(),
                    atual.path(campo.getKey()), caminho + "." + campo.getKey()));
        } else {
            assertThat(atual).as(caminho).isEqualTo(esperado);
        }
    }
}
