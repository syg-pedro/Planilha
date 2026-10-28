package com.financeiro.seguranca;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeiro.erros.ErroApi;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class ConfiguracaoSeguranca {
    public static final Set<String> ORIGENS = Set.of(
            "http://127.0.0.1:5173", "http://localhost:5173",
            "http://127.0.0.1:5174", "http://localhost:5174",
            "http://127.0.0.1:4173", "http://localhost:4173",
            "http://127.0.0.1:3100", "http://localhost:3100",
            "http://127.0.0.1:8080", "http://localhost:8080");

    @Bean
    PasswordEncoder senhas() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    AuthenticationManager autenticacao(SegurancaRepository repository, PasswordEncoder senhas) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(email -> {
            var usuario = repository.buscarPorEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas."));
            return User.withUsername(usuario.email()).password(usuario.senhaHash())
                    .disabled(!usuario.ativo()).authorities("USER").build();
        });
        provider.setPasswordEncoder(senhas);
        return new ProviderManager(provider);
    }

    @Bean
    KeyPair chavesJwt() throws Exception {
        KeyPairGenerator gerador = KeyPairGenerator.getInstance("RSA");
        gerador.initialize(2048);
        return gerador.generateKeyPair();
    }

    @Bean
    JwtEncoder emitirJwt(KeyPair chaves) {
        RSAKey chave = new RSAKey.Builder((RSAPublicKey) chaves.getPublic())
                .privateKey((RSAPrivateKey) chaves.getPrivate()).keyID("financeiro-local").build();
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(chave)));
    }

    @Bean
    JwtDecoder validarJwt(KeyPair chaves, SegurancaRepository repository, Clock clock) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) chaves.getPublic()).build();
        JwtTimestampValidator tempo = new JwtTimestampValidator(Duration.ZERO);
        tempo.setClock(clock);
        OAuth2TokenValidator<Jwt> audiencia = jwt -> jwt.getAudience() != null && jwt.getAudience().contains(SegurancaService.AUDIENCIA)
                ? OAuth2TokenValidatorResult.success() : invalido();
        OAuth2TokenValidator<Jwt> sessao = jwt -> {
            try {
                var atual = repository.buscarSessao(jwt.getClaimAsString("sid"));
                var usuario = repository.buscarUsuario(jwt.getSubject());
                if (jwt.getExpiresAt() == null || atual.isEmpty() || usuario.isEmpty() || !usuario.get().ativo()
                        || !atual.get().ativa(clock.instant())
                        || !atual.get().usuarioId().equals(usuario.get().id())
                        || !atual.get().familiaId().equals(jwt.getClaimAsString("hid"))) return invalido();
                return OAuth2TokenValidatorResult.success();
            } catch (RuntimeException exception) {
                return invalido();
            }
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                tempo, new JwtIssuerValidator(SegurancaService.EMISSOR), audiencia, sessao));
        return decoder;
    }

    @Bean
    AuthenticationEntryPoint entradaNegada(ObjectMapper json) {
        return (request, response, exception) -> {
            response.setStatus(401);
            response.setHeader("WWW-Authenticate", "Bearer");
            response.setContentType("application/json");
            json.writeValue(response.getOutputStream(), new ErroApi("UNAUTHORIZED",
                    "Faça login para continuar.", Map.of()));
        };
    }

    @Bean
    AccessDeniedHandler acessoNegado(ObjectMapper json) {
        return (request, response, exception) -> {
            response.setStatus(403);
            response.setContentType("application/json");
            json.writeValue(response.getOutputStream(), new ErroApi("FORBIDDEN",
                    "Você não tem permissão para esta operação.", Map.of()));
        };
    }

    @Bean
    SecurityFilterChain seguranca(HttpSecurity http, AuthenticationEntryPoint entrada,
            AccessDeniedHandler negado) throws Exception {
        http.cors(cors -> cors.configurationSource(origensPermitidas()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(regras -> regras
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(erros -> erros.authenticationEntryPoint(entrada).accessDeniedHandler(negado))
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(entrada).accessDeniedHandler(negado));
        return http.build();
    }

    @Bean
    OpenAPI documentarAutenticacao() {
        return new OpenAPI().components(new Components().addSecuritySchemes("bearerAuth",
                new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    private UrlBasedCorsConfigurationSource origensPermitidas() {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.copyOf(ORIGENS));
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        cors.setExposedHeaders(List.of("Location"));
        cors.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/**", cors);
        return fonte;
    }

    private OAuth2TokenValidatorResult invalido() {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Sessão inválida.", null));
    }
}
