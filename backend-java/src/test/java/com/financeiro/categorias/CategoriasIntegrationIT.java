package com.financeiro.categorias;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
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
class CategoriasIntegrationIT {
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
    void limparDadosFicticios() {
        assertThat(banco.queryForObject("SELECT current_database()", String.class)).isEqualTo("financeiro_lab_test");
        banco.update("DELETE FROM entries");
        banco.update("DELETE FROM categories");
        banco.update("DELETE FROM accounts");
    }

    @Test
    void persisteCicloCompletoSemAlterarIdentidadeOuContexto() {
        Map<String, Object> entrada = categoria();
        entrada.put("name", "  Categoria fictícia  ");
        var criacao = enviar(HttpMethod.POST, "", entrada);
        assertThat(criacao.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode criada = criacao.getBody();
        String id = criada.path("id").asText();
        assertThat(id).startsWith("category-");
        assertThat(criacao.getHeaders().getLocation()).isNotNull();
        assertThat(criacao.getHeaders().getLocation().getPath()).isEqualTo("/api/categories/" + id);
        assertThat(criada.path("householdId").asText()).isEqualTo("local-demo");
        assertThat(criada.path("name").asText()).isEqualTo("Categoria fictícia");
        assertThat(criada.path("kind").asText()).isEqualTo("expense");
        assertThat(criada.path("color").asText()).isEqualTo("#123ABC");
        assertThat(banco.queryForObject("SELECT name FROM categories WHERE id = ?", String.class, id))
                .isEqualTo("Categoria fictícia");
        var consulta = enviar(HttpMethod.GET, "/" + id, null);
        assertThat(consulta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(consulta.getBody()).isEqualTo(criada);
        var listagem = enviar(HttpMethod.GET, "", null);
        assertThat(listagem.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listagem.getBody().path("categories").size()).isEqualTo(1);
        assertThat(listagem.getBody().path("categories").get(0)).isEqualTo(criada);

        entrada.put("name", "Categoria atualizada");
        entrada.put("kind", "income");
        entrada.put("color", "#00ff00");
        var atualizacao = enviar(HttpMethod.PUT, "/" + id, entrada);
        assertThat(atualizacao.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(atualizacao.getBody().path("id").asText()).isEqualTo(id);
        assertThat(atualizacao.getBody().path("householdId").asText()).isEqualTo("local-demo");
        assertThat(atualizacao.getBody().path("name").asText()).isEqualTo("Categoria atualizada");
        assertThat(atualizacao.getBody().path("kind").asText()).isEqualTo("income");
        assertThat(atualizacao.getBody().path("color").asText()).isEqualTo("#00ff00");
        var exclusao = enviar(HttpMethod.DELETE, "/" + id, null);
        assertThat(exclusao.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(exclusao.getBody()).isNull();
        assertThat(banco.queryForObject("SELECT count(*) FROM categories WHERE id = ?", Integer.class, id)).isZero();
        validarErro(enviar(HttpMethod.GET, "/" + id, null), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.PUT, "/" + id, entrada), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.DELETE, "/" + id, null), HttpStatus.NOT_FOUND);
    }

    @ParameterizedTest
    @ValueSource(strings = {"income", "expense"})
    void aceitaOsDoisTiposENomeNoLimite(String tipo) {
        Map<String, Object> entrada = categoria();
        entrada.put("name", "C".repeat(100));
        entrada.put("kind", tipo);
        var resposta = enviar(HttpMethod.POST, "", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(resposta.getBody().path("name").asText()).hasSize(100);
        assertThat(resposta.getBody().path("kind").asText()).isEqualTo(tipo);
    }

    @ParameterizedTest
    @MethodSource("camposInvalidos")
    void rejeitaDadosInvalidosSemPersistir(String campo, Object valor) {
        Map<String, Object> entrada = categoria();
        entrada.put(campo, valor);
        validarErro(enviar(HttpMethod.POST, "", entrada), HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM categories", Integer.class)).isZero();
    }

    static Stream<Arguments> camposInvalidos() {
        return Stream.of(
                Arguments.of("name", null), Arguments.of("name", "  "),
                Arguments.of("name", "C".repeat(101)), Arguments.of("name", 123),
                Arguments.of("kind", null), Arguments.of("kind", "invalid-kind-sensitive-sentinel"),
                Arguments.of("kind", true), Arguments.of("color", null),
                Arguments.of("color", "123ABC"), Arguments.of("color", "#abc"),
                Arguments.of("color", "#12345Z"), Arguments.of("color", ""));
    }

    @ParameterizedTest
    @ValueSource(strings = {"id", "householdId"})
    void rejeitaIdentidadeFornecidaPeloCliente(String campo) {
        Map<String, Object> entrada = categoria();
        var criacao = enviar(HttpMethod.POST, "", entrada);
        assertThat(criacao.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode criada = criacao.getBody();
        entrada.put(campo, "identity-sensitive-sentinel");
        validarErro(enviar(HttpMethod.POST, "", entrada), HttpStatus.BAD_REQUEST);
        validarErro(enviar(HttpMethod.PUT, "/" + criada.path("id").asText(), entrada), HttpStatus.BAD_REQUEST);
        assertThat(enviar(HttpMethod.GET, "/" + criada.path("id").asText(), null).getBody()).isEqualTo(criada);
        assertThat(banco.queryForObject("SELECT count(*) FROM categories", Integer.class)).isEqualTo(1);
    }

    private static Map<String, Object> categoria() {
        Map<String, Object> entrada = new LinkedHashMap<>();
        entrada.put("name", "Categoria fictícia");
        entrada.put("kind", "expense");
        entrada.put("color", "#123ABC");
        return entrada;
    }

    private ResponseEntity<JsonNode> enviar(HttpMethod metodo, String caminho, Object entrada) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return http.exchange("/api/categories" + caminho, metodo, new HttpEntity<>(entrada, headers), JsonNode.class);
    }

    private void validarErro(ResponseEntity<JsonNode> resposta, HttpStatus status) {
        assertThat(resposta.getStatusCode()).isEqualTo(status);
        assertThat(resposta.getBody()).isNotNull();
        assertThat(resposta.getBody().path("message").asText()).isNotBlank();
        assertThat(resposta.getBody().toString()).doesNotContain("stackTrace", "stacktrace", "jdbc:", "org.hibernate",
                "SQLException", "INSERT INTO", "identity-sensitive-sentinel", "invalid-kind-sensitive-sentinel");
    }
}
