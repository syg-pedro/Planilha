package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class JavaMatrixParityTest {
    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules()
            .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @ParameterizedTest(name = "{0}")
    @MethodSource("cenarios")
    void preservaMatrizCalculadaPelasFuncoesOriginais(String nome, JsonNode cenario) {
        List<ContaResposta> contas = JSON.convertValue(cenario.get("accounts"), new TypeReference<>() { });
        List<LancamentoResposta> lancamentos = JSON.convertValue(cenario.get("entries"), new TypeReference<>() { });
        List<String> meses = JSON.convertValue(cenario.path("expected").path("months"), new TypeReference<>() { });
        var resposta = CalculosMatriz.calcular(lancamentos, contas, meses, cenario.path("periodMode").asText(), lancamentos);

        comparar(cenario.path("expected"), JSON.valueToTree(resposta), nome);
    }

    static Stream<Arguments> cenarios() throws IOException {
        try (var arquivo = JavaMatrixParityTest.class.getResourceAsStream("/parity/matrix-parity.json")) {
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
            esperado.properties().forEach(campo -> comparar(campo.getValue(),
                    atual.path(campo.getKey()), caminho + "." + campo.getKey()));
        } else {
            assertThat(atual).as(caminho).isEqualTo(esperado);
        }
    }
}
