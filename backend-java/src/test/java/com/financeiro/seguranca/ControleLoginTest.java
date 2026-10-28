package com.financeiro.seguranca;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ControleLoginTest {
    @Test
    void bloqueiaDezFalhasEReliberaDepoisDaJanela() {
        Clock clock = mock(Clock.class);
        Instant inicio = Instant.parse("2028-01-15T12:00:00Z");
        when(clock.instant()).thenReturn(inicio);
        ControleLogin controle = new ControleLogin(clock);
        for (int indice = 0; indice < 10; indice++) controle.registrar("pessoa@lab.invalid");

        assertThatThrownBy(() -> controle.registrar("pessoa@lab.invalid"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> org.assertj.core.api.Assertions.assertThat(erro.getStatusCode())
                                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        when(clock.instant()).thenReturn(inicio.plusSeconds(901));
        assertThatCode(() -> controle.registrar("pessoa@lab.invalid")).doesNotThrowAnyException();
    }

    @Test
    void sucessoLimpaAsTentativasAnteriores() {
        ControleLogin controle = new ControleLogin(Clock.systemUTC());
        for (int indice = 0; indice < 10; indice++) controle.registrar("pessoa@lab.invalid");
        controle.sucesso("pessoa@lab.invalid");

        assertThatCode(() -> controle.registrar("pessoa@lab.invalid")).doesNotThrowAnyException();
    }

    @Test
    void tokensTemAltaEntropiaEHashSemTextoOriginal() {
        String primeiro = TokensLocais.gerar();
        String segundo = TokensLocais.gerar();

        org.assertj.core.api.Assertions.assertThat(primeiro).hasSize(43).isNotEqualTo(segundo);
        org.assertj.core.api.Assertions.assertThat(TokensLocais.hash(primeiro)).hasSize(64).doesNotContain(primeiro);
        org.assertj.core.api.Assertions.assertThat(TokensLocais.hash("abc"))
                .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }
}
