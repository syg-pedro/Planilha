package com.financeiro.regras;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import com.financeiro.seguranca.ContextoLocalTestConfig;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import({ContextoLocalTestConfig.class, RegrasIntegrationIT.RelogioFixo.class})
@Testcontainers
class RegrasIntegrationIT {
    @Container
    static final PostgreSQLContainer<?> BANCO = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("financeiro_lab_test")
            .withUsername("financeiro_lab")
            .withPassword("test_password");

    @TestConfiguration(proxyBeanMethods = false)
    static class RelogioFixo {
        @Bean
        @Primary
        Clock relogioFixo() {
            return Clock.fixed(Instant.parse("2028-01-15T12:00:00Z"), ZoneOffset.UTC);
        }
    }

    @DynamicPropertySource
    static void configurarBanco(DynamicPropertyRegistry propriedades) {
        propriedades.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:"
                + BANCO.getMappedPort(5432) + "/financeiro_lab_test");
        propriedades.add("spring.datasource.username", BANCO::getUsername);
        propriedades.add("spring.datasource.password", BANCO::getPassword);
    }

    @Autowired
    private TestRestTemplate http;

    @Autowired
    private JdbcTemplate banco;

    @BeforeEach
    void limparDadosFicticios() {
        assertThat(banco.queryForObject("SELECT current_database()", String.class)).isEqualTo("financeiro_lab_test");
        banco.update("DELETE FROM entries");
        banco.update("DELETE FROM rules");
        banco.update("DELETE FROM categories");
        banco.update("DELETE FROM accounts");
    }

    @Test
    void persisteCrudSemPermitirAlterarIdentidade() {
        Map<String, Object> entrada = regra();
        entrada.put("title", "  Regra fictícia  ");
        entrada.put("metadata", Map.of("fixture", "laboratorio"));
        var criacao = enviar(HttpMethod.POST, "/api/rules", entrada);
        assertThat(criacao.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode criada = criacao.getBody();
        String id = criada.path("id").asText();
        assertThat(id).startsWith("rule-");
        assertThat(criacao.getHeaders().getLocation()).isNotNull();
        assertThat(criacao.getHeaders().getLocation().getPath()).isEqualTo("/api/rules/" + id);
        assertThat(criada.path("householdId").asText()).isEqualTo("local-demo");
        assertThat(criada.path("title").asText()).isEqualTo("Regra fictícia");
        assertThat(criada.path("description").asText()).isEmpty();
        assertThat(criada.path("amount").decimalValue()).isEqualByComparingTo("0.10");
        assertThat(criada.path("metadata").path("fixture").asText()).isEqualTo("laboratorio");
        assertThat(enviar(HttpMethod.GET, "/api/rules/" + id, null).getBody()).isEqualTo(criada);
        var listagem = enviar(HttpMethod.GET, "/api/rules", null);
        assertThat(listagem.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listagem.getBody().path("rules").size()).isEqualTo(1);
        assertThat(listagem.getBody().path("rules").get(0)).isEqualTo(criada);
        assertThat(banco.queryForObject("SELECT amount FROM rules WHERE id = ?", BigDecimal.class, id))
                .isEqualByComparingTo("0.10");

        entrada.put("title", "Regra alterada");
        entrada.put("amount", new BigDecimal("0.20"));
        entrada.put("kind", "income");
        entrada.put("frequency", "manual");
        entrada.put("autoGenerate", false);
        var atualizacao = enviar(HttpMethod.PUT, "/api/rules/" + id, entrada);
        assertThat(atualizacao.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(atualizacao.getBody().path("id").asText()).isEqualTo(id);
        assertThat(atualizacao.getBody().path("householdId").asText()).isEqualTo("local-demo");
        assertThat(atualizacao.getBody().path("amount").decimalValue()).isEqualByComparingTo("0.20");
        assertThat(atualizacao.getBody().path("kind").asText()).isEqualTo("income");
        assertThat(atualizacao.getBody().path("frequency").asText()).isEqualTo("manual");
        assertThat(atualizacao.getBody().path("autoGenerate").asBoolean()).isFalse();
        assertThat(enviar(HttpMethod.DELETE, "/api/rules/" + id, null).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        validarErro(enviar(HttpMethod.GET, "/api/rules/" + id, null), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.PUT, "/api/rules/" + id, entrada), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.DELETE, "/api/rules/" + id, null), HttpStatus.NOT_FOUND);
    }

    @Test
    void geraDoisMesesComDiaLimitadoAoFimDeFevereiroEIdsEstaveis() {
        Map<String, Object> entrada = regra();
        entrada.put("startsAt", "2030-01-01");
        entrada.put("endsAt", "2030-12-31");
        JsonNode criada = criarRegra(entrada);
        var primeiraGeracao = enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2));
        assertThat(primeiraGeracao.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(primeiraGeracao.getBody().path("generated").asInt()).isEqualTo(2);
        JsonNode gerados = listarLancamentos();
        assertThat(gerados.size()).isEqualTo(2);
        assertThat(gerados.get(0).path("dueDate").asText()).isEqualTo("2028-01-31");
        assertThat(gerados.get(1).path("dueDate").asText()).isEqualTo("2028-02-29");
        for (JsonNode gerado : gerados) {
            assertThat(gerado.path("ruleId").asText()).isEqualTo(criada.path("id").asText());
            assertThat(gerado.path("householdId").asText()).isEqualTo("local-demo");
            assertThat(gerado.path("amount").decimalValue()).isEqualByComparingTo("0.10");
            assertThat(gerado.path("competenceDate")).isEqualTo(gerado.path("dueDate"));
            assertThat(gerado.path("status").asText()).isEqualTo("pending");
            assertThat(gerado.path("origin").asText()).isEqualTo("auto");
            assertThat(gerado.path("metadata").path("generatedFromRule").asBoolean()).isTrue();
        }
        var repeticao = enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2));
        assertThat(repeticao.getStatusCode()).isEqualTo(HttpStatus.OK);
        for (String contador : List.of("created", "updated", "removed")) {
            assertThat(repeticao.getBody().has(contador)).isTrue();
            assertThat(repeticao.getBody().path(contador).asInt()).isZero();
        }
        assertThat(listarLancamentos()).isEqualTo(gerados);
    }

    @Test
    void rebuildPreservaPagamentoEHistoricoELimpaSomenteGeradosNaoPagos() {
        Map<String, Object> entrada = regra();
        JsonNode criada = criarRegra(entrada);
        String regraId = criada.path("id").asText();
        assertThat(enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        JsonNode gerados = listarLancamentos();
        String pagoId = gerados.get(0).path("id").asText();
        String pendenteId = gerados.get(1).path("id").asText();
        Map<String, Object> pagamento = lancamento();
        pagamento.put("title", "Quitação fictícia imutável");
        pagamento.put("ruleId", regraId);
        pagamento.put("dueDate", "2028-01-31");
        pagamento.put("amount", new BigDecimal("7.00"));
        pagamento.put("status", "paid");
        pagamento.put("origin", "auto");
        pagamento.put("metadata", Map.of("generatedFromRule", true));
        var respostaPagamento = enviar(HttpMethod.PUT, "/api/entries/" + pagoId, pagamento);
        assertThat(respostaPagamento.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode pago = respostaPagamento.getBody();
        pagamento.put("title", "Parcela em revisão");
        pagamento.put("dueDate", "2028-02-29");
        pagamento.put("amount", new BigDecimal("0.10"));
        pagamento.put("status", "review");
        assertThat(enviar(HttpMethod.PUT, "/api/entries/" + pendenteId, pagamento).getStatusCode()).isEqualTo(HttpStatus.OK);

        entrada.put("title", "Regra atualizada");
        entrada.put("amount", new BigDecimal("0.20"));
        assertThat(enviar(HttpMethod.PUT, "/api/rules/" + regraId, entrada).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(enviar(HttpMethod.GET, "/api/entries/" + pagoId, null).getBody()).isEqualTo(pago);
        JsonNode pendente = enviar(HttpMethod.GET, "/api/entries/" + pendenteId, null).getBody();
        assertThat(pendente.path("amount").decimalValue()).isEqualByComparingTo("0.20");
        assertThat(pendente.path("title").asText()).isEqualTo("Regra atualizada");
        assertThat(pendente.path("status").asText()).isEqualTo("review");

        Map<String, Object> manual = lancamento();
        manual.put("ruleId", regraId);
        JsonNode registroManual = criarLancamento(manual);
        Map<String, Object> semRegra = lancamento();
        semRegra.put("origin", "auto");
        semRegra.put("metadata", Map.of("generatedFromRule", true));
        JsonNode registroSemRegra = criarLancamento(semRegra);
        Map<String, Object> historico = lancamento();
        historico.put("ruleId", regraId);
        historico.put("origin", "auto");
        historico.put("dueDate", "2027-12-31");
        historico.put("metadata", Map.of("generatedFromRule", true));
        JsonNode registroHistorico = criarLancamento(historico);
        entrada.put("autoGenerate", false);
        assertThat(enviar(HttpMethod.PUT, "/api/rules/" + regraId, entrada).getStatusCode()).isEqualTo(HttpStatus.OK);
        var desativacao = enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2));
        assertThat(desativacao.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(desativacao.getBody().path("generated").asInt()).isZero();
        assertThat(listarLancamentos().size()).isEqualTo(4);
        assertThat(enviar(HttpMethod.GET, "/api/entries/" + pagoId, null).getBody()).isEqualTo(pago);
        assertThat(enviar(HttpMethod.GET, "/api/entries/" + registroManual.path("id").asText(), null).getBody())
                .isEqualTo(registroManual);
        assertThat(enviar(HttpMethod.GET, "/api/entries/" + registroSemRegra.path("id").asText(), null).getBody())
                .isEqualTo(registroSemRegra);
        assertThat(enviar(HttpMethod.GET, "/api/entries/" + registroHistorico.path("id").asText(), null).getBody())
                .isEqualTo(registroHistorico);
        validarErro(enviar(HttpMethod.GET, "/api/entries/" + pendenteId, null), HttpStatus.NOT_FOUND);
    }

    @Test
    void excluirRegraPreservaPagosHistoricosEManuaisERemovePendentesFuturos() {
        JsonNode criada = criarRegra(regra());
        String regraId = criada.path("id").asText();
        assertThat(enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        JsonNode gerados = listarLancamentos();
        String pagoId = gerados.get(0).path("id").asText();
        String pendenteId = gerados.get(1).path("id").asText();
        Map<String, Object> entrada = lancamento();
        entrada.put("ruleId", regraId);
        entrada.put("origin", "auto");
        entrada.put("status", "paid");
        entrada.put("dueDate", "2028-01-31");
        assertThat(enviar(HttpMethod.PUT, "/api/entries/" + pagoId, entrada).getStatusCode()).isEqualTo(HttpStatus.OK);
        entrada.put("status", "pending");
        entrada.put("dueDate", "2027-12-31");
        String historicoId = criarLancamento(entrada).path("id").asText();
        entrada.put("origin", "manual");
        entrada.put("dueDate", "2030-01-31");
        String manualId = criarLancamento(entrada).path("id").asText();
        entrada.put("origin", "auto");
        String futuroDistanteId = criarLancamento(entrada).path("id").asText();
        assertThat(enviar(HttpMethod.DELETE, "/api/rules/" + regraId, null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        for (String id : List.of(pagoId, historicoId, manualId)) {
            var historico = enviar(HttpMethod.GET, "/api/entries/" + id, null);
            assertThat(historico.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(historico.getBody().path("ruleId").isNull()).isTrue();
            assertThat(historico.getBody().path("amount").decimalValue()).isEqualByComparingTo("0.10");
        }
        validarErro(enviar(HttpMethod.GET, "/api/entries/" + pendenteId, null), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.GET, "/api/entries/" + futuroDistanteId, null), HttpStatus.NOT_FOUND);
        assertThat(enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(listarLancamentos().size()).isEqualTo(3);
    }

    @Test
    void usaDezoitoMesesQuandoCorpoNaoFoiEnviado() {
        criarRegra(regra());
        var resposta = enviar(HttpMethod.POST, "/api/rules/rebuild", null);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resposta.getBody().path("generated").asInt()).isEqualTo(18);
        JsonNode gerados = listarLancamentos();
        assertThat(gerados.size()).isEqualTo(18);
        assertThat(gerados.get(0).path("dueDate").asText()).isEqualTo("2028-01-31");
        assertThat(gerados.get(17).path("dueDate").asText()).isEqualTo("2029-06-30");
    }

    @Test
    void ignoraRegrasDesativadasManuaisOuSemDia() {
        Map<String, Object> entrada = regra();
        entrada.put("autoGenerate", false);
        criarRegra(entrada);
        entrada.put("autoGenerate", true);
        entrada.put("frequency", "manual");
        criarRegra(entrada);
        entrada.put("frequency", "monthly");
        entrada.put("dueDay", null);
        criarRegra(entrada);
        var resposta = enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 2));
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resposta.getBody().path("generated").asInt()).isZero();
        assertThat(listarLancamentos().size()).isZero();
    }

    @Test
    void vinculaContaECategoriaNosGeradosEPreservaRegraAoExcluirReferencias() {
        var conta = enviar(HttpMethod.POST, "/api/accounts", Map.of("name", "Banco fictício", "type", "bank"));
        assertThat(conta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String contaId = conta.getBody().path("id").asText();
        var categoria = enviar(HttpMethod.POST, "/api/categories",
                Map.of("name", "Categoria fictícia", "kind", "expense", "color", "#123ABC"));
        assertThat(categoria.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String categoriaId = categoria.getBody().path("id").asText();
        Map<String, Object> entrada = regra();
        entrada.put("accountId", contaId);
        entrada.put("categoryId", categoriaId);
        JsonNode criada = criarRegra(entrada);
        assertThat(enviar(HttpMethod.POST, "/api/rules/rebuild", Map.of("months", 1)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        JsonNode gerado = listarLancamentos().get(0);
        assertThat(gerado.path("accountId").asText()).isEqualTo(contaId);
        assertThat(gerado.path("categoryId").asText()).isEqualTo(categoriaId);
        assertThat(enviar(HttpMethod.DELETE, "/api/accounts/" + contaId, null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(enviar(HttpMethod.DELETE, "/api/categories/" + categoriaId, null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        var regra = enviar(HttpMethod.GET, "/api/rules/" + criada.path("id").asText(), null);
        assertThat(regra.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(regra.getBody().path("accountId").isNull()).isTrue();
        assertThat(regra.getBody().path("categoryId").isNull()).isTrue();
        var historico = enviar(HttpMethod.GET, "/api/entries/" + gerado.path("id").asText(), null);
        assertThat(historico.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(historico.getBody().path("accountId").isNull()).isTrue();
        assertThat(historico.getBody().path("categoryId").isNull()).isTrue();
    }

    @ParameterizedTest
    @MethodSource("camposInvalidos")
    void rejeitaCamposInvalidosSemPersistir(String campo, Object valor) {
        Map<String, Object> entrada = regra();
        entrada.put(campo, valor);
        validarErro(enviar(HttpMethod.POST, "/api/rules", entrada), HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM rules", Integer.class)).isZero();
    }

    static Stream<Arguments> camposInvalidos() {
        return Stream.of(
                Arguments.of("title", null), Arguments.of("title", "  "), Arguments.of("title", "R".repeat(101)),
                Arguments.of("amount", null), Arguments.of("amount", new BigDecimal("-0.01")),
                Arguments.of("amount", new BigDecimal("0.001")),
                Arguments.of("amount", new BigDecimal("1000000000000.00")), Arguments.of("amount", "0.10"),
                Arguments.of("kind", "invalid-kind-sensitive-sentinel"), Arguments.of("kind", null),
                Arguments.of("dueDay", 0), Arguments.of("dueDay", 32), Arguments.of("dueDay", new BigDecimal("1.5")),
                Arguments.of("frequency", "invalid-frequency-sensitive-sentinel"), Arguments.of("frequency", null),
                Arguments.of("startsAt", "2027-02-29"), Arguments.of("endsAt", "2028-02-30"),
                Arguments.of("accountId", "missing-reference-sensitive-sentinel"),
                Arguments.of("categoryId", "missing-reference-sensitive-sentinel"),
                Arguments.of("id", "identity-sensitive-sentinel"), Arguments.of("householdId", "identity-sensitive-sentinel"),
                Arguments.of("autoGenerate", "true"), Arguments.of("metadata", "metadata-sensitive-sentinel"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"months\":0}", "{\"months\":121}", "{\"months\":-1}",
            "{\"months\":1.5}", "{\"months\":\"1\"}", "{\"months\":\"\"}", "{invalid-sensitive-sentinel"})
    void rejeitaHorizonteInvalidoOuCorpoMalformado(String corpo) {
        criarRegra(regra());
        validarErro(enviar(HttpMethod.POST, "/api/rules/rebuild", corpo), HttpStatus.BAD_REQUEST);
        assertThat(listarLancamentos().size()).isZero();
    }

    private static Map<String, Object> regra() {
        Map<String, Object> entrada = new LinkedHashMap<>();
        entrada.put("title", "Regra fictícia");
        entrada.put("amount", new BigDecimal("0.10"));
        entrada.put("kind", "expense");
        entrada.put("dueDay", 31);
        entrada.put("frequency", "monthly");
        entrada.put("startsAt", "2028-01-01");
        entrada.put("autoGenerate", true);
        return entrada;
    }

    private static Map<String, Object> lancamento() {
        Map<String, Object> entrada = new LinkedHashMap<>();
        entrada.put("title", "Lançamento fictício");
        entrada.put("amount", new BigDecimal("0.10"));
        entrada.put("kind", "expense");
        entrada.put("dueDate", "2028-01-20");
        return entrada;
    }

    private JsonNode criarRegra(Map<String, Object> entrada) {
        var resposta = enviar(HttpMethod.POST, "/api/rules", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resposta.getBody();
    }

    private JsonNode criarLancamento(Map<String, Object> entrada) {
        var resposta = enviar(HttpMethod.POST, "/api/entries", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resposta.getBody();
    }

    private JsonNode listarLancamentos() {
        var resposta = enviar(HttpMethod.GET, "/api/entries", null);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        return resposta.getBody().path("entries");
    }

    private ResponseEntity<JsonNode> enviar(HttpMethod metodo, String caminho, Object entrada) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return http.exchange(caminho, metodo, new HttpEntity<>(entrada, headers), JsonNode.class);
    }

    private void validarErro(ResponseEntity<JsonNode> resposta, HttpStatus status) {
        assertThat(resposta.getStatusCode()).isEqualTo(status);
        assertThat(resposta.getBody()).isNotNull();
        assertThat(resposta.getBody().path("message").asText()).isNotBlank();
        assertThat(resposta.getBody().toString()).doesNotContain("stackTrace", "stacktrace", "jdbc:", "org.hibernate",
                "SQLException", "INSERT INTO", "sensitive-sentinel");
    }
}
