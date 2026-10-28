package com.financeiro.health;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class HealthServiceTest {
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final HealthService service = new HealthService(jdbcTemplate);

    @Test
    void reportsHealthyOnlyWithMigratedDemoDatabase() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class))).thenReturn("local-demo");
        assertThat(service.check()).isEqualTo(new HealthResponse("UP", "UP", "local-demo"));
    }

    @Test
    void reportsDatabaseFailureWithoutExposingDetails() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class)))
                .thenThrow(new DataAccessResourceFailureException("private database details"));
        assertThatThrownBy(service::check)
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(exception.getReason()).isEqualTo("Banco local indisponivel.");
                });
    }

    @Test
    void rejectsUnexpectedDatabaseMarker() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class))).thenReturn("unexpected");
        assertThatThrownBy(service::check)
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }
}
