package com.financeiro.lancamentos;

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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.financeiro.categorias.CategoriaService;
import com.financeiro.contas.ContaService;
import com.financeiro.regras.RegraRepository;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class LancamentoServiceTest {
    private static final Instant AGORA = Instant.parse("2026-10-28T12:00:00.123456789Z");
    private static final Instant AGORA_BANCO = Instant.parse("2026-10-28T12:00:00.123456Z");
    private static final LocalDate VENCIMENTO = LocalDate.of(2026, 10, 28);
    private final LancamentoRepository repository = mock(LancamentoRepository.class);
    private final ContaService contas = mock(ContaService.class);
    private final CategoriaService categorias = mock(CategoriaService.class);
    private final RegraRepository regras = mock(RegraRepository.class);
    private final LancamentoService service = new LancamentoService(
            repository, contas, categorias, regras, Clock.fixed(AGORA, ZoneOffset.UTC), com.financeiro.seguranca.ContextoLocalTestConfig.local());

    @Test
    void criaLancamentoFicticioComIdentidadeDatasEDefaultsDoServidor() {
        when(repository.save(any(Lancamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        LancamentoResposta resposta = service.criar(requisicao(null, null, null, null, null));

        assertThat(resposta.id()).matches("entry-[0-9a-f-]{36}");
        assertThat(resposta.householdId()).isEqualTo("local-demo");
        assertThat(resposta.ruleId()).isNull();
        assertThat(resposta.title()).isEqualTo("Despesa ficticia");
        assertThat(resposta.description()).isEmpty();
        assertThat(resposta.amount()).isEqualTo(new BigDecimal("0.10"));
        assertThat(resposta.dueDate()).isEqualTo(VENCIMENTO);
        assertThat(resposta.competenceDate()).isEqualTo(VENCIMENTO);
        assertThat(resposta.status()).isEqualTo("pending");
        assertThat(resposta.origin()).isEqualTo("manual");
        assertThat(resposta.excludeFromCalc()).isFalse();
        assertThat(resposta.createdAt()).isEqualTo(AGORA_BANCO);
        assertThat(resposta.updatedAt()).isEqualTo(AGORA_BANCO);
    }

    @Test
    void validaReferenciasLocaisSemAlterarMetadata() {
        when(repository.save(any(Lancamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));
        Map<String, Object> metadados = Map.of("source", "unit-demo", "detalhes", Map.of("ok", true));
        LancamentoRequisicao requisicao = new LancamentoRequisicao(
                null, " account-ficticia ", " category-ficticia ", "Despesa ficticia", " Observacoes ",
                new BigDecimal("1234.56"), "expense", VENCIMENTO, VENCIMENTO.minusDays(2),
                1, 3, "paid", "imported", true, metadados);

        LancamentoResposta resposta = service.criar(requisicao);

        verify(contas).buscar("account-ficticia");
        verify(categorias).buscar("category-ficticia");
        assertThat(resposta.accountId()).isEqualTo("account-ficticia");
        assertThat(resposta.categoryId()).isEqualTo("category-ficticia");
        assertThat(resposta.description()).isEqualTo(" Observacoes ");
        assertThat(resposta.metadata()).isEqualTo(metadados);
        assertThat(resposta.installmentIndex()).isEqualTo(1);
        assertThat(resposta.installmentTotal()).isEqualTo(3);
        assertThat(resposta.competenceDate()).isEqualTo(VENCIMENTO.minusDays(2));
        assertThat(resposta.status()).isEqualTo("paid");
        assertThat(resposta.origin()).isEqualTo("imported");
        assertThat(resposta.excludeFromCalc()).isTrue();
    }

    @Test
    void preservaCriacaoStatusOrigemEExclusaoOmitidosNoPut() {
        Lancamento existente = lancamentoExistente();
        existente.estado = "paid";
        existente.origem = "imported";
        existente.excluirDosTotais = true;
        when(repository.buscarPorIdEFamilia("entry-ficticio", "local-demo")).thenReturn(Optional.of(existente));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        LancamentoResposta resposta = service.atualizar("entry-ficticio", requisicao(null, null, null, null, null));

        assertThat(resposta.id()).isEqualTo("entry-ficticio");
        assertThat(resposta.createdAt()).isEqualTo(Instant.parse("2026-01-01T00:00:00Z"));
        assertThat(resposta.updatedAt()).isEqualTo(AGORA_BANCO);
        assertThat(resposta.status()).isEqualTo("paid");
        assertThat(resposta.origin()).isEqualTo("imported");
        assertThat(resposta.excludeFromCalc()).isTrue();
    }

    @Test
    void putPermiteAlterarStatusOrigemEExclusaoExplicitamente() {
        Lancamento existente = lancamentoExistente();
        existente.estado = "paid";
        existente.excluirDosTotais = true;
        when(repository.buscarPorIdEFamilia("entry-ficticio", "local-demo")).thenReturn(Optional.of(existente));
        when(repository.save(any(Lancamento.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        LancamentoResposta resposta = service.atualizar("entry-ficticio",
                requisicao(null, null, "review", "auto", false));

        assertThat(resposta.status()).isEqualTo("review");
        assertThat(resposta.origin()).isEqualTo("auto");
        assertThat(resposta.excludeFromCalc()).isFalse();
    }

    @Test
    void referenciaDeContaAusenteRetorna400SemSalvar() {
        when(contas.buscar("ausente")).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> service.criar(requisicao("ausente", null, null, null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any(Lancamento.class));
    }

    @Test
    void referenciaDeCategoriaAusenteRetorna400SemSalvar() {
        when(categorias.buscar("ausente")).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> service.criar(requisicao(null, "ausente", null, null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any(Lancamento.class));
    }

    @Test
    void referenciaDeRegraAusenteRetorna400SemSalvar() {
        when(regras.buscarPorIdEFamilia("rule-ausente", "local-demo")).thenReturn(Optional.empty());
        LancamentoRequisicao requisicao = new LancamentoRequisicao("rule-ausente", null, null,
                "Despesa ficticia", "", BigDecimal.ONE, "expense", VENCIMENTO, null,
                null, null, null, null, null, null);

        assertThatThrownBy(() -> service.criar(requisicao))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any(Lancamento.class));
        verify(regras).buscarPorIdEFamilia("rule-ausente", "local-demo");
    }

    @Test
    void referenciaVaziaContinuaInvalidaEmVezDeRemoverVinculo() {
        when(contas.buscar("")).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> service.criar(requisicao("   ", null, null, null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any(Lancamento.class));
    }

    @Test
    void falhaDeServicoReferenciadoNaoViraErroDeEntrada() {
        when(contas.buscar("account-ficticia")).thenThrow(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE));

        assertThatThrownBy(() -> service.criar(requisicao("account-ficticia", null, null, null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    void atualizacaoInexistenteNaoFazUpsert() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizar("ausente", requisicao(null, null, null, null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repository, never()).save(any(Lancamento.class));
    }

    @Test
    void leituraUsaSempreIdEContextoLocal() {
        Lancamento existente = lancamentoExistente();
        when(repository.buscarPorIdEFamilia("entry-ficticio", "local-demo")).thenReturn(Optional.of(existente));
        when(repository.listarPorFamilia("local-demo")).thenReturn(List.of(existente));

        assertThat(service.buscar("entry-ficticio")).isEqualTo(LancamentoResposta.de(existente));
        assertThat(service.listar()).containsExactly(LancamentoResposta.de(existente));
        verify(repository).buscarPorIdEFamilia("entry-ficticio", "local-demo");
        verify(repository).listarPorFamilia("local-demo");
    }

    @Test
    void excluiSomenteLancamentoExistenteNoContexto() {
        Lancamento existente = lancamentoExistente();
        when(repository.buscarPorIdEFamilia("entry-ficticio", "local-demo")).thenReturn(Optional.of(existente));

        service.excluir("entry-ficticio");

        verify(repository).delete(existente);
    }

    @Test
    void exclusaoAusenteRetorna404SemAlterarDados() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.excluir("ausente"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repository, never()).delete(any(Lancamento.class));
    }

    private LancamentoRequisicao requisicao(String contaId, String categoriaId, String estado, String origem, Boolean excluir) {
        return new LancamentoRequisicao(null, contaId, categoriaId, " Despesa ficticia ", null,
                new BigDecimal("0.1"), "expense", VENCIMENTO, null, null, null, estado, origem, excluir, null);
    }

    private Lancamento lancamentoExistente() {
        Lancamento lancamento = new Lancamento();
        lancamento.id = "entry-ficticio";
        lancamento.grupoFamiliarId = "local-demo";
        lancamento.titulo = "Despesa ficticia";
        lancamento.descricao = "";
        lancamento.valor = new BigDecimal("0.10");
        lancamento.tipo = "expense";
        lancamento.vencimento = VENCIMENTO;
        lancamento.competencia = VENCIMENTO;
        lancamento.criadoEm = Instant.parse("2026-01-01T00:00:00Z");
        lancamento.atualizadoEm = lancamento.criadoEm;
        return lancamento;
    }
}
