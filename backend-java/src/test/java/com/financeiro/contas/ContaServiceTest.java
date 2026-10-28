package com.financeiro.contas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ContaServiceTest {
    private final ContaRepository repository = mock(ContaRepository.class);
    private final ContaService service = new ContaService(repository, com.financeiro.seguranca.ContextoLocalTestConfig.local());

    @Test
    void criaIdentidadeLocalEUsaAtivaPorPadrao() {
        when(repository.save(any(Conta.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ContaResposta conta = service.criar(new ContaRequisicao(
                "  Conta ficticia  ", null, "bank", null, null, null, null));

        assertThat(conta.id()).matches("account-[0-9a-f-]{36}");
        assertThat(conta.householdId()).isEqualTo("local-demo");
        assertThat(conta.name()).isEqualTo("Conta ficticia");
        assertThat(conta.owner()).isEmpty();
        assertThat(conta.active()).isTrue();
    }

    @Test
    void preservaPrecisaoDoCartaoESemExigirFechamentoAntesDoVencimento() {
        when(repository.save(any(Conta.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ContaResposta conta = service.criar(new ContaRequisicao(
                "Cartao ficticio", "  Pessoa ficticia  ", "credit_card",
                new BigDecimal("1234.56"), 28, 5, false));

        assertThat(conta.owner()).isEqualTo("Pessoa ficticia");
        assertThat(conta.limitTotal()).isEqualByComparingTo("1234.56");
        assertThat(conta.closingDay()).isEqualTo(28);
        assertThat(conta.dueDay()).isEqualTo(5);
        assertThat(conta.active()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"bank", "benefit", "external"})
    void limpaCamposDeCartaoEPreservaInativaAoAtualizar(String tipo) {
        Conta existente = contaExistente();
        existente.tipo = "credit_card";
        existente.limiteTotal = new BigDecimal("100.20");
        existente.diaFechamento = 10;
        existente.diaVencimento = 15;
        existente.ativa = false;
        when(repository.buscarPorIdEFamilia("account-existente", "local-demo")).thenReturn(Optional.of(existente));
        when(repository.save(any(Conta.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContaResposta atualizada = service.atualizar("account-existente", new ContaRequisicao(
                "Conta ficticia", "", tipo, new BigDecimal("200.10"), 28, 5, null));

        assertThat(atualizada.id()).isEqualTo("account-existente");
        assertThat(atualizada.householdId()).isEqualTo("local-demo");
        assertThat(atualizada.type()).isEqualTo(tipo);
        assertThat(atualizada.limitTotal()).isNull();
        assertThat(atualizada.closingDay()).isNull();
        assertThat(atualizada.dueDay()).isNull();
        assertThat(atualizada.active()).isFalse();
    }

    @Test
    void alteraEstadoAtivoQuandoInformado() {
        Conta existente = contaExistente();
        existente.ativa = false;
        when(repository.buscarPorIdEFamilia("account-existente", "local-demo")).thenReturn(Optional.of(existente));
        when(repository.save(any(Conta.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.atualizar("account-existente", new ContaRequisicao(
                "Conta ficticia", "", "bank", null, null, null, true)).active()).isTrue();
    }

    @Test
    void listaSomenteFamiliaLocalSemReordenarResultadoDoRepository() {
        Conta existente = contaExistente();
        when(repository.listarPorFamilia("local-demo")).thenReturn(List.of(existente));

        assertThat(service.listar()).containsExactly(ContaResposta.de(existente));
        verify(repository).listarPorFamilia("local-demo");
    }

    @Test
    void buscaSomentePorIdentidadeEFamiliaLocal() {
        Conta existente = contaExistente();
        when(repository.buscarPorIdEFamilia("account-existente", "local-demo")).thenReturn(Optional.of(existente));

        assertThat(service.buscar("account-existente")).isEqualTo(ContaResposta.de(existente));
        verify(repository).buscarPorIdEFamilia("account-existente", "local-demo");
    }

    @Test
    void naoFazUpsertAoAtualizarContaInexistente() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizar("ausente", new ContaRequisicao(
                "Conta ficticia", "", "bank", null, null, null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repository, never()).save(any(Conta.class));
    }

    @Test
    void excluiSomenteContaLocalExistente() {
        Conta existente = contaExistente();
        when(repository.buscarPorIdEFamilia("account-existente", "local-demo")).thenReturn(Optional.of(existente));

        service.excluir("account-existente");

        verify(repository).delete(existente);
    }

    @Test
    void rejeitaExclusaoInexistenteSemEscrita() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.excluir("ausente"))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repository, never()).delete(any(Conta.class));
    }

    private Conta contaExistente() {
        Conta conta = new Conta();
        conta.id = "account-existente";
        conta.grupoFamiliarId = "local-demo";
        conta.nome = "Conta ficticia";
        conta.responsavel = "";
        conta.tipo = "bank";
        return conta;
    }
}
