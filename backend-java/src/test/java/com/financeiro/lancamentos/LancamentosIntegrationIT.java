package com.financeiro.lancamentos;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
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
class LancamentosIntegrationIT {
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
    void persisteCicloCompletoComCentavosDatasEMetadata() {
        Map<String, Object> entrada = lancamento();
        entrada.put("title", "  Lançamento fictício  ");
        entrada.put("metadata", Map.of("fixture", "laboratorio", "quantidade", 2));
        var criacao = enviar(HttpMethod.POST, "/api/entries", entrada);
        assertThat(criacao.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode criado = criacao.getBody();
        String id = criado.path("id").asText();
        assertThat(id).startsWith("entry-");
        assertThat(criacao.getHeaders().getLocation()).isNotNull();
        assertThat(criacao.getHeaders().getLocation().getPath()).isEqualTo("/api/entries/" + id);
        assertThat(criado.path("householdId").asText()).isEqualTo("local-demo");
        assertThat(criado.path("title").asText()).isEqualTo("Lançamento fictício");
        assertThat(criado.path("description").asText()).isEmpty();
        assertThat(criado.path("dueDate").asText()).isEqualTo("2028-02-29");
        assertThat(criado.path("competenceDate").asText()).isEqualTo("2028-02-29");
        assertThat(criado.path("status").asText()).isEqualTo("pending");
        assertThat(criado.path("origin").asText()).isEqualTo("manual");
        assertThat(criado.path("excludeFromCalc").asBoolean()).isFalse();
        assertThat(criado.path("ruleId").isNull()).isTrue();
        assertThat(criado.path("metadata").path("fixture").asText()).isEqualTo("laboratorio");
        Instant criadoEm = Instant.parse(criado.path("createdAt").asText());
        assertThat(Instant.parse(criado.path("updatedAt").asText())).isAfterOrEqualTo(criadoEm);
        assertThat(banco.queryForObject("SELECT amount FROM entries WHERE id = ?", BigDecimal.class, id))
                .isEqualByComparingTo("0.10");
        var consulta = enviar(HttpMethod.GET, "/api/entries/" + id, null);
        assertThat(consulta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(consulta.getBody()).isEqualTo(criado);
        var listagem = enviar(HttpMethod.GET, "/api/entries", null);
        assertThat(listagem.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listagem.getBody().path("entries").size()).isEqualTo(1);
        assertThat(listagem.getBody().path("entries").get(0)).isEqualTo(criado);

        entrada.put("title", "Lançamento alterado");
        entrada.put("description", "Descrição fictícia");
        entrada.put("amount", new BigDecimal("0.20"));
        entrada.put("competenceDate", "2028-02-01");
        entrada.put("status", "paid");
        entrada.put("origin", "imported");
        entrada.put("excludeFromCalc", true);
        var atualizacao = enviar(HttpMethod.PUT, "/api/entries/" + id, entrada);
        assertThat(atualizacao.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode atualizado = atualizacao.getBody();
        assertThat(atualizado.path("id").asText()).isEqualTo(id);
        assertThat(atualizado.path("householdId").asText()).isEqualTo("local-demo");
        assertThat(atualizado.path("createdAt").asText()).isEqualTo(criado.path("createdAt").asText());
        assertThat(atualizado.path("description").asText()).isEqualTo("Descrição fictícia");
        assertThat(atualizado.path("competenceDate").asText()).isEqualTo("2028-02-01");
        assertThat(atualizado.path("metadata")).isEqualTo(criado.path("metadata"));
        assertThat(banco.queryForObject("SELECT amount FROM entries WHERE id = ?", BigDecimal.class, id))
                .isEqualByComparingTo("0.20");
        entrada.remove("status");
        entrada.remove("origin");
        entrada.remove("excludeFromCalc");
        JsonNode preservado = enviar(HttpMethod.PUT, "/api/entries/" + id, entrada).getBody();
        assertThat(preservado.path("status").asText()).isEqualTo("paid");
        assertThat(preservado.path("origin").asText()).isEqualTo("imported");
        assertThat(preservado.path("excludeFromCalc").asBoolean()).isTrue();

        var exclusao = enviar(HttpMethod.DELETE, "/api/entries/" + id, null);
        assertThat(exclusao.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(exclusao.getBody()).isNull();
        assertThat(banco.queryForObject("SELECT count(*) FROM entries WHERE id = ?", Integer.class, id)).isZero();
        validarErro(enviar(HttpMethod.GET, "/api/entries/" + id, null), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.PUT, "/api/entries/" + id, entrada), HttpStatus.NOT_FOUND);
        validarErro(enviar(HttpMethod.DELETE, "/api/entries/" + id, null), HttpStatus.NOT_FOUND);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.10", "0.20", "1234.56", "999999999999.99"})
    void conservaPrecisaoSemArredondamentoSilencioso(String valor) {
        Map<String, Object> entrada = lancamento();
        entrada.put("amount", new BigDecimal(valor));
        JsonNode criado = criar(entrada);
        assertThat(criado.path("amount").decimalValue()).isEqualByComparingTo(valor);
        assertThat(banco.queryForObject("SELECT amount FROM entries WHERE id = ?", BigDecimal.class,
                criado.path("id").asText())).isEqualByComparingTo(valor);
    }

    @ParameterizedTest
    @ValueSource(strings = {"pending", "paid", "review"})
    void aceitaStatusDeclarados(String status) {
        Map<String, Object> entrada = lancamento();
        entrada.put("status", status);
        assertThat(criar(entrada).path("status").asText()).isEqualTo(status);
    }

    @ParameterizedTest
    @ValueSource(strings = {"auto", "manual", "imported"})
    void aceitaOrigensDeclaradas(String origem) {
        Map<String, Object> entrada = lancamento();
        entrada.put("origin", origem);
        assertThat(criar(entrada).path("origin").asText()).isEqualTo(origem);
    }

    @ParameterizedTest
    @ValueSource(strings = {"income", "expense"})
    void aceitaTiposEParcelasCoerentes(String tipo) {
        Map<String, Object> entrada = lancamento();
        entrada.put("title", "L".repeat(100));
        entrada.put("kind", tipo);
        entrada.put("installmentIndex", 1000);
        entrada.put("installmentTotal", 1000);
        JsonNode criado = criar(entrada);
        assertThat(criado.path("kind").asText()).isEqualTo(tipo);
        assertThat(criado.path("title").asText()).hasSize(100);
        assertThat(criado.path("installmentIndex").asInt()).isEqualTo(1000);
        assertThat(criado.path("installmentTotal").asInt()).isEqualTo(1000);
    }

    @Test
    void preservaHistoricoAoExcluirContaBeneficioECategoria() {
        var respostaConta = enviar(HttpMethod.POST, "/api/accounts",
                Map.of("name", "Benefício fictício", "type", "benefit"));
        assertThat(respostaConta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String contaId = respostaConta.getBody().path("id").asText();
        var respostaCategoria = enviar(HttpMethod.POST, "/api/categories",
                Map.of("name", "Categoria fictícia", "kind", "expense", "color", "#123ABC"));
        assertThat(respostaCategoria.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String categoriaId = respostaCategoria.getBody().path("id").asText();
        Map<String, Object> entrada = lancamento();
        entrada.put("accountId", contaId);
        entrada.put("categoryId", categoriaId);
        entrada.put("metadata", Map.of("fixture", "historico-ficticio"));
        JsonNode criado = criar(entrada);
        String id = criado.path("id").asText();
        assertThat(criado.path("accountId").asText()).isEqualTo(contaId);
        assertThat(criado.path("categoryId").asText()).isEqualTo(categoriaId);
        assertThat(enviar(HttpMethod.DELETE, "/api/accounts/" + contaId, null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        JsonNode semConta = enviar(HttpMethod.GET, "/api/entries/" + id, null).getBody();
        assertThat(semConta.path("accountId").isNull()).isTrue();
        assertThat(semConta.path("categoryId").asText()).isEqualTo(categoriaId);
        assertThat(enviar(HttpMethod.DELETE, "/api/categories/" + categoriaId, null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        var consulta = enviar(HttpMethod.GET, "/api/entries/" + id, null);
        assertThat(consulta.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode historico = consulta.getBody();
        assertThat(historico.path("accountId").isNull()).isTrue();
        assertThat(historico.path("categoryId").isNull()).isTrue();
        assertThat(historico.path("title")).isEqualTo(criado.path("title"));
        assertThat(historico.path("amount")).isEqualTo(criado.path("amount"));
        assertThat(historico.path("metadata")).isEqualTo(criado.path("metadata"));
        assertThat(historico.path("createdAt")).isEqualTo(criado.path("createdAt"));
        assertThat(banco.queryForObject("SELECT count(*) FROM entries WHERE id = ?", Integer.class, id)).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"accountId", "categoryId"})
    void rejeitaReferenciaInexistenteSemCriarOuAlterarRegistro(String campo) {
        Map<String, Object> entrada = lancamento();
        JsonNode criado = criar(entrada);
        entrada.put("title", "Alteração que deve ser revertida");
        entrada.put(campo, "missing-reference-sensitive-sentinel");
        validarErro(enviar(HttpMethod.POST, "/api/entries", entrada), HttpStatus.BAD_REQUEST);
        validarErro(enviar(HttpMethod.PUT, "/api/entries/" + criado.path("id").asText(), entrada), HttpStatus.BAD_REQUEST);
        assertThat(enviar(HttpMethod.GET, "/api/entries/" + criado.path("id").asText(), null).getBody()).isEqualTo(criado);
        assertThat(banco.queryForObject("SELECT count(*) FROM entries", Integer.class)).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"id", "householdId", "createdAt", "updatedAt"})
    void rejeitaCamposControladosPeloServidor(String campo) {
        Map<String, Object> entrada = lancamento();
        entrada.put(campo, "identity-sensitive-sentinel");
        validarErro(enviar(HttpMethod.POST, "/api/entries", entrada), HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM entries", Integer.class)).isZero();
    }

    @ParameterizedTest
    @MethodSource("camposInvalidos")
    void rejeitaTiposValoresDatasOuReferenciasInvalidas(String campo, Object valor) {
        Map<String, Object> entrada = lancamento();
        entrada.put(campo, valor);
        validarErro(enviar(HttpMethod.POST, "/api/entries", entrada), HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM entries", Integer.class)).isZero();
    }

    static Stream<Arguments> camposInvalidos() {
        return Stream.of(
                Arguments.of("title", null), Arguments.of("title", "  "),
                Arguments.of("title", "T".repeat(101)), Arguments.of("title", 1),
                Arguments.of("amount", null), Arguments.of("amount", new BigDecimal("-0.01")),
                Arguments.of("amount", new BigDecimal("0.001")),
                Arguments.of("amount", new BigDecimal("1000000000000.00")),
                Arguments.of("amount", "0.10"), Arguments.of("amount", ""),
                Arguments.of("kind", null), Arguments.of("kind", "invalid-kind-sensitive-sentinel"),
                Arguments.of("kind", 1), Arguments.of("dueDate", null),
                Arguments.of("dueDate", "2027-02-29"), Arguments.of("dueDate", "2028-13-01"),
                Arguments.of("dueDate", "01/02/2028"), Arguments.of("dueDate", ""),
                Arguments.of("competenceDate", "2028-02-30"), Arguments.of("competenceDate", ""),
                Arguments.of("status", "invalid-status-sensitive-sentinel"),
                Arguments.of("origin", "invalid-origin-sensitive-sentinel"),
                Arguments.of("excludeFromCalc", "true"), Arguments.of("excludeFromCalc", ""),
                Arguments.of("ruleId", "rule-sensitive-sentinel"),
                Arguments.of("accountId", ""), Arguments.of("categoryId", ""),
                Arguments.of("metadata", "invalid-metadata-sensitive-sentinel"));
    }

    @ParameterizedTest
    @MethodSource("parcelasInvalidas")
    void rejeitaParcelasIncompletasOuIncoerentes(Object indice, Object total) {
        Map<String, Object> entrada = lancamento();
        entrada.put("installmentIndex", indice);
        entrada.put("installmentTotal", total);
        validarErro(enviar(HttpMethod.POST, "/api/entries", entrada), HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM entries", Integer.class)).isZero();
    }

    static Stream<Arguments> parcelasInvalidas() {
        return Stream.of(Arguments.of(1, null), Arguments.of(null, 2),
                Arguments.of(0, 2), Arguments.of(1, 0), Arguments.of(3, 2),
                Arguments.of(new BigDecimal("1.5"), 2), Arguments.of(1, new BigDecimal("2.5")),
                Arguments.of("1", 2), Arguments.of(1, ""));
    }

    @Test
    void listaPorVencimentoEIdComOrdemEstavelNaViradaDoAno() {
        Map<String, Object> entrada = lancamento();
        entrada.put("dueDate", "2029-01-01");
        JsonNode ultimo = criar(entrada);
        entrada.put("dueDate", "2028-12-31");
        JsonNode primeiro = criar(entrada);
        JsonNode segundo = criar(entrada);
        List<String> esperados = new ArrayList<>(Stream.of(primeiro.path("id").asText(),
                segundo.path("id").asText()).sorted().toList());
        esperados.add(ultimo.path("id").asText());
        var resposta = enviar(HttpMethod.GET, "/api/entries", null);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<String> encontrados = new ArrayList<>();
        for (JsonNode item : resposta.getBody().path("entries")) {
            encontrados.add(item.path("id").asText());
        }
        assertThat(encontrados).containsExactlyElementsOf(esperados);
        assertThat(enviar(HttpMethod.GET, "/api/entries", null).getBody()).isEqualTo(resposta.getBody());
    }

    @Test
    void relatorioSemFiltrosOuRegistrosRetornaZeros() {
        JsonNode resumo = resumir("");
        validarTotais(resumo, "0.00", "0.00", "0.00", "0.00");
        assertThat(resumo.path("cashflow").size()).isZero();
        assertThat(resumo.path("categories").size()).isZero();
        assertThat(resumo.path("projection").size()).isZero();
    }

    @Test
    void relatoriosAplicamFiltrosIndependentesSemIncluirBeneficioOuItensExcluidos() {
        var respostaConta = enviar(HttpMethod.POST, "/api/accounts",
                Map.of("name", "Banco fictício", "owner", "Pessoa fictícia", "type", "bank"));
        assertThat(respostaConta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String contaId = respostaConta.getBody().path("id").asText();
        var respostaBeneficio = enviar(HttpMethod.POST, "/api/accounts",
                Map.of("name", "Benefício fictício", "type", "benefit"));
        assertThat(respostaBeneficio.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String beneficioId = respostaBeneficio.getBody().path("id").asText();
        var respostaCategoria = enviar(HttpMethod.POST, "/api/categories",
                Map.of("name", "Categoria fictícia", "kind", "expense", "color", "#123ABC"));
        assertThat(respostaCategoria.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String categoriaId = respostaCategoria.getBody().path("id").asText();

        Map<String, Object> entrada = lancamento();
        entrada.put("title", "Receita fictícia");
        entrada.put("kind", "income");
        entrada.put("amount", new BigDecimal("1.00"));
        entrada.put("dueDate", "2028-02-01");
        entrada.put("competenceDate", "2028-01-31");
        entrada.put("status", "paid");
        entrada.put("accountId", contaId);
        criar(entrada);

        entrada.put("title", "Tarifa ALVO fictícia");
        entrada.put("kind", "expense");
        entrada.put("amount", new BigDecimal("0.10"));
        entrada.put("dueDate", "2028-02-29");
        entrada.put("status", "review");
        entrada.put("categoryId", categoriaId);
        criar(entrada);

        entrada.put("title", "Outra despesa fictícia");
        entrada.put("amount", new BigDecimal("0.20"));
        entrada.put("dueDate", "2028-03-01");
        entrada.put("competenceDate", "2028-02-01");
        entrada.put("status", "pending");
        entrada.put("accountId", null);
        entrada.put("categoryId", null);
        criar(entrada);

        entrada.put("title", "Benefício fictício");
        entrada.put("kind", "income");
        entrada.put("amount", new BigDecimal("100.00"));
        entrada.put("dueDate", "2028-02-15");
        entrada.put("competenceDate", "2028-02-15");
        entrada.put("status", "paid");
        entrada.put("accountId", beneficioId);
        criar(entrada);

        entrada.put("title", "Item excluído fictício");
        entrada.put("kind", "expense");
        entrada.put("amount", new BigDecimal("5.00"));
        entrada.put("dueDate", "2028-02-20");
        entrada.put("competenceDate", "2028-02-20");
        entrada.put("status", "pending");
        entrada.put("accountId", contaId);
        entrada.put("categoryId", categoriaId);
        entrada.put("excludeFromCalc", true);
        criar(entrada);

        JsonNode todos = resumir("");
        validarTotais(todos, "1.00", "0.30", "0.70", "105.00");
        assertThat(todos.path("kpis").path("pendingAmount").decimalValue()).isEqualByComparingTo("0.30");
        validarTotais(resumir("?from=2028-02-01&to=2028-02-29&periodMode=due_date"),
                "1.00", "0.10", "0.90", "105.00");
        validarTotais(resumir("?from=2028-02-01&to=2028-02-29&periodMode=competence"),
                "0.00", "0.20", "-0.20", "105.00");
        String filtroCombinado = "?from=2028-01-01&to=2028-01-31&periodMode=competence&accountId=" + contaId
                + "&categoryId=" + categoriaId + "&kind=expense&status=review&search=alvo";
        JsonNode filtrado = resumir(filtroCombinado);
        validarTotais(filtrado, "0.00", "0.10", "-0.10", "0.00");
        assertThat(filtrado.path("categories").path(categoriaId).decimalValue()).isEqualByComparingTo("0.10");
        assertThat(filtrado.path("cashflow").get(0).path("month").asText()).isEqualTo("2028-01");
        validarTotais(resumir("?from=2028-03-01&to=2028-03-01&accountId=none&categoryId=none"
                + "&kind=expense&status=pending&search=Outra"), "0.00", "0.20", "-0.20", "0.00");
        validarTotais(resumir(filtroCombinado), "0.00", "0.10", "-0.10", "0.00");
        validarTotais(resumir("?kind=income&status=paid"), "1.00", "0.00", "1.00", "100.00");
        validarTotais(resumir("?accountId=" + beneficioId), "0.00", "0.00", "0.00", "100.00");
        assertThat(banco.queryForObject("SELECT count(*) FROM entries", Integer.class)).isEqualTo(5);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "?from=invalid-date-sensitive-sentinel", "?to=invalid-date-sensitive-sentinel",
            "?from=2027-02-29", "?to=2028-02-30", "?from=2028-03-01&to=2028-02-29",
            "?periodMode=invalid-mode-sensitive-sentinel", "?kind=invalid-kind-sensitive-sentinel",
            "?status=invalid-status-sensitive-sentinel"})
    void relatorioRejeitaFiltrosInvalidosComErroAmigavel(String consulta) {
        var resposta = enviar(HttpMethod.GET, "/api/reports/summary" + consulta, null);
        validarErro(resposta, HttpStatus.BAD_REQUEST);
        assertThat(resposta.getBody().toString()).doesNotContain("sensitive-sentinel");
    }

    private JsonNode resumir(String consulta) {
        var resposta = enviar(HttpMethod.GET, "/api/reports/summary" + consulta, null);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        return resposta.getBody();
    }

    private void validarTotais(JsonNode resumo, String receitas, String despesas, String saldo, String excluidos) {
        JsonNode totais = resumo.path("totals");
        assertThat(totais.path("income").decimalValue()).isEqualByComparingTo(receitas);
        assertThat(totais.path("expense").decimalValue()).isEqualByComparingTo(despesas);
        assertThat(totais.path("net").decimalValue()).isEqualByComparingTo(saldo);
        assertThat(totais.path("excluded").decimalValue()).isEqualByComparingTo(excluidos);
    }

    private static Map<String, Object> lancamento() {
        Map<String, Object> entrada = new LinkedHashMap<>();
        entrada.put("title", "Lançamento fictício");
        entrada.put("amount", new BigDecimal("0.10"));
        entrada.put("kind", "expense");
        entrada.put("dueDate", "2028-02-29");
        return entrada;
    }

    private JsonNode criar(Map<String, Object> entrada) {
        var resposta = enviar(HttpMethod.POST, "/api/entries", entrada);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resposta.getBody();
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
                "SQLException", "INSERT INTO", "identity-sensitive-sentinel", "invalid-kind-sensitive-sentinel",
                "invalid-status-sensitive-sentinel", "invalid-origin-sensitive-sentinel", "rule-sensitive-sentinel",
                "invalid-metadata-sensitive-sentinel", "missing-reference-sensitive-sentinel");
    }
}
