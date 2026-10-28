package com.financeiro.health;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
@Testcontainers
class HealthIntegrationIT {
    @Container
    static final PostgreSQLContainer<?> DATABASE = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("financeiro_lab_test")
            .withUsername("financeiro_lab")
            .withPassword("test_password");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:"
                + DATABASE.getMappedPort(5432) + "/financeiro_lab_test");
        registry.add("spring.datasource.username", DATABASE::getUsername);
        registry.add("spring.datasource.password", DATABASE::getPassword);
    }

    @Autowired
    private TestRestTemplate http;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Flyway flyway;

    @Test
    void startsWithPostgresAppliesMigrationAndServesHealth() {
        var response = http.getForEntity("/api/health", HealthResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(new HealthResponse("UP", "UP", "local-demo"));
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("6");
        assertThat(jdbcTemplate.queryForObject("select count(*) from lab_metadata", Integer.class)).isEqualTo(1);
    }

    @Test
    void publishesOpenApiAndSwagger() {
        var response = http.getForEntity("/v3/api-docs", Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Map<?, ?>) response.getBody().get("paths")).containsKey("/api/health")).isTrue();
        assertThat(((Map<?, ?>) response.getBody().get("paths")).containsKey("/api/accounts")).isTrue();
        assertThat(((Map<?, ?>) response.getBody().get("paths")).containsKey("/api/accounts/{id}")).isTrue();
        assertThat(((Map<?, ?>) response.getBody().get("paths")).containsKey("/api/categories")).isTrue();
        assertThat(((Map<?, ?>) response.getBody().get("paths")).containsKey("/api/entries")).isTrue();
        assertThat(((Map<?, ?>) response.getBody().get("paths")).containsKey("/api/rules")).isTrue();
        assertThat(((Map<?, ?>) response.getBody().get("paths")).containsKey("/api/rules/rebuild")).isTrue();
        assertThat(http.getForEntity("/swagger-ui/index.html", String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }
}
