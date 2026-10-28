package com.financeiro.health;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class HealthService {
    private final JdbcTemplate jdbcTemplate;

    public HealthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public HealthResponse check() {
        try {
            String environment = jdbcTemplate.queryForObject(
                    "select value from lab_metadata where key = 'environment'", String.class);
            if (!"local-demo".equals(environment)) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Laboratorio indisponivel.");
            }
            return new HealthResponse("UP", "UP", environment);
        } catch (DataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Banco local indisponivel.", exception);
        }
    }
}
