package com.financeiro.contas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.ArrayList;
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
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.dao.DataIntegrityViolationException;
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
@Import(ContextoLocalTestConfig.class)
@Testcontainers
class ContasIntegrationIT {
    @Container
    static final PostgreSQLContainer<?> BANCO = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("financeiro_lab_test")
            .withUsername("financeiro_lab")
            .withPassword("test_password");

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
    void limparContasFicticias() {
        assertThat(banco.queryForObject("SELECT current_database()", String.class)).isEqualTo("financeiro_lab_test");
        banco.update("DELETE FROM accounts");
    }

    @Test
    void persisteCicloCompletoSemAlterarIdentidade() {
        Map<String, Object> entrada = conta();
        entrada.put("name", "  Cartão fictício  ");
        entrada.put("owner", "  Pessoa fictícia  ");
        var criacao = enviar(HttpMethod.POST, "", entrada);
        assertThat(criacao.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode criada = criacao.getBody();
        String id = criada.path("id").asText();
        assertThat(id).matches("account-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        assertThat(criacao.getHeaders().getLocation()).isNotNull();
        assertThat(criacao.getHeaders().getLocation().getPath()).isEqualTo("/api/accounts/" + id);
        assertThat(criada.path("householdId").asText()).isEqualTo("local-demo");
        assertThat(criada.path("name").asText()).isEqualTo("Cartão fictício");
        assertThat(criada.path("owner").asText()).isEqualTo("Pessoa fictícia");
        assertThat(criada.path("active").asBoolean()).isTrue();
        assertThat(criada.path("closingDay").asInt()).isEqualTo(28);
        assertThat(criada.path("dueDay").asInt()).isEqualTo(5);
        assertThat(banco.queryForObject("SELECT limit_total FROM accounts WHERE id = ?", BigDecimal.class, id))
                .isEqualByComparingTo("1234.56");
        assertThat(enviar(HttpMethod.GET, "/" + id, null).getBody()).isEqualTo(criada);
        JsonNode listagem = enviar(HttpMethod.GET, "", null).getBody().path("accounts");
        assertThat(listagem.size()).isEqualTo(1);
        assertThat(listagem.get(0)).isEqualTo(criada);

        entrada.put("name", "Conta atualizada");
        entrada.put("limitTotal", new BigDecimal("0.10"));
        entrada.put("active", false);
        var atualizacao = enviar(HttpMethod.PUT, "/" + id, entrada);
        assertThat(atualizacao.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(atualizacao.getBody().path("id").asText()).isEqualTo(id);
        assertThat(atualizacao.getBody().path("householdId").asText()).isEqualTo("local-demo");
        assertThat(atualizacao.getBody().path("name").asText()).isEqualTo("Conta atualizada");
        assertThat(atualizacao.getBody().path("active").asBoolean()).isFalse();
        entrada.remove("active");
        assertThat(enviar(HttpMethod.PUT, "/" + id, entrada).getBody().path("active").asBoolean()).isFalse();
        assertThat(banco.queryForObject("SELECT limit_total FROM accounts WHERE id = ?", BigDecimal.class, id))
                .isEqualByComparingTo("0.10");

        var exclusao = enviar(HttpMethod.DELETE, "/" + id, null);
        assertThat(exclusao.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(exclusao.getBody()).isNull();
        assertThat(banco.queryForObject("SELECT count(*) FROM accounts WHERE id = ?", Integer.class, id)).isZero();
        validarErro(enviar(HttpMethod.GET, "/" + id, null), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.PUT, "/" + id, entrada), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.DELETE, "/" + id, null), HttpStatus.NOT_FOUND);
    }

    @ParameterizedTest
    @ValueSource(strings = {"bank", "credit_card", "benefit", "external"})
    void aceitaTiposELimpaCamposDeCartaoQuandoNecessario(String tipo) {
        Map<String, Object> entrada = conta();
        entrada.put("type", tipo);
        entrada.remove("owner");
        JsonNode criada = criar(entrada);
        assertThat(criada.path("type").asText()).isEqualTo(tipo);
        assertThat(criada.path("owner").asText()).isEmpty();
        if (!tipo.equals("credit_card")) {
            validarCamposDeCartaoNulos(criada);
            JsonNode cartao = criar(conta());
            var alteracao = enviar(HttpMethod.PUT, "/" + cartao.path("id").asText(), entrada);
            assertThat(alteracao.getStatusCode()).isEqualTo(HttpStatus.OK);
            validarCamposDeCartaoNulos(alteracao.getBody());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.10", "0.20", "1234.56", "999999999999.99"})
    void conservaPrecisaoDosLimitesAceitos(String valor) {
        Map<String, Object> entrada = conta();
        entrada.put("limitTotal", new BigDecimal(valor));
        JsonNode criada = criar(entrada);
        assertThat(criada.path("limitTotal").decimalValue()).isEqualByComparingTo(valor);
        assertThat(banco.queryForObject("SELECT limit_total FROM accounts WHERE id = ?", BigDecimal.class,
                criada.path("id").asText())).isEqualByComparingTo(valor);
    }

    @Test
    void aceitaCartaoSemLimiteEDiasEResponsavelNulo() {
        Map<String, Object> entrada = conta();
        entrada.put("limitTotal", null);
        entrada.put("closingDay", null);
        entrada.put("dueDay", null);
        entrada.put("owner", null);
        JsonNode criada = criar(entrada);
        validarCamposDeCartaoNulos(criada);
        assertThat(criada.path("owner").asText()).isEmpty();
    }

    @Test
    void aceitaLimitesDeTextoEDias() {
        Map<String, Object> entrada = conta();
        entrada.put("name", "N".repeat(100));
        entrada.put("owner", "P".repeat(80));
        entrada.put("closingDay", 1);
        entrada.put("dueDay", 31);
        JsonNode criada = criar(entrada);
        assertThat(criada.path("name").asText()).hasSize(100);
        assertThat(criada.path("owner").asText()).hasSize(80);
        assertThat(criada.path("closingDay").asInt()).isEqualTo(1);
        assertThat(criada.path("dueDay").asInt()).isEqualTo(31);
    }

    @ParameterizedTest
    @MethodSource("camposInvalidos")
    void rejeitaCamposInvalidosSemPersistir(String campo, Object valor) {
        Map<String, Object> entrada = conta();
        entrada.put(campo, valor);
        validarErro(enviar(HttpMethod.POST, "", entrada), HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM accounts", Integer.class)).isZero();
    }

    static Stream<Arguments> camposInvalidos() {
        return Stream.of(
                Arguments.of("name", ""), Arguments.of("name", "   "), Arguments.of("name", null),
                Arguments.of("name", "N".repeat(101)), Arguments.of("owner", "P".repeat(81)),
                Arguments.of("type", "invalid-type-sentinel"), Arguments.of("type", null),
                Arguments.of("limitTotal", new BigDecimal("-0.01")),
                Arguments.of("limitTotal", new BigDecimal("1.001")),
                Arguments.of("limitTotal", new BigDecimal("1000000000000.00")),
                Arguments.of("closingDay", 0), Arguments.of("closingDay", 32),
                Arguments.of("closingDay", new BigDecimal("1.5")),
                Arguments.of("dueDay", 0), Arguments.of("dueDay", 32),
                Arguments.of("dueDay", new BigDecimal("1.5")),
                Arguments.of("name", 123), Arguments.of("owner", true),
                Arguments.of("type", 123), Arguments.of("closingDay", "1"),
                Arguments.of("limitTotal", "123.45"), Arguments.of("active", "true"),
                Arguments.of("active", ""), Arguments.of("closingDay", ""), Arguments.of("limitTotal", ""));
    }

    @ParameterizedTest
    @ValueSource(strings = {"id", "householdId"})
    void rejeitaIdentidadeEContextoFornecidosPeloCliente(String campo) {
        Map<String, Object> entrada = conta();
        JsonNode criada = criar(entrada);
        String id = criada.path("id").asText();
        entrada.put(campo, "identity-sentinel-not-public");
        validarErro(enviar(HttpMethod.POST, "", entrada), HttpStatus.BAD_REQUEST);
        validarErro(enviar(HttpMethod.PUT, "/" + id, entrada), HttpStatus.BAD_REQUEST);
        assertThat(enviar(HttpMethod.GET, "/" + id, null).getBody()).isEqualTo(criada);
        assertThat(banco.queryForObject("SELECT count(*) FROM accounts", Integer.class)).isEqualTo(1);
    }

    @Test
    void devolveErroAmigavelComCamposSemValorRejeitado() {
        Map<String, Object> entrada = conta();
        entrada.put("name", "sensitive-value-sentinel".repeat(10));
        var resposta = enviar(HttpMethod.POST, "", entrada);
        validarErro(resposta, HttpStatus.BAD_REQUEST);
        assertThat(resposta.getBody().path("fields").isObject()).isTrue();
        assertThat(resposta.getBody().path("fields").has("name")).isTrue();
        assertThat(resposta.getBody().toString()).doesNotContain("sensitive-value-sentinel");
        validarErro(enviar(HttpMethod.POST, "", "{invalid-json-sensitive-sentinel"), HttpStatus.BAD_REQUEST);
    }

    @Test
    void permiteNomesDuplicadosEListaContasInativasEmOrdemEstavel() {
        Map<String, Object> entrada = conta();
        entrada.put("name", "B");
        entrada.put("active", false);
        JsonNode ultima = criar(entrada);
        entrada.put("name", "A");
        JsonNode primeira = criar(entrada);
        JsonNode segunda = criar(entrada);
        List<String> esperados = new ArrayList<>(Stream.of(primeira.path("id").asText(),
                segunda.path("id").asText()).sorted().toList());
        esperados.add(ultima.path("id").asText());
        var resposta = enviar(HttpMethod.GET, "", null);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<String> encontrados = new ArrayList<>();
        for (JsonNode item : resposta.getBody().path("accounts")) {
            encontrados.add(item.path("id").asText());
            assertThat(item.path("active").asBoolean()).isFalse();
        }
        assertThat(encontrados).containsExactlyElementsOf(esperados);
        assertThat(enviar(HttpMethod.GET, "", null).getBody()).isEqualTo(resposta.getBody());
    }

    @ParameterizedTest
    @MethodSource("restricoesDoBanco")
    void bancoTambemRejeitaEstadoInvalido(String campo, Object valor) {
        Map<String, Object> entrada = conta();
        entrada.put("householdId", "local-demo");
        entrada.put("active", true);
        entrada.put(campo, valor);
        assertThatThrownBy(() -> banco.update(
                "INSERT INTO accounts (id, household_id, name, owner, type, limit_total, closing_day, due_day, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "account-constraint-test", entrada.get("householdId"), entrada.get("name"), entrada.get("owner"),
                entrada.get("type"), entrada.get("limitTotal"), entrada.get("closingDay"), entrada.get("dueDay"),
                entrada.get("active")))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(banco.queryForObject("SELECT count(*) FROM accounts", Integer.class)).isZero();
    }

    static Stream<Arguments> restricoesDoBanco() {
        return Stream.of(
                Arguments.of("householdId", "different-household"), Arguments.of("householdId", null),
                Arguments.of("name", "  "), Arguments.of("name", "N".repeat(101)),
                Arguments.of("owner", null), Arguments.of("owner", "P".repeat(81)),
                Arguments.of("type", "unknown"), Arguments.of("type", "bank"),
                Arguments.of("limitTotal", new BigDecimal("-0.01")),
                Arguments.of("limitTotal", new BigDecimal("1000000000000.00")),
                Arguments.of("closingDay", 0), Arguments.of("closingDay", 32),
                Arguments.of("dueDay", 0), Arguments.of("dueDay", 32), Arguments.of("active", null));
    }

    private static Map<String, Object> conta() {
        Map<String, Object> entrada = new LinkedHashMap<>();
        entrada.put("name", "Cartão fictício");
        entrada.put("owner", "Pessoa fictícia");
        entrada.put("type", "credit_card");
        entrada.put("limitTotal", new BigDecimal("1234.56"));
        entrada.put("closingDay", 28);
        entrada.put("dueDay", 5);
        return entrada;
    }

    private JsonNode criar(Map<String, Object> entrada) {
        var resposta = enviar(HttpMethod.POST, "", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resposta.getBody();
    }

    private ResponseEntity<JsonNode> enviar(HttpMethod metodo, String caminho, Object entrada) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return http.exchange("/api/accounts" + caminho, metodo, new HttpEntity<>(entrada, headers), JsonNode.class);
    }

    private void validarErro(ResponseEntity<JsonNode> resposta, HttpStatus status) {
        assertThat(resposta.getStatusCode()).isEqualTo(status);
        assertThat(resposta.getBody()).isNotNull();
        assertThat(resposta.getBody().path("message").asText()).isNotBlank();
        assertThat(resposta.getBody().toString()).doesNotContain("stackTrace", "stacktrace", "jdbc:", "org.hibernate",
                "SQLException", "INSERT INTO", "identity-sentinel-not-public", "invalid-type-sentinel",
                "invalid-json-sensitive-sentinel");
    }

    private void validarCamposDeCartaoNulos(JsonNode conta) {
        for (String campo : List.of("limitTotal", "closingDay", "dueDay")) {
            assertThat(conta.has(campo)).isTrue();
            assertThat(conta.path(campo).isNull()).isTrue();
        }
    }
}
