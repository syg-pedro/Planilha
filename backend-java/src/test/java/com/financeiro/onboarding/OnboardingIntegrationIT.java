package com.financeiro.onboarding;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.financeiro.seguranca.ContextoLocalTestConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
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
class OnboardingIntegrationIT {
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

    @Autowired
    private ObjectMapper json;

    @BeforeEach
    void limparSomenteBancoDescartavelEPrepararHorizonte() {
        assertThat(banco.queryForObject("SELECT current_database()", String.class)).isEqualTo("financeiro_lab_test");
        banco.update("DELETE FROM entries");
        banco.update("DELETE FROM rules");
        banco.update("DELETE FROM categories");
        banco.update("DELETE FROM accounts");
        ObjectNode configuracoes = (ObjectNode) buscarConfiguracoes().deepCopy();
        configuracoes.remove(List.of("id", "updatedAt"));
        configuracoes.put("horizonMonths", 2);
        configuracoes.set("onboarding", json.valueToTree(Map.of("version", 1, "status", "new", "completedSteps", List.of())));
        assertThat(enviar(HttpMethod.PUT, "/api/settings", configuracoes).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void previaCalculaContagensSemGravarDadosOuProgresso() {
        JsonNode configuracoes = buscarConfiguracoes();
        var resposta = enviar(HttpMethod.POST, "/api/onboarding/import/preview", planilha());
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode previa = resposta.getBody();
        validarResumo(previa);
        assertThat(previa.path("canImport").asBoolean()).isTrue();
        assertThat(previa.path("warnings").size()).isZero();
        assertThat(contagens()).containsOnly(Map.entry("accounts", 0), Map.entry("categories", 0),
                Map.entry("rules", 0), Map.entry("entries", 0));
        assertThat(buscarConfiguracoes()).isEqualTo(configuracoes);
    }

    @Test
    void importaRelacionamentosNormalizadosRecorrenciaMetadataEProgressoNaMesmaTransacao() {
        var resposta = enviar(HttpMethod.POST, "/api/onboarding/import", planilha());
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        validarResumo(resposta.getBody().path("summary"));
        assertThat(contagens()).containsOnly(Map.entry("accounts", 1), Map.entry("categories", 1),
                Map.entry("rules", 1), Map.entry("entries", 3));
        var bootstrap = enviar(HttpMethod.GET, "/api/bootstrap", null);
        assertThat(bootstrap.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode dados = bootstrap.getBody();
        JsonNode conta = dados.path("accounts").get(0);
        JsonNode categoria = dados.path("categories").get(0);
        JsonNode regra = dados.path("rules").get(0);
        assertThat(conta.path("name").asText()).isEqualTo("Bánco Fictício");
        assertThat(conta.path("owner").asText()).isEqualTo("Pessoa fictícia");
        assertThat(categoria.path("name").asText()).isEqualTo("Alimentação Fictícia");
        assertThat(regra.path("accountId")).isEqualTo(conta.path("id"));
        assertThat(regra.path("categoryId")).isEqualTo(categoria.path("id"));
        int gerados = 0;
        int importados = 0;
        for (JsonNode lancamento : dados.path("entries")) {
            assertThat(lancamento.path("accountId")).isEqualTo(conta.path("id"));
            assertThat(lancamento.path("categoryId")).isEqualTo(categoria.path("id"));
            assertThat(lancamento.path("householdId").asText()).isEqualTo("local-demo");
            assertThat(lancamento.path("metadata").path("source").asText()).isEqualTo("onboarding-workbook");
            if (lancamento.path("origin").asText().equals("auto")) {
                gerados++;
                assertThat(lancamento.path("ruleId")).isEqualTo(regra.path("id"));
                assertThat(lancamento.path("amount").decimalValue()).isEqualByComparingTo("0.10");
                assertThat(lancamento.path("metadata").path("generatedFromRule").asBoolean()).isTrue();
            } else {
                importados++;
                assertThat(lancamento.path("origin").asText()).isEqualTo("imported");
                assertThat(lancamento.path("amount").decimalValue()).isEqualByComparingTo("0.20");
                assertThat(lancamento.path("status").asText()).isEqualTo("review");
                assertThat(lancamento.path("installmentIndex").asInt()).isEqualTo(1);
                assertThat(lancamento.path("installmentTotal").asInt()).isEqualTo(2);
                assertThat(lancamento.path("metadata").path("sourceRow").asInt()).isEqualTo(2);
            }
        }
        assertThat(gerados).isEqualTo(2);
        assertThat(importados).isEqualTo(1);
        JsonNode introducao = buscarConfiguracoes().path("onboarding");
        assertThat(introducao.path("status").asText()).isEqualTo("completed");
        assertThat(introducao.path("completedSteps").size()).isEqualTo(3);
        assertThat(introducao.path("completedSteps").get(0).asText()).isEqualTo("import-workbook");
    }

    @ParameterizedTest
    @ValueSource(strings = {"accounts", "categories"})
    void rejeitaDuplicatasAposNormalizarAcentosCaixaEEspacos(String aba) {
        ObjectNode entrada = json.valueToTree(planilha());
        ArrayNode linhas = (ArrayNode) entrada.path(aba);
        ObjectNode duplicada = (ObjectNode) linhas.get(0).deepCopy();
        duplicada.put("sourceRow", 3);
        duplicada.put("name", aba.equals("accounts") ? " BANCO   FICTICIO " : " alimentacao   ficticia ");
        linhas.add(duplicada);
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import/preview", entrada));
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import", entrada));
        assertThat(contagens().values()).allMatch(quantidade -> quantidade == 0);
    }

    @ParameterizedTest
    @MethodSource("referenciasInvalidas")
    void rejeitaReferenciasQueNaoExistemNaPlanilha(String aba, String campo) {
        ObjectNode entrada = json.valueToTree(planilha());
        ((ObjectNode) entrada.path(aba).get(0)).put(campo, "reference-sensitive-sentinel");
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import/preview", entrada));
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import", entrada));
        assertThat(contagens().values()).allMatch(quantidade -> quantidade == 0);
    }

    static Stream<Arguments> referenciasInvalidas() {
        return Stream.of(Arguments.of("rules", "accountName"), Arguments.of("rules", "categoryName"),
                Arguments.of("entries", "accountName"), Arguments.of("entries", "categoryName"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"accounts", "categories", "rules", "entries"})
    void bloqueiaImportacaoQuandoQualquerModuloJaPossuiDados(String modulo) {
        Object corpo = switch (modulo) {
            case "accounts" -> Map.of("name", "Conta fictícia existente", "type", "bank");
            case "categories" -> Map.of("name", "Categoria fictícia existente", "kind", "expense", "color", "#123ABC");
            case "rules" -> Map.of("title", "Regra fictícia existente", "kind", "expense", "amount", new BigDecimal("0.10"), "frequency", "manual");
            default -> Map.of("title", "Lançamento fictício existente", "kind", "expense", "amount", new BigDecimal("0.10"), "dueDate", "2028-02-29");
        };
        assertThat(enviar(HttpMethod.POST, "/api/" + modulo, corpo).getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, Integer> antes = contagens();
        JsonNode configuracoes = buscarConfiguracoes();
        var previa = enviar(HttpMethod.POST, "/api/onboarding/import/preview", planilha());
        assertThat(previa.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(previa.getBody().path("canImport").asBoolean()).isFalse();
        assertThat(previa.getBody().path("warnings").size()).isPositive();
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import", planilha()));
        assertThat(contagens()).isEqualTo(antes);
        assertThat(buscarConfiguracoes()).isEqualTo(configuracoes);
    }

    @Test
    void falhaNoLancamentoFinalReverteContasCategoriasRegrasGeradosEProgresso() {
        JsonNode configuracoes = buscarConfiguracoes();
        try {
            banco.execute("CREATE SEQUENCE onboarding_failure_seen");
            banco.execute("CREATE FUNCTION falhar_importacao_ficticia() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.origin = 'imported' THEN IF (SELECT count(*) FROM accounts) > 0 AND (SELECT count(*) FROM categories) > 0 AND (SELECT count(*) FROM rules) > 0 AND (SELECT count(*) FROM entries WHERE origin = 'auto') > 0 THEN PERFORM nextval('onboarding_failure_seen'); END IF; RAISE EXCEPTION 'failure-sensitive-sentinel'; END IF; RETURN NEW; END; $$");
            banco.execute("CREATE TRIGGER falha_importacao_ficticia BEFORE INSERT ON entries FOR EACH ROW EXECUTE FUNCTION falhar_importacao_ficticia()");
            var resposta = enviar(HttpMethod.POST, "/api/onboarding/import", planilha());
            assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(resposta.getBody().toString()).doesNotContain("sensitive-sentinel", "SQLException", "INSERT INTO", "jdbc:");
            assertThat(banco.queryForObject("SELECT is_called FROM onboarding_failure_seen", Boolean.class)).isTrue();
            assertThat(contagens().values()).allMatch(quantidade -> quantidade == 0);
            assertThat(buscarConfiguracoes()).isEqualTo(configuracoes);
        } finally {
            banco.execute("DROP TRIGGER IF EXISTS falha_importacao_ficticia ON entries");
            banco.execute("DROP FUNCTION IF EXISTS falhar_importacao_ficticia()");
            banco.execute("DROP SEQUENCE IF EXISTS onboarding_failure_seen");
        }
        assertThat(enviar(HttpMethod.POST, "/api/onboarding/import", planilha()).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void doisImportsSimultaneosSerializamUmaUnicaImportacao() throws Exception {
        CountDownLatch inicio = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var primeiro = executor.submit(() -> {
                inicio.await();
                return enviar(HttpMethod.POST, "/api/onboarding/import", planilha());
            });
            var segundo = executor.submit(() -> {
                inicio.await();
                return enviar(HttpMethod.POST, "/api/onboarding/import", planilha());
            });
            inicio.countDown();
            var resultadoPrimeiro = primeiro.get(30, TimeUnit.SECONDS);
            var resultadoSegundo = segundo.get(30, TimeUnit.SECONDS);
            assertThat(List.of(resultadoPrimeiro.getStatusCode().value(), resultadoSegundo.getStatusCode().value()))
                    .containsExactlyInAnyOrder(200, 400);
            assertThat(contagens()).containsOnly(Map.entry("accounts", 1), Map.entry("categories", 1),
                    Map.entry("rules", 1), Map.entry("entries", 3));
            assertThat(buscarConfiguracoes().path("onboarding").path("status").asText()).isEqualTo("completed");
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void rejeitaPlanilhaVaziaEParcelasIncoerentesSemGravacao() {
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import", Map.of("version", 1,
                "accounts", List.of(), "categories", List.of(), "rules", List.of(), "entries", List.of())));
        ObjectNode entrada = json.valueToTree(planilha());
        ((ObjectNode) entrada.path("entries").get(0)).put("installmentIndex", 3);
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import/preview", entrada));
        validarErro(enviar(HttpMethod.POST, "/api/onboarding/import", entrada));
        assertThat(contagens().values()).allMatch(quantidade -> quantidade == 0);
    }

    private static Map<String, Object> planilha() {
        return Map.of("version", 1,
                "accounts", List.of(Map.of("sourceRow", 2, "name", "  Bánco Fictício  ", "type", "bank", "owner", "  Pessoa fictícia  ")),
                "categories", List.of(Map.of("sourceRow", 2, "name", "  Alimentação Fictícia  ", "kind", "expense", "color", "#123ABC")),
                "rules", List.of(Map.of("sourceRow", 2, "title", "Despesa mensal fictícia", "kind", "expense", "amount", new BigDecimal("0.10"),
                        "dueDay", 31, "accountName", " banco  ficticio ", "categoryName", " ALIMENTACAO FICTICIA ")),
                "entries", List.of(Map.of("sourceRow", 2, "title", "Compra avulsa fictícia", "kind", "expense", "amount", new BigDecimal("0.20"),
                        "dueDate", "2028-02-29", "accountName", " BÁNCO FICTÍCIO ", "categoryName", "alimentacao ficticia",
                        "status", "review", "installmentIndex", 1, "installmentTotal", 2)));
    }

    private void validarResumo(JsonNode resumo) {
        assertThat(resumo.path("accounts").asInt()).isEqualTo(1);
        assertThat(resumo.path("categories").asInt()).isEqualTo(1);
        assertThat(resumo.path("rules").asInt()).isEqualTo(1);
        assertThat(resumo.path("generatedEntries").asInt()).isEqualTo(2);
        assertThat(resumo.path("entries").asInt()).isEqualTo(1);
    }

    private Map<String, Integer> contagens() {
        return Map.of("accounts", banco.queryForObject("SELECT count(*) FROM accounts", Integer.class),
                "categories", banco.queryForObject("SELECT count(*) FROM categories", Integer.class),
                "rules", banco.queryForObject("SELECT count(*) FROM rules", Integer.class),
                "entries", banco.queryForObject("SELECT count(*) FROM entries", Integer.class));
    }

    private JsonNode buscarConfiguracoes() {
        var resposta = enviar(HttpMethod.GET, "/api/settings", null);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        return resposta.getBody().path("settings");
    }

    private ResponseEntity<JsonNode> enviar(HttpMethod metodo, String caminho, Object entrada) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return http.exchange(caminho, metodo, new HttpEntity<>(entrada, headers), JsonNode.class);
    }

    private void validarErro(ResponseEntity<JsonNode> resposta) {
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resposta.getBody().path("message").asText()).isNotBlank();
        assertThat(resposta.getBody().toString()).doesNotContain("sensitive-sentinel", "SQLException", "INSERT INTO", "jdbc:", "stackTrace");
    }
}
