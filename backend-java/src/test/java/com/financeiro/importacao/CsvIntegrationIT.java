package com.financeiro.importacao;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import com.financeiro.seguranca.ContextoLocalTestConfig;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
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
class CsvIntegrationIT {
    @Container
    static final PostgreSQLContainer<?> BANCO = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("financeiro_lab_test").withUsername("financeiro_lab").withPassword("test_password");

    @DynamicPropertySource
    static void configurar(DynamicPropertyRegistry propriedades) {
        propriedades.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:"
                + BANCO.getMappedPort(5432) + "/financeiro_lab_test");
        propriedades.add("spring.datasource.username", BANCO::getUsername);
        propriedades.add("spring.datasource.password", BANCO::getPassword);
    }

    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate banco;
    @Autowired EntityManagerFactory entidades;

    @BeforeEach
    void limpar() {
        assertThat(banco.queryForObject("SELECT current_database()", String.class)).isEqualTo("financeiro_lab_test");
        banco.update("DELETE FROM entries");
    }

    @Test
    void previaNaoGravaEImportacaoPreservaCentavosSinaisEOrigem() {
        String csv = "Data;Descrição;Valor\n29/02/2028;Despesa fictícia;0,10\n"
                + "2028-03-01;Receita fictícia;-1.234,56\n2028-02-30;Inválida;10";
        var previa = http.postForEntity("/api/import/csv/preview", Map.of("csvText", csv), JsonNode.class);
        assertThat(previa.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(previa.getBody().path("rows").size()).isEqualTo(2);
        assertThat(previa.getBody().path("warnings").size()).isEqualTo(1);
        assertThat(previa.getBody().path("canImport").asBoolean()).isTrue();
        assertThat(banco.queryForObject("SELECT count(*) FROM entries", Integer.class)).isZero();
        var resultado = http.postForEntity("/api/import/csv", Map.of("csvText", csv), JsonNode.class);
        assertThat(resultado.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resultado.getBody().path("inserted").asInt()).isEqualTo(2);
        assertThat(banco.queryForObject("SELECT amount FROM entries WHERE kind = 'expense'", BigDecimal.class))
                .isEqualByComparingTo("0.10");
        assertThat(banco.queryForObject("SELECT amount FROM entries WHERE kind = 'income'", BigDecimal.class))
                .isEqualByComparingTo("1234.56");
        assertThat(banco.queryForObject("SELECT count(*) FROM entries WHERE origin = 'imported'", Integer.class)).isEqualTo(2);
        var bootstrap = http.getForEntity("/api/bootstrap", JsonNode.class);
        assertThat(bootstrap.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(bootstrap.getBody().path("entries").size()).isEqualTo(2);
        assertThat(bootstrap.getBody().path("settings").path("id").asText()).isEqualTo("local-demo");
        assertThat(bootstrap.getBody().path("kpis").path("totalIncome").decimalValue())
                .isEqualByComparingTo("1234.56");
        assertThat(bootstrap.getBody().path("kpis").path("totalExpense").decimalValue())
                .isEqualByComparingTo("0.10");
    }

    @Test
    void estruturaInvalidaOuContaDesconhecidaNaoGravamNada() {
        var estrutura = http.postForEntity("/api/import/csv", Map.of("csvText",
                "date,amount,title\n2026-01-01,1,Fictício\n\"aspas abertas"), JsonNode.class);
        assertThat(estrutura.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        var conta = http.postForEntity("/api/import/csv/preview", Map.of("csvText",
                "date,amount\n2026-01-01,1", "accountId", "missing-account"), JsonNode.class);
        assertThat(conta.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM entries", Integer.class)).isZero();
    }

    @Test
    void loteFazRollbackQuandoSegundoRegistroNaoExiste() {
        var dados = Map.of("name", "Conta fictícia", "owner", "Teste", "type", "bank");
        var lote = Map.of("upserts", List.of(Map.of("data", dados),
                Map.of("id", "missing-account", "data", dados)), "deletes", List.of());
        var resposta = http.postForEntity("/api/legacy/accounts/batch", lote, JsonNode.class);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(banco.queryForObject("SELECT count(*) FROM accounts", Integer.class)).isZero();
    }

    @Test
    void loteValidaDtoInternoAntesDeGravar() {
        var lote = Map.of("upserts", List.of(Map.of("data", Map.of("name", " ", "type", "invalid"))),
                "deletes", List.of());
        var resposta = http.postForEntity("/api/legacy/accounts/batch", lote, JsonNode.class);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(banco.queryForObject("SELECT count(*) FROM accounts", Integer.class)).isZero();
    }

    @Test
    void repeticaoMensalEPaginacaoPreservamDatasFiltrosEQuantidadeDeConsultas() {
        var base = Map.of("title", "Fictício%_", "amount", new BigDecimal("0.10"), "kind", "expense",
                "dueDate", "2028-01-31", "competenceDate", "2028-01-30", "status", "paid", "origin", "manual");
        var criados = http.postForEntity("/api/entries/repeat", Map.of("entry", base, "months", 3), JsonNode.class);
        assertThat(criados.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        var registros = criados.getBody().path("entries");
        assertThat(registros.get(1).path("dueDate").asText()).isEqualTo("2028-02-29");
        assertThat(registros.get(2).path("dueDate").asText()).isEqualTo("2028-03-31");
        assertThat(registros.get(0).path("status").asText()).isEqualTo("paid");
        assertThat(registros.get(1).path("status").asText()).isEqualTo("pending");
        var estatisticas = entidades.unwrap(SessionFactory.class).getStatistics();
        estatisticas.setStatisticsEnabled(true);
        estatisticas.clear();
        try {
            var pagina = http.getForEntity("/api/entries/page?size=1&sort=date_desc&from=2028-01-01&to=2028-12-31&search={search}",
                    JsonNode.class, "%_");
            assertThat(pagina.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(pagina.getBody().path("entries").size()).isEqualTo(1);
            assertThat(pagina.getBody().path("entries").get(0).path("dueDate").asText()).isEqualTo("2028-03-31");
            assertThat(pagina.getBody().path("totalElements").asInt()).isEqualTo(3);
            assertThat(pagina.getBody().path("totalPages").asInt()).isEqualTo(3);
            assertThat(estatisticas.getPrepareStatementCount()).isEqualTo(2);
        } finally {
            estatisticas.setStatisticsEnabled(false);
        }
        var pendentes = http.getForEntity("/api/entries/page?status=pending&sort=amount_desc&size=100", JsonNode.class);
        assertThat(pendentes.getBody().path("totalElements").asInt()).isEqualTo(2);
        assertThat(http.getForEntity("/api/entries/page?size=101", JsonNode.class).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(http.getForEntity("/api/entries/page?sort=sql", JsonNode.class).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(http.getForEntity("/api/entries/page?from=2028-03-01&to=2028-02-01", JsonNode.class).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
