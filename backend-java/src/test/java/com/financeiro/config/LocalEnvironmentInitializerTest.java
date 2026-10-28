package com.financeiro.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.mock.env.MockEnvironment;

class LocalEnvironmentInitializerTest {
    private MockEnvironment localEnvironment() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("server.address", "127.0.0.1")
                .withProperty("spring.datasource.url", "jdbc:postgresql://127.0.0.1:55432/financeiro_lab")
                .withProperty("spring.jpa.hibernate.ddl-auto", "validate")
                .withProperty("spring.jpa.generate-ddl", "false")
                .withProperty("spring.sql.init.mode", "never")
                .withProperty("spring.flyway.enabled", "true")
                .withProperty("spring.flyway.clean-disabled", "true");
        environment.setActiveProfiles("local");
        return environment;
    }

    @Test
    void acceptsOnlyLocalLaboratory() {
        assertThatCode(() -> LocalEnvironmentInitializer.validate(localEnvironment())).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {"prod", "production", "default", "staging"})
    void rejectsOtherProfiles(String profile) {
        MockEnvironment environment = localEnvironment();
        environment.setActiveProfiles(profile);
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(environment))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectsMixedProfiles() {
        MockEnvironment environment = localEnvironment();
        environment.setActiveProfiles("local", "prod");
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(environment))
                .isInstanceOf(IllegalStateException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "jdbc:postgresql://db.example.com:5432/financeiro_lab",
            "jdbc:postgresql://127.0.0.1:5432/postgres",
            "jdbc:postgresql://127.0.0.1:5432/financeiro_lab?socketFactory=other",
            "jdbc:postgresql://127.0.0.1:5432,db.example.com:5432/financeiro_lab",
            "jdbc:postgresql://localhost.example.com:5432/financeiro_lab"
    })
    void rejectsExternalOrUnrestrictedDatabase(String url) {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(
                localEnvironment().withProperty("spring.datasource.url", url)))
                .isInstanceOf(IllegalStateException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"spring.datasource.hikari.jdbc-url", "spring.flyway.url"})
    void rejectsAlternativeExternalConnections(String property) {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(localEnvironment()
                .withProperty(property, "jdbc:postgresql://db.example.com:5432/financeiro_lab")))
                .isInstanceOf(IllegalStateException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0.0.0.0", "::", "localhost"})
    void rejectsPublicBinding(String address) {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(
                localEnvironment().withProperty("server.address", address)))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectsAutomaticSchemaChanges() {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(
                localEnvironment().withProperty("spring.jpa.hibernate.ddl-auto", "create")))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectsEnablingFlywayClean() {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(
                localEnvironment().withProperty("spring.flyway.clean-disabled", "false")))
                .isInstanceOf(IllegalStateException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"spring.datasource.jndi-name", "spring.datasource.hikari.data-source-class-name",
            "spring.datasource.hikari.data-source-jndi", "spring.datasource.hikari.data-source-properties.serverName",
            "spring.flyway.jdbc-properties.serverName", "spring.jpa.properties.hibernate.hbm2ddl.auto",
            "spring.jpa.properties.jakarta.persistence.schema-generation.database.action"})
    void rejectsAlternativeDatasourceAndSchemaConfiguration(String property) {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(
                localEnvironment().withProperty(property, "unsafe")))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectsSqlInitialization() {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(
                localEnvironment().withProperty("spring.sql.init.mode", "always")))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectsJpaSchemaGeneration() {
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(
                localEnvironment().withProperty("spring.jpa.generate-ddl", "true")))
                .isInstanceOf(IllegalStateException.class);
    }

    @ParameterizedTest
    @CsvSource({
            "SPRING_DATASOURCE_HIKARI_JDBCURL,jdbc:postgresql://db.example.invalid:5432/financeiro_lab",
            "SPRING_DATASOURCE_JNDINAME,java:comp/env/jdbc/unsafe",
            "SPRING_DATASOURCE_HIKARI_DATASOURCECLASSNAME,org.postgresql.ds.PGSimpleDataSource",
            "SPRING_JPA_HIBERNATE_DDLAUTO,create",
            "SPRING_FLYWAY_CLEANDISABLED,false"
    })
    void rejectsUnsafeRelaxedEnvironmentVariables(String name, String value) {
        MockEnvironment environment = localEnvironment();
        environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource(
                "lab-systemEnvironment", Map.of(name, value)));
        assertThatThrownBy(() -> LocalEnvironmentInitializer.validate(environment))
                .isInstanceOf(IllegalStateException.class);
    }
}
