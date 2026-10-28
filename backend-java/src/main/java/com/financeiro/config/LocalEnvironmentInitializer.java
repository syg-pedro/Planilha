package com.financeiro.config;

import java.util.Arrays;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

public class LocalEnvironmentInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    private static final Set<String> ALLOWED_PROFILES = Set.of("local", "test");
    private static final Pattern LOCAL_DATABASE = Pattern.compile(
            "jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]{1,5}/financeiro_lab(_test)?");

    @Override
    public void initialize(ConfigurableApplicationContext context) {
        validate(context.getEnvironment());
    }

    static void validate(Environment environment) {
        Binder binder = Binder.get(environment);
        String[] profiles = environment.getActiveProfiles().length == 0
                ? environment.getDefaultProfiles()
                : environment.getActiveProfiles();
        if (profiles.length != 1 || !ALLOWED_PROFILES.contains(profiles[0])) {
            throw new IllegalStateException("O laboratorio permite apenas o perfil local ou test.");
        }
        if (!"127.0.0.1".equals(binder.bind("server.address", String.class).orElse(null))) {
            throw new IllegalStateException("O laboratorio deve escutar somente em 127.0.0.1.");
        }
        for (String property : Arrays.asList(
                "spring.datasource.url", "spring.datasource.hikari.jdbc-url", "spring.flyway.url")) {
            String url = binder.bind(property, String.class).orElse(null);
            if ((url == null && property.equals("spring.datasource.url"))
                    || (url != null && !LOCAL_DATABASE.matcher(url).matches())) {
                throw new IllegalStateException("O laboratorio exige PostgreSQL local e banco exclusivo.");
            }
        }
        for (String property : Arrays.asList("spring.datasource.jndi-name",
                "spring.datasource.hikari.data-source-class-name", "spring.datasource.hikari.data-source-jndi")) {
            if (binder.bind(property, String.class).isBound()) {
                throw new IllegalStateException("O laboratorio nao permite datasource alternativo.");
            }
        }
        for (String prefix : Arrays.asList("spring.datasource.hikari.data-source-properties",
                "spring.flyway.jdbc-properties", "spring.jpa.properties")) {
            if (binder.bind(prefix, Bindable.mapOf(String.class, String.class)).isBound()) {
                throw new IllegalStateException("O laboratorio nao permite propriedades alternativas de conexao ou schema.");
            }
        }
        if (!"validate".equals(binder.bind("spring.jpa.hibernate.ddl-auto", String.class).orElse(null))
                || binder.bind("spring.jpa.generate-ddl", Boolean.class).orElse(true)
                || !"never".equals(binder.bind("spring.sql.init.mode", String.class).orElse(null))
                || !binder.bind("spring.flyway.enabled", Boolean.class).orElse(false)
                || !binder.bind("spring.flyway.clean-disabled", Boolean.class).orElse(false)) {
            throw new IllegalStateException("O laboratorio exige validacao de schema e bloqueio de clean.");
        }
    }
}
