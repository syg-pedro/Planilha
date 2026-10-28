package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.StreamSupport;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
@Testcontainers
class MatrizIntegrationIT {
    @Container
    static final PostgreSQLContainer<?> DATABASE = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("financeiro_lab_test").withUsername("financeiro_lab").withPassword("test_password");

    @DynamicPropertySource
    static void banco(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:"
                + DATABASE.getMappedPort(5432) + "/financeiro_lab_test");
        registry.add("spring.datasource.username", DATABASE::getUsername);
        registry.add("spring.datasource.password", DATABASE::getPassword);
    }

    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void limparSomenteBancoDescartavel() {
        for (String tabela : List.of("entries", "rules", "categories", "accounts", "wish_items",
                "household_invitations", "auth_sessions", "household_members")) jdbc.update("DELETE FROM " + tabela);
        jdbc.update("DELETE FROM household_settings WHERE id <> 'local-demo'");
        jdbc.update("DELETE FROM households WHERE id <> 'local-demo'");
        jdbc.update("DELETE FROM auth_users");
    }

    @Test
    void agregaFaturaComCentavosParcelasEExclusoesSemPerderRegistros() {
        String token = cadastrar();
        String cartao = conta(token, "credit_card", true, new BigDecimal("1000"));
        String beneficio = conta(token, "benefit", true, null);
        entrada(token, cartao, "expense", "0.10", "paid", "2028-01-28", "2028-01-28", false);
        entrada(token, cartao, "expense", "0.20", "review", "2028-01-28", "2028-01-28", false);
        entrada(token, beneficio, "income", "700", "pending", "2028-01-15", "2028-01-15", false);
        entrada(token, null, "expense", "0", "pending", "2028-01-12", "2028-01-12", false);

        JsonNode matriz = matriz(token, "startMonth=2028-01&count=2&periodMode=due_date");
        JsonNode linhaCartao = StreamSupport.stream(matriz.path("rows").spliterator(), false)
                .filter(linha -> "cards".equals(linha.path("group").asText())).findFirst().orElseThrow();
        JsonNode janeiro = linhaCartao.path("cells").path("2028-01");
        assertThat(janeiro.path("amount").decimalValue()).isEqualByComparingTo("0.30");
        assertThat(janeiro.path("paid").decimalValue()).isEqualByComparingTo("0.10");
        assertThat(janeiro.path("pending").decimalValue()).isEqualByComparingTo("0.20");
        assertThat(janeiro.path("status").asText()).isEqualTo("mixed");
        assertThat(janeiro.path("entries").size()).isEqualTo(2);
        assertThat(linhaCartao.path("cells").path("2028-02").path("status").isNull()).isTrue();
        assertThat(matriz.path("totals").path("expense").decimalValue()).isEqualByComparingTo("0.30");
        assertThat(matriz.path("totals").path("excluded").decimalValue()).isEqualByComparingTo("700.00");
        JsonNode zero = StreamSupport.stream(matriz.path("rows").spliterator(), false)
                .filter(linha -> "expenses".equals(linha.path("group").asText())).findFirst().orElseThrow();
        assertThat(zero.path("cells").path("2028-01").path("amount").decimalValue()).isZero();
        assertThat(zero.path("cells").path("2028-01").path("entries").size()).isEqualTo(1);
        assertThat(zero.path("cells").path("2028-01").path("status").asText()).isEqualTo("pending");
    }

    @Test
    void compromissoGlobalIncluiFuturoEExcluidosComoFuncaoOriginal() {
        String token = cadastrar();
        String cartao = conta(token, "credit_card", true, new BigDecimal("1000"));
        entrada(token, cartao, "expense", "125", "pending", "2030-01-28", "2030-01-28", false);
        entrada(token, cartao, "expense", "40", "review", "2028-01-28", "2028-01-28", true);

        JsonNode matriz = matriz(token, "startMonth=2028-01&count=1");

        assertThat(matriz.path("totals").path("expense").decimalValue()).isZero();
        assertThat(matriz.path("totals").path("excluded").decimalValue()).isEqualByComparingTo("40.00");
        assertThat(matriz.path("cardCommitments").path(cartao).path("committed").decimalValue()).isEqualByComparingTo("165.00");
        assertThat(matriz.path("cardCommitments").path(cartao).path("available").decimalValue()).isEqualByComparingTo("835.00");
    }

    @Test
    void filtraContaTipoStatusBuscaECriterioAntesDosTotais() {
        String token = cadastrar();
        String banco = conta(token, "bank", true, null);
        entrada(token, banco, "expense", "10", "pending", "2028-01-31", "2028-02-01", false);
        entrada(token, banco, "income", "50", "paid", "2028-01-05", "2028-01-05", false);

        JsonNode receitas = matriz(token, "startMonth=2028-01&count=1&accountId=" + banco + "&kind=income&status=paid&search=DESPESA");
        assertThat(receitas.path("totals").path("income").decimalValue()).isEqualByComparingTo("50.00");
        assertThat(receitas.path("totals").path("expense").decimalValue()).isZero();
        JsonNode competencia = matriz(token, "startMonth=2028-01&count=2&periodMode=competence&kind=expense");
        assertThat(competencia.path("summaries").path("2028-01").path("expense").decimalValue()).isZero();
        assertThat(competencia.path("summaries").path("2028-02").path("expense").decimalValue()).isEqualByComparingTo("10.00");
        assertThat(matriz(token, "startMonth=2028-01&count=1&accountId=none").path("rows").size()).isZero();
    }

    @Test
    void cartoesVaziosAtivosAparecemSemFiltroEInativosNaoAparecem() {
        String token = cadastrar();
        String ativo = conta(token, "credit_card", true, null);
        conta(token, "credit_card", false, new BigDecimal("100"));

        JsonNode matriz = matriz(token, "startMonth=2028-01&count=1");

        assertThat(matriz.path("rows").size()).isEqualTo(1);
        assertThat(matriz.path("rows").get(0).path("account").path("id").asText()).isEqualTo(ativo);
        assertThat(matriz.path("cardCommitments").path(ativo).path("available").isNull()).isTrue();
        assertThat(matriz(token, "startMonth=2028-01&count=1&search=semregistro").path("rows").size()).isZero();
    }

    @Test
    void familiasDiferentesNaoCompartilhamLinhasOuTotais() {
        String primeira = cadastrar();
        String segunda = cadastrar();
        entrada(primeira, null, "income", "10", "paid", "2028-01-05", "2028-01-05", false);
        entrada(segunda, null, "income", "999", "paid", "2028-01-05", "2028-01-05", false);

        assertThat(matriz(primeira, "startMonth=2028-01&count=1").path("totals").path("income").decimalValue())
                .isEqualByComparingTo("10.00");
        assertThat(matriz(segunda, "startMonth=2028-01&count=1").path("totals").path("income").decimalValue())
                .isEqualByComparingTo("999.00");
        assertThat(chamar(HttpMethod.GET, "/api/reports/matrix?startMonth=2028-01", null, null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejeitaIntervalosETiposDeFiltroInvalidosCom400() {
        String token = cadastrar();
        for (String consulta : List.of("startMonth=2028-13", "startMonth=2028-1", "count=0", "count=25", "count=1.5",
                "periodMode=invalid", "kind=transfer", "status=invalid")) {
            var resposta = chamar(HttpMethod.GET, "/api/reports/matrix?" + consulta, token, null);
            assertThat(resposta.getStatusCode()).as(consulta).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(resposta.getBody().path("message").asText()).doesNotContain("Exception", "http://");
        }
        assertThat(matriz(token, "startMonth=2028-01&count=24").path("months").size()).isEqualTo(24);
    }

    private String cadastrar() {
        var resposta = chamar(HttpMethod.POST, "/api/auth/register", null, Map.of("name", "Pessoa fictícia",
                "email", UUID.randomUUID() + "@lab.invalid", "password", "senha-ficticia-123", "familyName", "Família fictícia"));
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resposta.getBody().path("accessToken").asText();
    }

    private String conta(String token, String tipo, boolean ativa, BigDecimal limite) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("name", "Conta fictícia " + tipo);
        corpo.put("type", tipo);
        corpo.put("active", ativa);
        corpo.put("limitTotal", limite);
        corpo.put("dueDay", "credit_card".equals(tipo) ? 28 : null);
        var resposta = chamar(HttpMethod.POST, "/api/accounts", token, corpo);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resposta.getBody().path("id").asText();
    }

    private void entrada(String token, String conta, String tipo, String valor, String estado,
            String vencimento, String competencia, boolean excluir) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("title", "Despesa fictícia");
        corpo.put("accountId", conta);
        corpo.put("amount", new BigDecimal(valor));
        corpo.put("kind", tipo);
        corpo.put("status", estado);
        corpo.put("dueDate", vencimento);
        corpo.put("competenceDate", competencia);
        corpo.put("excludeFromCalc", excluir);
        assertThat(chamar(HttpMethod.POST, "/api/entries", token, corpo).getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private JsonNode matriz(String token, String consulta) {
        var resposta = chamar(HttpMethod.GET, "/api/reports/matrix?" + consulta, token, null);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.OK);
        return resposta.getBody();
    }

    private ResponseEntity<JsonNode> chamar(HttpMethod metodo, String caminho, String token, Object corpo) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Requested-With", "FinanceiroLab");
        if (token != null) headers.setBearerAuth(token);
        return http.exchange(caminho, metodo, new HttpEntity<>(corpo, headers), JsonNode.class);
    }
}
