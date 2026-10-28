package com.financeiro.desejos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class DesejoServiceTest {
    private static final Instant AGORA = Instant.parse("2026-10-28T12:00:00.123456789Z");
    private static final Instant AGORA_BANCO = Instant.parse("2026-10-28T12:00:00.123456Z");
    private final DesejoRepository repository = mock(DesejoRepository.class);
    private final DesejoService service = new DesejoService(repository, Clock.fixed(AGORA, ZoneOffset.UTC), com.financeiro.seguranca.ContextoLocalTestConfig.local());

    @Test
    void criaIdentidadeLocalDefaultsECarimbosDoServidor() {
        when(repository.save(any(Desejo.class))).thenAnswer(invocacao -> invocacao.getArgument(0));
        var resposta = service.criar(new DesejoRequisicao("  Desejo fictício ", new BigDecimal("0.10"),
                " https://example.test/item ", null, null, null, null, null));

        assertThat(resposta.id()).matches("wish-[0-9a-f-]{36}");
        assertThat(resposta.householdId()).isEqualTo("local-demo");
        assertThat(resposta.name()).isEqualTo("Desejo fictício");
        assertThat(resposta.price()).isEqualTo(new BigDecimal("0.10"));
        assertThat(resposta.url()).isEqualTo("https://example.test/item");
        assertThat(resposta.priority()).isEqualTo("medium");
        assertThat(resposta.status()).isEqualTo("want");
        assertThat(resposta.createdAt()).isEqualTo(AGORA_BANCO);
        assertThat(resposta.updatedAt()).isEqualTo(AGORA_BANCO);
    }

    @Test
    void atualizaSemAlterarIdentidadeCriacaoOuEstadoOmitido() {
        Desejo desejo = existente();
        when(repository.buscarPorIdEFamilia("wish-ficticio", "local-demo")).thenReturn(Optional.of(desejo));
        when(repository.save(any(Desejo.class))).thenAnswer(invocacao -> invocacao.getArgument(0));
        var resposta = service.atualizar("wish-ficticio", new DesejoRequisicao(
                "Nome novo", null, null, null, "Observação", null, null, "Casa"));

        assertThat(resposta.id()).isEqualTo("wish-ficticio");
        assertThat(resposta.householdId()).isEqualTo("local-demo");
        assertThat(resposta.createdAt()).isEqualTo(Instant.EPOCH);
        assertThat(resposta.updatedAt()).isEqualTo(AGORA_BANCO);
        assertThat(resposta.price()).isNull();
        assertThat(resposta.priority()).isEqualTo("high");
        assertThat(resposta.status()).isEqualTo("bought");
    }

    @Test
    void listaBuscaEExcluiSomenteNoContextoLocal() {
        Desejo desejo = existente();
        when(repository.listarPorFamilia("local-demo")).thenReturn(List.of(desejo));
        when(repository.buscarPorIdEFamilia("wish-ficticio", "local-demo")).thenReturn(Optional.of(desejo));

        assertThat(service.listar()).containsExactly(DesejoResposta.de(desejo));
        assertThat(service.buscar("wish-ficticio")).isEqualTo(DesejoResposta.de(desejo));
        service.excluir("wish-ficticio");
        verify(repository).delete(desejo);
    }

    @Test
    void devolve404SemUpsertOuExclusaoAoNaoEncontrarRegistro() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.buscar("ausente"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        assertThatThrownBy(() -> service.atualizar("ausente", new DesejoRequisicao(
                "Item", null, null, null, null, null, null, null))).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.excluir("ausente")).isInstanceOf(ResponseStatusException.class);
        verify(repository, never()).save(any(Desejo.class));
        verify(repository, never()).delete(any(Desejo.class));
    }

    private Desejo existente() {
        Desejo desejo = new Desejo();
        desejo.id = "wish-ficticio";
        desejo.grupoFamiliarId = "local-demo";
        desejo.nome = "Desejo fictício";
        desejo.prioridade = "high";
        desejo.estado = "bought";
        desejo.criadoEm = Instant.EPOCH;
        desejo.atualizadoEm = Instant.EPOCH;
        return desejo;
    }
}
