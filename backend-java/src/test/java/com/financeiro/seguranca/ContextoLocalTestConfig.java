package com.financeiro.seguranca;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@TestConfiguration(proxyBeanMethods = false)
public class ContextoLocalTestConfig {
    @Bean
    @Primary
    ContextoFamilia contextoDeTeste() {
        return local();
    }

    @Bean
    @Order(-100)
    SecurityFilterChain acessoDeTeste(HttpSecurity http) throws Exception {
        return http.securityMatcher(request -> true).csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(regras -> regras.anyRequest().permitAll()).build();
    }

    public static ContextoFamilia local() {
        return new ContextoFamilia() {
            @Override
            public String familiaId() {
                return "local-demo";
            }

            @Override
            public String usuarioId() {
                return "user-test";
            }

            @Override
            public String sessaoId() {
                return "session-test";
            }

            @Override
            public boolean proprietario() {
                return true;
            }
        };
    }
}
