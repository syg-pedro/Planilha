package com.financeiro.seguranca;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import com.financeiro.familias.FamiliaRepository;
import com.financeiro.familias.FamiliaResposta;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

class ContextoFamiliaAutenticadoTest {
    private static final Instant AGORA = Instant.parse("2028-01-15T12:00:00Z");
    private final SegurancaRepository seguranca = mock(SegurancaRepository.class);
    private final FamiliaRepository familias = mock(FamiliaRepository.class);
    private final ContextoFamiliaAutenticado contexto = new ContextoFamiliaAutenticado(
            seguranca, familias, Clock.fixed(AGORA, ZoneOffset.UTC));

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void exigeJwtAutenticadoSemFallbackLocal() {
        assertThatThrownBy(contexto::familiaId)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void consultaVinculoAtualNoBancoEReutilizaNoMesmoRequest() {
        preparar(true, null, "hh-um");
        when(familias.buscarVinculo("user-um", "hh-um"))
                .thenReturn(Optional.of(new FamiliaResposta("hh-um", "Família fictícia", "member")));

        assertThat(contexto.familiaId()).isEqualTo("hh-um");
        assertThat(contexto.usuarioId()).isEqualTo("user-um");
        assertThat(contexto.proprietario()).isFalse();
        assertThat(contexto.familiaId()).isEqualTo("hh-um");
        verify(familias, times(1)).buscarVinculo("user-um", "hh-um");
        verify(seguranca, times(1)).buscarSessao("session-um");
    }

    @Test
    void claimDeFamiliaNaoSubstituiVinculoNoBanco() {
        preparar(true, null, "hh-um");
        when(familias.buscarVinculo("user-um", "hh-um")).thenReturn(Optional.empty());

        assertThatThrownBy(contexto::familiaId)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void rejeitaUsuarioDesativado() {
        preparar(false, null, "hh-um");

        assertThatThrownBy(contexto::usuarioId)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
        assertThatThrownBy(contexto::usuarioId).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void rejeitaSessaoRevogada() {
        preparar(true, AGORA.minusSeconds(1), "hh-um");

        assertThatThrownBy(contexto::usuarioId)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void rejeitaFamiliaAntigaAposSelecaoDaSessao() {
        preparar(true, null, "hh-outra");

        assertThatThrownBy(contexto::familiaId)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    private void preparar(boolean ativo, Instant revogada, String familiaDaSessao) {
        Jwt jwt = Jwt.withTokenValue("jwt-de-teste").header("alg", "RS256")
                .subject("user-um").claim("sid", "session-um").claim("hid", "hh-um")
                .issuedAt(AGORA).expiresAt(AGORA.plusSeconds(900)).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt, List.of()));
        when(seguranca.buscarUsuario("user-um")).thenReturn(Optional.of(
                new SegurancaRepository.Usuario("user-um", "Pessoa fictícia", "pessoa@lab.invalid", "hash-ficticio", ativo)));
        when(seguranca.buscarSessao("session-um")).thenReturn(Optional.of(new SegurancaRepository.Sessao(
                "session-um", "user-um", familiaDaSessao, "hash-ficticio", AGORA.plusSeconds(3600), revogada)));
    }
}
