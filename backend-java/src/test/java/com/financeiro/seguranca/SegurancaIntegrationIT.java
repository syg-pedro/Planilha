package com.financeiro.seguranca;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class SegurancaIntegrationIT {
    private static final String SENHA = "senha-ficticia-123";

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
    @Autowired PasswordEncoder senhas;
    @Autowired JwtEncoder encoder;
    @Autowired Clock clock;

    @BeforeEach
    void limparSomenteBancoDescartavel() {
        for (String tabela : List.of("entries", "rules", "categories", "accounts", "wish_items",
                "household_invitations", "auth_sessions", "household_members")) jdbc.update("DELETE FROM " + tabela);
        jdbc.update("DELETE FROM household_settings WHERE id <> 'local-demo'");
        jdbc.update("DELETE FROM households WHERE id <> 'local-demo'");
        jdbc.update("DELETE FROM auth_users");
    }

    @Test
    void healthPublicoEFinanceiroExigeAutenticacaoJson() {
        assertThat(http.getForEntity("/api/health", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
        var negado = chamar(HttpMethod.GET, "/api/accounts", null, null);
        assertThat(negado.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(negado.getBody().path("code").asText()).isEqualTo("UNAUTHORIZED");
        assertThat(negado.getBody().path("message").asText()).doesNotContain("JWT", "http", "Exception");
        assertThat(http.getForEntity("/swagger-ui/index.html", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void cadastraComHashCookieSeparadoEFamiliaPropria() {
        var resposta = cadastrar("cadastro");
        JsonNode corpo = resposta.getBody();
        assertThat(corpo.path("accessToken").asText()).isNotBlank();
        assertThat(corpo.path("expiresAt").asText()).isNotBlank();
        assertThat(corpo.path("family").path("role").asText()).isEqualTo("owner");
        assertThat(corpo.path("family").path("id").asText()).isNotEqualTo("local-demo");
        String hash = jdbc.queryForObject("SELECT password_hash FROM auth_users WHERE id = ?",
                String.class, corpo.path("user").path("id").asText());
        assertThat(hash).startsWith("$2a$12$").doesNotContain(SENHA);
        assertThat(senhas.matches(SENHA, hash)).isTrue();
        assertThat(resposta.getHeaders().getFirst("Set-Cookie"))
                .contains("finance-java-lab-refresh=", "HttpOnly", "SameSite=Strict", "Path=/api/auth")
                .doesNotContain("Secure");
        assertThat(chamar(HttpMethod.GET, "/api/auth/me", token(resposta), null).getBody().path("user"))
                .isEqualTo(corpo.path("user"));
    }

    @Test
    void loginCredenciaisInvalidasNaoRevelamUsuario() {
        var pessoa = cadastrar("login");
        String email = pessoa.getBody().path("user").path("email").asText();
        var errada = chamar(HttpMethod.POST, "/api/auth/login", null,
                Map.of("email", email, "password", "senha-errada"));
        var ausente = chamar(HttpMethod.POST, "/api/auth/login", null,
                Map.of("email", "ausente@lab.invalid", "password", "senha-errada"));
        assertThat(errada.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(ausente.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(errada.getBody()).isEqualTo(ausente.getBody());
        var correta = chamar(HttpMethod.POST, "/api/auth/login", null, Map.of("email", email, "password", SENHA));
        assertThat(correta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(chamar(HttpMethod.GET, "/api/accounts", token(correta), null).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void utf8MaiorQueLimiteBcryptERejeitadoAntesDePersistir() {
        var resposta = chamar(HttpMethod.POST, "/api/auth/register", null, Map.of("name", "Pessoa fictícia",
                "email", "bytes@lab.invalid", "password", "é".repeat(40), "familyName", "Família fictícia"));
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM auth_users", Integer.class)).isZero();
    }

    @Test
    void duasFamiliasNaoLeemAlteramOuRelacionamDadosEntreSi() {
        var primeira = cadastrar("primeira");
        var segunda = cadastrar("segunda");
        var conta = chamar(HttpMethod.POST, "/api/accounts", token(primeira),
                Map.of("name", "Conta fictícia A", "type", "bank"));
        assertThat(conta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = conta.getBody().path("id").asText();
        for (HttpMethod metodo : List.of(HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE)) {
            Object corpo = metodo == HttpMethod.PUT ? Map.of("name", "Alteração indevida", "type", "bank") : null;
            assertThat(chamar(metodo, "/api/accounts/" + id, token(segunda), corpo).getStatusCode())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }
        assertThat(chamar(HttpMethod.POST, "/api/entries", token(segunda), Map.of(
                "title", "Despesa fictícia", "amount", 1, "kind", "expense", "dueDate", "2028-01-15",
                "accountId", id)).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(chamar(HttpMethod.POST, "/api/families/select", token(segunda),
                Map.of("id", primeira.getBody().path("family").path("id").asText())).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void bancoTambemImpedeReferenciaCruzadaEMantemFamiliaAoExcluirConta() {
        var primeira = cadastrar("fk-a");
        var segunda = cadastrar("fk-b");
        String contaA = chamar(HttpMethod.POST, "/api/accounts", token(primeira),
                Map.of("name", "Conta A", "type", "bank")).getBody().path("id").asText();
        String contaB = chamar(HttpMethod.POST, "/api/accounts", token(segunda),
                Map.of("name", "Conta B", "type", "bank")).getBody().path("id").asText();
        var entrada = chamar(HttpMethod.POST, "/api/entries", token(segunda), Map.of(
                "title", "Despesa fictícia", "amount", 1, "kind", "expense", "dueDate", "2028-01-15",
                "accountId", contaB));
        String entradaId = entrada.getBody().path("id").asText();
        assertThatThrownBy(() -> jdbc.update("UPDATE entries SET account_id = ? WHERE id = ?", contaA, entradaId))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(chamar(HttpMethod.DELETE, "/api/accounts/" + contaB, token(segunda), null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        var preservada = chamar(HttpMethod.GET, "/api/entries/" + entradaId, token(segunda), null).getBody();
        assertThat(preservada.path("accountId").isNull()).isTrue();
        assertThat(preservada.path("householdId").asText()).isEqualTo(segunda.getBody().path("family").path("id").asText());
    }

    @Test
    void jwtExpiradoAdulteradoOuSemAudienceNaoAutoriza() throws Exception {
        var pessoa = cadastrar("jwt");
        String valido = token(pessoa);
        var claimsOriginais = SignedJWT.parse(valido).getJWTClaimsSet();
        Instant agora = clock.instant();
        JwtClaimsSet expiradas = JwtClaimsSet.builder().issuer(SegurancaService.EMISSOR)
                .subject(claimsOriginais.getSubject()).audience(List.of(SegurancaService.AUDIENCIA))
                .issuedAt(agora.minusSeconds(7200)).expiresAt(agora.minusSeconds(3600))
                .claim("sid", claimsOriginais.getStringClaim("sid")).claim("hid", claimsOriginais.getStringClaim("hid")).build();
        String expirado = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(SignatureAlgorithm.RS256).build(), expiradas))
                .getTokenValue();
        assertThat(chamar(HttpMethod.GET, "/api/accounts", expirado, null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        String[] partes = valido.split("\\.");
        char diferente = partes[2].charAt(10) == 'A' ? 'B' : 'A';
        partes[2] = partes[2].substring(0, 10) + diferente + partes[2].substring(11);
        assertThat(chamar(HttpMethod.GET, "/api/accounts", String.join(".", partes), null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        JwtClaimsSet semAudience = JwtClaimsSet.builder().issuer(SegurancaService.EMISSOR)
                .subject(claimsOriginais.getSubject()).issuedAt(agora).expiresAt(agora.plusSeconds(900))
                .claim("sid", claimsOriginais.getStringClaim("sid")).claim("hid", claimsOriginais.getStringClaim("hid")).build();
        String semAud = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(SignatureAlgorithm.RS256).build(), semAudience))
                .getTokenValue();
        assertThat(chamar(HttpMethod.GET, "/api/accounts", semAud, null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refreshExigeMarcadorGiraTokenERecusaReplayEOrigemExterna() {
        var pessoa = cadastrar("refresh");
        String cookie = cookie(pessoa);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Cookie", cookie);
        var semMarcador = http.exchange("/api/auth/refresh", HttpMethod.POST, new HttpEntity<>(null, headers), String.class);
        assertThat(semMarcador.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        headers.set("X-Requested-With", "FinanceiroLab");
        headers.setOrigin("https://externo.invalid");
        assertThat(http.exchange("/api/auth/refresh", HttpMethod.POST, new HttpEntity<>(null, headers), String.class)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        headers.remove("Origin");
        var renovada = http.exchange("/api/auth/refresh", HttpMethod.POST, new HttpEntity<>(null, headers), JsonNode.class);
        assertThat(renovada.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cookie(renovada)).isNotEqualTo(cookie);
        assertThat(http.exchange("/api/auth/refresh", HttpMethod.POST, new HttpEntity<>(null, headers), String.class)
                .getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void logoutRevogaBearerERefreshImediatamente() {
        var pessoa = cadastrar("logout");
        assertThat(chamar(HttpMethod.POST, "/api/auth/logout", token(pessoa), null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(chamar(HttpMethod.GET, "/api/accounts", token(pessoa), null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Cookie", cookie(pessoa));
        headers.set("X-Requested-With", "FinanceiroLab");
        assertThat(http.exchange("/api/auth/refresh", HttpMethod.POST, new HttpEntity<>(null, headers), String.class)
                .getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void usuarioDesativadoOuSessaoExpiradaNaoUsaApi() throws Exception {
        var pessoa = cadastrar("disabled");
        String usuario = pessoa.getBody().path("user").path("id").asText();
        jdbc.update("UPDATE auth_users SET active = FALSE WHERE id = ?", usuario);
        assertThat(chamar(HttpMethod.GET, "/api/accounts", token(pessoa), null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        jdbc.update("UPDATE auth_users SET active = TRUE WHERE id = ?", usuario);
        String sessao = SignedJWT.parse(token(pessoa)).getJWTClaimsSet().getStringClaim("sid");
        jdbc.update("UPDATE auth_sessions SET expires_at = ? WHERE id = ?", Timestamp.from(clock.instant().minusSeconds(1)), sessao);
        assertThat(chamar(HttpMethod.GET, "/api/accounts", token(pessoa), null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void conviteUneFamiliasSemMoverDadosENaoConcedePoderDeOwnerAoMembro() {
        var dono = cadastrar("owner");
        var membro = cadastrar("member");
        String familiaOriginal = membro.getBody().path("family").path("id").asText();
        String familiaCompartilhada = dono.getBody().path("family").path("id").asText();
        String email = membro.getBody().path("user").path("email").asText();
        var convite = chamar(HttpMethod.POST, "/api/families/invitations", token(dono), Map.of("email", email));
        assertThat(convite.getStatusCode()).isEqualTo(HttpStatus.OK);
        String conviteToken = convite.getBody().path("token").asText();
        assertThat(chamar(HttpMethod.POST, "/api/families/invitations/accept", token(membro),
                Map.of("token", conviteToken)).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(chamar(HttpMethod.POST, "/api/families/invitations/accept", token(membro),
                Map.of("token", conviteToken)).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(chamar(HttpMethod.GET, "/api/families", token(membro), null).getBody().path("families").size()).isEqualTo(2);
        var selecionada = chamar(HttpMethod.POST, "/api/families/select", token(membro), Map.of("id", familiaCompartilhada));
        assertThat(selecionada.getStatusCode()).isEqualTo(HttpStatus.OK);
        String tokenCompartilhado = token(selecionada);
        assertThat(selecionada.getBody().path("family").path("role").asText()).isEqualTo("member");
        assertThat(chamar(HttpMethod.POST, "/api/families/invitations", tokenCompartilhado,
                Map.of("email", "outro@lab.invalid")).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        String idMembro = membro.getBody().path("user").path("id").asText();
        assertThat(chamar(HttpMethod.DELETE, "/api/families/members/" + idMembro, token(dono), null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(chamar(HttpMethod.GET, "/api/accounts", tokenCompartilhado, null).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(chamar(HttpMethod.POST, "/api/families/select", tokenCompartilhado, Map.of("id", familiaOriginal)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void conviteExpiradoRevogadoOuDeOutroEmailNaoConcedeAcesso() {
        var dono = cadastrar("convite-dono");
        var alvo = cadastrar("convite-alvo");
        var outra = cadastrar("convite-outra");
        String email = alvo.getBody().path("user").path("email").asText();
        String convite = chamar(HttpMethod.POST, "/api/families/invitations", token(dono), Map.of("email", email))
                .getBody().path("token").asText();
        assertThat(chamar(HttpMethod.POST, "/api/families/invitations/accept", token(outra), Map.of("token", convite))
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        String id = jdbc.queryForObject("SELECT id FROM household_invitations WHERE token_hash = ?",
                String.class, TokensLocais.hash(convite));
        var lista = chamar(HttpMethod.GET, "/api/families/invitations", token(dono), null).getBody().path("invitations");
        assertThat(lista.get(0).has("token")).isFalse();
        assertThat(chamar(HttpMethod.DELETE, "/api/families/invitations/" + id, token(dono), null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(chamar(HttpMethod.POST, "/api/families/invitations/accept", token(alvo), Map.of("token", convite))
                .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        String expirado = chamar(HttpMethod.POST, "/api/families/invitations", token(dono), Map.of("email", email))
                .getBody().path("token").asText();
        jdbc.update("UPDATE household_invitations SET expires_at = ? WHERE token_hash = ?",
                Timestamp.from(clock.instant().minusSeconds(1)), TokensLocais.hash(expirado));
        assertThat(chamar(HttpMethod.POST, "/api/families/invitations/accept", token(alvo), Map.of("token", expirado))
                .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        String idDono = dono.getBody().path("user").path("id").asText();
        assertThat(chamar(HttpMethod.DELETE, "/api/families/members/" + idDono, token(dono), null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @ParameterizedTest
    @ValueSource(strings = {"login", "refresh"})
    void usuarioSemVinculosRecuperaSessaoComFamiliaVaziaSemReadotarDados(String fluxo) {
        var pessoa = cadastrar("sem-vinculos-" + fluxo);
        var outroOwner = cadastrar("owner-reserva-" + fluxo);
        String familiaAntiga = pessoa.getBody().path("family").path("id").asText();
        assertThat(chamar(HttpMethod.POST, "/api/accounts", token(pessoa),
                Map.of("name", "Conta histórica fictícia", "type", "bank")).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        String convite = chamar(HttpMethod.POST, "/api/families/invitations", token(pessoa), Map.of(
                "email", outroOwner.getBody().path("user").path("email").asText(), "role", "owner"))
                .getBody().path("token").asText();
        assertThat(chamar(HttpMethod.POST, "/api/families/invitations/accept", token(outroOwner),
                Map.of("token", convite)).getStatusCode()).isEqualTo(HttpStatus.OK);
        String pessoaId = pessoa.getBody().path("user").path("id").asText();
        assertThat(chamar(HttpMethod.DELETE, "/api/families/members/" + pessoaId, token(pessoa), null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM household_members WHERE user_id = ?", Integer.class, pessoaId))
                .isZero();

        ResponseEntity<JsonNode> recuperada;
        if ("login".equals(fluxo)) {
            recuperada = chamar(HttpMethod.POST, "/api/auth/login", null, Map.of(
                    "email", pessoa.getBody().path("user").path("email").asText(), "password", SENHA));
        } else {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Cookie", cookie(pessoa));
            headers.set("X-Requested-With", "FinanceiroLab");
            recuperada = http.exchange("/api/auth/refresh", HttpMethod.POST, new HttpEntity<>(null, headers), JsonNode.class);
        }
        assertThat(recuperada.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(recuperada.getBody().path("family").path("id").asText()).isNotEqualTo(familiaAntiga);
        assertThat(recuperada.getBody().path("family").path("role").asText()).isEqualTo("owner");
        assertThat(chamar(HttpMethod.GET, "/api/accounts", token(recuperada), null).getBody().path("accounts").size()).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM accounts WHERE household_id = ?", Integer.class, familiaAntiga))
                .isEqualTo(1);
        assertThat(chamar(HttpMethod.GET, "/api/accounts", token(pessoa), null).getStatusCode())
                .isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    private ResponseEntity<JsonNode> cadastrar(String nome) {
        var resposta = chamar(HttpMethod.POST, "/api/auth/register", null, Map.of("name", "Pessoa fictícia " + nome,
                "email", nome + "-" + UUID.randomUUID() + "@lab.invalid", "password", SENHA, "familyName", "Família fictícia " + nome));
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resposta;
    }

    private ResponseEntity<JsonNode> chamar(HttpMethod metodo, String caminho, String token, Object corpo) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Requested-With", "FinanceiroLab");
        if (token != null) headers.setBearerAuth(token);
        return http.exchange(caminho, metodo, new HttpEntity<>(corpo, headers), JsonNode.class);
    }

    private String token(ResponseEntity<JsonNode> resposta) {
        return resposta.getBody().path("accessToken").asText();
    }

    private String cookie(ResponseEntity<?> resposta) {
        return resposta.getHeaders().getFirst("Set-Cookie").split(";", 2)[0];
    }
}
