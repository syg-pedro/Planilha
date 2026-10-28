package com.financeiro.desejos;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
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
class DesejosConfiguracoesIntegrationIT {
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
    void limparDesejosFicticios() {
        assertThat(banco.queryForObject("SELECT current_database()", String.class)).isEqualTo("financeiro_lab_test");
        banco.update("DELETE FROM wish_items");
    }

    @Test
    void persisteCrudDeDesejoComUrlsApenasArmazenadasEIdentidadeDoServidor() {
        Map<String, Object> entrada = desejo();
        entrada.put("name", "  Desejo fictício  ");
        entrada.put("url", "http://127.0.0.1:1/produto-ficticio");
        entrada.put("imageUrl", "https://example.invalid/imagem-ficticia.png");
        entrada.put("notes", "  Observação fictícia  ");
        entrada.put("category", "  Categoria fictícia  ");
        var criacao = enviar(HttpMethod.POST, "/api/wishlist", entrada);
        assertThat(criacao.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode criado = criacao.getBody();
        String id = criado.path("id").asText();
        assertThat(id).startsWith("wish-");
        assertThat(criacao.getHeaders().getLocation()).isNotNull();
        assertThat(criacao.getHeaders().getLocation().getPath()).isEqualTo("/api/wishlist/" + id);
        assertThat(criado.path("householdId").asText()).isEqualTo("local-demo");
        assertThat(criado.path("name").asText()).isEqualTo("Desejo fictício");
        assertThat(criado.path("url").asText()).isEqualTo("http://127.0.0.1:1/produto-ficticio");
        assertThat(criado.path("imageUrl").asText()).isEqualTo("https://example.invalid/imagem-ficticia.png");
        assertThat(criado.path("notes").asText()).isEqualTo("Observação fictícia");
        assertThat(criado.path("category").asText()).isEqualTo("Categoria fictícia");
        assertThat(criado.path("priority").asText()).isEqualTo("medium");
        assertThat(criado.path("status").asText()).isEqualTo("want");
        assertThat(enviar(HttpMethod.GET, "/api/wishlist/" + id, null).getBody()).isEqualTo(criado);
        var listagem = enviar(HttpMethod.GET, "/api/wishlist", null);
        assertThat(listagem.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listagem.getBody().path("items").size()).isEqualTo(1);
        assertThat(listagem.getBody().path("items").get(0)).isEqualTo(criado);
        assertThat(banco.queryForObject("SELECT price FROM wish_items WHERE id = ?", BigDecimal.class, id))
                .isEqualByComparingTo("0.10");

        entrada.put("name", "Desejo alterado");
        entrada.put("price", new BigDecimal("0.20"));
        entrada.put("priority", "high");
        entrada.put("status", "saving");
        var atualizacao = enviar(HttpMethod.PUT, "/api/wishlist/" + id, entrada);
        assertThat(atualizacao.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(atualizacao.getBody().path("id").asText()).isEqualTo(id);
        assertThat(atualizacao.getBody().path("householdId").asText()).isEqualTo("local-demo");
        assertThat(atualizacao.getBody().path("createdAt")).isEqualTo(criado.path("createdAt"));
        assertThat(atualizacao.getBody().path("priority").asText()).isEqualTo("high");
        assertThat(atualizacao.getBody().path("status").asText()).isEqualTo("saving");
        entrada.remove("priority");
        entrada.remove("status");
        var preservado = enviar(HttpMethod.PUT, "/api/wishlist/" + id, entrada);
        assertThat(preservado.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(preservado.getBody().path("priority").asText()).isEqualTo("high");
        assertThat(preservado.getBody().path("status").asText()).isEqualTo("saving");
        assertThat(enviar(HttpMethod.DELETE, "/api/wishlist/" + id, null).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        validarErro(enviar(HttpMethod.GET, "/api/wishlist/" + id, null), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.PUT, "/api/wishlist/" + id, entrada), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.DELETE, "/api/wishlist/" + id, null), HttpStatus.NOT_FOUND);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.10", "0.20", "999999999999.99"})
    void conservaPrecisaoDoPreco(String preco) {
        Map<String, Object> entrada = desejo();
        entrada.put("price", new BigDecimal(preco));
        var resposta = enviar(HttpMethod.POST, "/api/wishlist", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(resposta.getBody().path("price").decimalValue()).isEqualByComparingTo(preco);
        assertThat(banco.queryForObject("SELECT price FROM wish_items WHERE id = ?", BigDecimal.class,
                resposta.getBody().path("id").asText())).isEqualByComparingTo(preco);
    }

    @Test
    void aceitaPrecoNuloECamposOpcionaisVazios() {
        Map<String, Object> entrada = desejo();
        entrada.put("name", "N".repeat(100));
        entrada.put("price", null);
        for (String campo : List.of("url", "imageUrl", "notes", "category")) entrada.put(campo, "   ");
        var resposta = enviar(HttpMethod.POST, "/api/wishlist", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(resposta.getBody().path("name").asText()).hasSize(100);
        for (String campo : List.of("price", "url", "imageUrl", "notes", "category")) {
            assertThat(resposta.getBody().has(campo)).isTrue();
            assertThat(resposta.getBody().path(campo).isNull()).isTrue();
        }
    }

    @ParameterizedTest
    @MethodSource("opcoesValidasDoDesejo")
    void aceitaPrioridadesESituacoesDoContrato(String campo, String valor) {
        Map<String, Object> entrada = desejo();
        entrada.put(campo, valor);
        var resposta = enviar(HttpMethod.POST, "/api/wishlist", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(resposta.getBody().path(campo).asText()).isEqualTo(valor);
    }

    static Stream<Arguments> opcoesValidasDoDesejo() {
        return Stream.of(Arguments.of("priority", "high"), Arguments.of("priority", "medium"),
                Arguments.of("priority", "low"), Arguments.of("status", "want"),
                Arguments.of("status", "saving"), Arguments.of("status", "bought"));
    }

    @ParameterizedTest
    @MethodSource("camposInvalidosDoDesejo")
    void rejeitaDesejoInvalidoSemPersistir(String campo, Object valor) {
        Map<String, Object> entrada = desejo();
        entrada.put(campo, valor);
        validarErro(enviar(HttpMethod.POST, "/api/wishlist", entrada), HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM wish_items", Integer.class)).isZero();
    }

    static Stream<Arguments> camposInvalidosDoDesejo() {
        return Stream.of(
                Arguments.of("name", null), Arguments.of("name", "  "), Arguments.of("name", "N".repeat(101)),
                Arguments.of("price", new BigDecimal("-0.01")), Arguments.of("price", new BigDecimal("0.001")),
                Arguments.of("price", new BigDecimal("1000000000000.00")), Arguments.of("price", "0.10"),
                Arguments.of("price", ""), Arguments.of("url", "javascript:alert('sensitive-sentinel')"),
                Arguments.of("url", "ftp://example.invalid/produto"), Arguments.of("url", "//example.invalid/produto"),
                Arguments.of("url", "https:///produto-sensitive-sentinel"),
                Arguments.of("imageUrl", "file:///imagem-sensitive-sentinel"),
                Arguments.of("imageUrl", "https://person:password-sensitive-sentinel@example.invalid/imagem"),
                Arguments.of("notes", "O".repeat(5001)), Arguments.of("category", "C".repeat(101)),
                Arguments.of("priority", "priority-sensitive-sentinel"), Arguments.of("status", "status-sensitive-sentinel"),
                Arguments.of("priority", 1), Arguments.of("id", "identity-sensitive-sentinel"),
                Arguments.of("householdId", "identity-sensitive-sentinel"),
                Arguments.of("createdAt", "identity-sensitive-sentinel"), Arguments.of("updatedAt", "identity-sensitive-sentinel"));
    }

    @Test
    void persistePreferenciasCompletasECarimbaIntroducaoNoServidor() {
        JsonNode anterior = buscarConfiguracoes();
        assertThat(anterior.path("id").asText()).isEqualTo("local-demo");
        Map<String, Object> entrada = configuracoes();
        var resposta = enviar(HttpMethod.PUT, "/api/settings", entrada);
        JsonNode salvas = exigirConfiguracoes(resposta);
        assertThat(salvas.path("currency").asText()).isEqualTo("BRL");
        assertThat(salvas.path("timezone").asText()).isEqualTo("America/Sao_Paulo");
        assertThat(salvas.path("themeMode").asText()).isEqualTo("dark");
        assertThat(salvas.path("densityMode").asText()).isEqualTo("comfortable");
        assertThat(salvas.path("periodMode").asText()).isEqualTo("competence");
        assertThat(salvas.path("horizonMonths").asInt()).isEqualTo(120);
        assertThat(salvas.path("notificationDays").size()).isEqualTo(3);
        assertThat(salvas.path("notificationDays").get(0).asInt()).isZero();
        assertThat(salvas.path("notificationDays").get(2).asInt()).isEqualTo(365);
        assertThat(salvas.path("notificationTime").asText()).isEqualTo("23:59");
        assertThat(salvas.path("colorTokens").path("primary").asText()).isEqualTo("#ABC");
        assertThat(salvas.path("dashboardConfig").path("uiTheme").path("preset").asText()).isEqualTo("cobalt");
        assertThat(Instant.parse(salvas.path("onboarding").path("updatedAt").asText()))
                .isAfter(Instant.parse("1999-01-01T00:00:00Z"));
        assertThat(buscarConfiguracoes()).isEqualTo(salvas);
        assertThat(banco.queryForObject("SELECT horizon_months FROM household_settings WHERE id = 'local-demo'", Integer.class))
                .isEqualTo(120);

        entrada.put("horizonMonths", 1);
        entrada.put("notificationTime", "00:00");
        entrada.put("notificationDays", List.of());
        JsonNode limiteInferior = exigirConfiguracoes(enviar(HttpMethod.PUT, "/api/settings", entrada));
        assertThat(limiteInferior.path("horizonMonths").asInt()).isEqualTo(1);
        assertThat(limiteInferior.path("notificationDays").size()).isZero();
        assertThat(limiteInferior.path("notificationTime").asText()).isEqualTo("00:00");
        assertThat(buscarConfiguracoes()).isEqualTo(limiteInferior);
    }

    @Test
    void rotasDeTemaPainelEIntroducaoPreservamPreferenciasNaoEnviadas() {
        JsonNode inicial = exigirConfiguracoes(enviar(HttpMethod.PUT, "/api/settings", configuracoes()));
        JsonNode tema = exigirConfiguracoes(enviar(HttpMethod.POST, "/api/settings/theme",
                Map.of("themeMode", "light", "densityMode", "compact", "colorTokens", cores())));
        assertThat(tema.path("themeMode").asText()).isEqualTo("light");
        assertThat(tema.path("densityMode").asText()).isEqualTo("compact");
        assertThat(tema.path("periodMode")).isEqualTo(inicial.path("periodMode"));
        assertThat(tema.path("horizonMonths")).isEqualTo(inicial.path("horizonMonths"));
        assertThat(tema.path("dashboardConfig")).isEqualTo(inicial.path("dashboardConfig"));
        assertThat(tema.path("onboarding")).isEqualTo(inicial.path("onboarding"));

        Map<String, Object> painel = new LinkedHashMap<>();
        painel.put("periodMode", "due_date");
        painel.put("notificationTime", "00:00");
        painel.put("dashboardConfig", Map.of("visibleWidgets", List.of("projection"),
                "sortMode", "date_desc", "defaultRange", "quarter"));
        JsonNode comPainel = exigirConfiguracoes(enviar(HttpMethod.POST, "/api/settings/dashboard", painel));
        assertThat(comPainel.path("periodMode").asText()).isEqualTo("due_date");
        assertThat(comPainel.path("notificationTime").asText()).isEqualTo("00:00");
        assertThat(comPainel.path("dashboardConfig").path("defaultRange").asText()).isEqualTo("quarter");
        assertThat(comPainel.path("themeMode")).isEqualTo(tema.path("themeMode"));
        assertThat(comPainel.path("colorTokens")).isEqualTo(tema.path("colorTokens"));
        painel.remove("notificationTime");
        JsonNode horarioPreservado = exigirConfiguracoes(enviar(HttpMethod.POST, "/api/settings/dashboard", painel));
        assertThat(horarioPreservado.path("notificationTime").asText()).isEqualTo("00:00");

        JsonNode introducao = exigirConfiguracoes(enviar(HttpMethod.POST, "/api/onboarding/state",
                Map.of("onboarding", Map.of("version", 1, "status", "completed", "completedSteps",
                        List.of("accounts", "fixed-items"), "updatedAt", "1999-01-01T00:00:00Z"))));
        assertThat(introducao.path("onboarding").path("status").asText()).isEqualTo("completed");
        assertThat(introducao.path("onboarding").path("completedSteps").size()).isEqualTo(2);
        assertThat(Instant.parse(introducao.path("onboarding").path("updatedAt").asText()))
                .isAfter(Instant.parse("1999-01-01T00:00:00Z"));
        assertThat(introducao.path("dashboardConfig")).isEqualTo(horarioPreservado.path("dashboardConfig"));
        assertThat(introducao.path("colorTokens")).isEqualTo(horarioPreservado.path("colorTokens"));
        assertThat(buscarConfiguracoes()).isEqualTo(introducao);
    }

    @ParameterizedTest
    @MethodSource("configuracoesInvalidas")
    void rejeitaPreferenciasInvalidasSemAlterarEstado(String campo, Object valor) {
        JsonNode anterior = buscarConfiguracoes();
        Map<String, Object> entrada = configuracoes();
        entrada.put(campo, valor);
        validarErro(enviar(HttpMethod.PUT, "/api/settings", entrada), HttpStatus.BAD_REQUEST);
        assertThat(buscarConfiguracoes()).isEqualTo(anterior);
    }

    static Stream<Arguments> configuracoesInvalidas() {
        return Stream.of(
                Arguments.of("currency", "USD"), Arguments.of("currency", null),
                Arguments.of("timezone", "timezone-sensitive-sentinel"), Arguments.of("timezone", ""),
                Arguments.of("themeMode", "theme-sensitive-sentinel"), Arguments.of("densityMode", "density-sensitive-sentinel"),
                Arguments.of("periodMode", "period-sensitive-sentinel"), Arguments.of("horizonMonths", 0),
                Arguments.of("horizonMonths", 121), Arguments.of("horizonMonths", new BigDecimal("1.5")),
                Arguments.of("horizonMonths", "1"), Arguments.of("horizonMonths", ""),
                Arguments.of("notificationTime", "24:00"), Arguments.of("notificationTime", "12:60"),
                Arguments.of("notificationTime", "9:00"), Arguments.of("notificationTime", ""),
                Arguments.of("notificationDays", List.of(-1)), Arguments.of("notificationDays", List.of(366)),
                Arguments.of("notificationDays", Arrays.asList(1, null)),
                Arguments.of("colorTokens", Map.of("primary", "color-sensitive-sentinel")),
                Arguments.of("dashboardConfig", Map.of("visibleWidgets", List.of("kpis"),
                        "sortMode", "sort-sensitive-sentinel", "defaultRange", "month")),
                Arguments.of("onboarding", Map.of("version", 2, "status", "new", "completedSteps", List.of())),
                Arguments.of("onboarding", Map.of("version", 1, "status", "state-sensitive-sentinel", "completedSteps", List.of())),
                Arguments.of("onboarding", Map.of("version", 1, "status", "new", "completedSteps", List.of(""))),
                Arguments.of("id", "identity-sensitive-sentinel"), Arguments.of("householdId", "identity-sensitive-sentinel"),
                Arguments.of("updatedAt", "identity-sensitive-sentinel"));
    }

    @ParameterizedTest
    @MethodSource("corposInvalidosDasRotasEspecificas")
    void validaCorposDasRotasEspecificasSemAlterarPreferencias(String caminho, Object corpo) {
        JsonNode anterior = buscarConfiguracoes();
        validarErro(enviar(HttpMethod.POST, caminho, corpo), HttpStatus.BAD_REQUEST);
        assertThat(buscarConfiguracoes()).isEqualTo(anterior);
    }

    static Stream<Arguments> corposInvalidosDasRotasEspecificas() {
        Map<String, Object> coresInvalidas = new LinkedHashMap<>(cores());
        coresInvalidas.put("primary", "url(javascript:sensitive-sentinel)");
        return Stream.of(
                Arguments.of("/api/settings/theme", Map.of("themeMode", "dark", "densityMode", "compact", "colorTokens", coresInvalidas)),
                Arguments.of("/api/settings/theme", Map.of("themeMode", "theme-sensitive-sentinel", "densityMode", "compact", "colorTokens", cores())),
                Arguments.of("/api/settings/dashboard", Map.of("periodMode", "due_date", "notificationTime", "25:00",
                        "dashboardConfig", Map.of("visibleWidgets", List.of(), "sortMode", "date_asc", "defaultRange", "month"))),
                Arguments.of("/api/settings/dashboard", Map.of("periodMode", "due_date", "dashboardConfig",
                        Map.of("visibleWidgets", List.of(), "sortMode", "date_asc", "defaultRange", "range-sensitive-sentinel"))),
                Arguments.of("/api/onboarding/state", Map.of("onboarding", Map.of("version", 1, "status", "new",
                        "completedSteps", List.of(), "updatedAt", "date-sensitive-sentinel"))),
                Arguments.of("/api/onboarding/state", Map.of("onboarding", Map.of("version", 1, "status", "state-sensitive-sentinel", "completedSteps", List.of()))));
    }

    private JsonNode buscarConfiguracoes() {
        return exigirConfiguracoes(enviar(HttpMethod.GET, "/api/settings", null));
    }

    private JsonNode exigirConfiguracoes(ResponseEntity<JsonNode> resposta) {
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resposta.getBody().has("settings")).isTrue();
        JsonNode configuracoes = resposta.getBody().path("settings");
        assertThat(configuracoes.path("id").asText()).isEqualTo("local-demo");
        return configuracoes;
    }

    private static Map<String, Object> configuracoes() {
        Map<String, Object> entrada = new LinkedHashMap<>();
        entrada.put("currency", "BRL");
        entrada.put("timezone", "America/Sao_Paulo");
        entrada.put("themeMode", "dark");
        entrada.put("densityMode", "comfortable");
        entrada.put("periodMode", "competence");
        entrada.put("horizonMonths", 120);
        entrada.put("notificationDays", List.of(0, 1, 365));
        entrada.put("notificationTime", "23:59");
        entrada.put("colorTokens", cores());
        entrada.put("dashboardConfig", Map.of("visibleWidgets", List.of("kpis", "cashflow"), "sortMode", "amount_desc",
                "defaultRange", "year", "uiTheme", Map.of("version", 1, "preset", "cobalt")));
        entrada.put("onboarding", Map.of("version", 1, "status", "active", "completedSteps", List.of("accounts"),
                "updatedAt", "1999-01-01T00:00:00Z"));
        return entrada;
    }

    private static Map<String, Object> cores() {
        return Map.of("primary", "#ABC", "accent", "#123456", "positive", "#00ff00", "negative", "#ff0000",
                "neutral", "#789", "background", "#ffffff", "card", "#000000");
    }

    private static Map<String, Object> desejo() {
        Map<String, Object> entrada = new LinkedHashMap<>();
        entrada.put("name", "Desejo fictício");
        entrada.put("price", new BigDecimal("0.10"));
        return entrada;
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
