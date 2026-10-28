package com.financeiro.regras;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.lancamentos.LancamentoService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class RegraServiceTest {
    private final RegraRepository repository = mock(RegraRepository.class);
    private final ContaService contas = mock(ContaService.class);
    private final CategoriaService categorias = mock(CategoriaService.class);
    private final LancamentoService lancamentos = mock(LancamentoService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2028-01-15T12:00:00Z"), ZoneOffset.UTC);
    private final RegraService service = new RegraService(repository, contas, categorias, lancamentos, clock, com.financeiro.seguranca.ContextoLocalTestConfig.local());

    @Test
    void criaRegraComIdentidadeLocalDataUtcEDefaults() {
        when(repository.save(any(Regra.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        RegraResposta resposta = service.criar(requisicao(null, null, null));

        assertThat(resposta.id()).matches("rule-[0-9a-f-]{36}");
        assertThat(resposta.householdId()).isEqualTo("local-demo");
        assertThat(resposta.title()).isEqualTo("Regra ficticia");
        assertThat(resposta.description()).isEmpty();
        assertThat(resposta.amount()).isEqualTo(new BigDecimal("0.30"));
        assertThat(resposta.startsAt()).isEqualTo(LocalDate.of(2028, 1, 15));
        assertThat(resposta.autoGenerate()).isTrue();
    }

    @Test
    void putPreservaInicioEAutoGenerateOmitidos() {
        Regra regra = regra();
        regra.gerarAutomaticamente = false;
        when(repository.buscarPorIdEFamilia(regra.id, "local-demo")).thenReturn(Optional.of(regra));
        when(repository.save(any(Regra.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        RegraResposta resposta = service.atualizar(regra.id, requisicao(null, null, null));

        assertThat(resposta.id()).isEqualTo(regra.id);
        assertThat(resposta.startsAt()).isEqualTo(LocalDate.of(2030, 1, 1));
        assertThat(resposta.autoGenerate()).isFalse();
    }

    @Test
    void referenciaAusenteRetorna400SemGravar() {
        when(contas.buscar("ausente")).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> service.criar(requisicao("ausente", null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any(Regra.class));
    }

    @Test
    void atualizacaoInexistenteNaoFazUpsert() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizar("ausente", requisicao(null, null, null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repository, never()).save(any(Regra.class));
    }

    @Test
    void geraMesesComClampBissextoEIgnoraInicioEFimComoLegado() {
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(regra()));
        when(lancamentos.listar()).thenReturn(List.of());

        assertThat(service.reconstruir(2)).isEqualTo(new ReconstrucaoResposta(2, 2, 0, 0, 0));

        ArgumentCaptor<LancamentoRequisicao> gerados = ArgumentCaptor.forClass(LancamentoRequisicao.class);
        verify(lancamentos, times(2)).criar(gerados.capture());
        assertThat(gerados.getAllValues()).extracting(LancamentoRequisicao::dueDate)
                .containsExactly(LocalDate.of(2028, 1, 31), LocalDate.of(2028, 2, 29));
        assertThat(gerados.getAllValues()).allSatisfy(gerado -> {
            assertThat(gerado.ruleId()).isEqualTo("rule-ficticia");
            assertThat(gerado.origin()).isEqualTo("auto");
            assertThat(gerado.competenceDate()).isEqualTo(gerado.dueDate());
            assertThat(gerado.metadata()).isEqualTo(Map.of("generatedFromRule", true));
            assertThat(gerado.installmentIndex()).isNull();
        });
    }

    @Test
    void ignoraRegraManualInativaESemDia() {
        Regra manual = regra();
        manual.id = "rule-manual";
        manual.frequencia = "manual";
        Regra inativa = regra();
        inativa.id = "rule-inativa";
        inativa.gerarAutomaticamente = false;
        Regra semDia = regra();
        semDia.id = "rule-sem-dia";
        semDia.diaVencimento = null;
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(manual, inativa, semDia));
        when(lancamentos.listar()).thenReturn(List.of());

        assertThat(service.reconstruir(2)).isEqualTo(new ReconstrucaoResposta(0, 0, 0, 0, 0));
        verify(lancamentos, never()).criar(any());
    }

    @Test
    void propagaSomenteProvenienciaTextualNosMetadadosGerados() {
        Regra regra = regra();
        regra.metadados = Map.of("source", "onboarding-workbook", "sourceRow", 2, "interno", Map.of("valor", true));
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(regra));
        when(lancamentos.listar()).thenReturn(List.of());

        service.reconstruir(1);

        ArgumentCaptor<LancamentoRequisicao> gerado = ArgumentCaptor.forClass(LancamentoRequisicao.class);
        verify(lancamentos).criar(gerado.capture());
        assertThat(gerado.getValue().metadata()).isEqualTo(Map.of(
                "generatedFromRule", true, "source", "onboarding-workbook"));
    }

    @Test
    void reconstrucaoIdenticaPreservaIdentidadeSemAtualizarTimestamp() {
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(regra()));
        when(lancamentos.listar()).thenReturn(List.of(
                lancamento("entry-janeiro", LocalDate.of(2028, 1, 31), "pending", "auto", "rule-ficticia", "0.30"),
                lancamento("entry-fevereiro", LocalDate.of(2028, 2, 29), "review", "auto", "rule-ficticia", "0.30")));

        assertThat(service.reconstruir(2)).isEqualTo(new ReconstrucaoResposta(2, 0, 0, 0, 2));
        verify(lancamentos, never()).criar(any());
        verify(lancamentos, never()).atualizar(any(), any());
        verify(lancamentos, never()).excluir(any());
    }

    @Test
    void atualizaValoresSemTrocarIdOuStatus() {
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(regra()));
        when(lancamentos.listar()).thenReturn(List.of(
                lancamento("entry-existente", LocalDate.of(2028, 1, 31), "review", "auto", "rule-ficticia", "99.99")));

        assertThat(service.reconstruir(1)).isEqualTo(new ReconstrucaoResposta(1, 0, 1, 0, 0));

        ArgumentCaptor<LancamentoRequisicao> atualizacao = ArgumentCaptor.forClass(LancamentoRequisicao.class);
        verify(lancamentos).atualizar(eq("entry-existente"), atualizacao.capture());
        assertThat(atualizacao.getValue().status()).isNull();
        assertThat(atualizacao.getValue().amount()).isEqualByComparingTo("0.30");
    }

    @Test
    void nuncaAlteraQuitadosMesmoComValorDiferente() {
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(regra()));
        when(lancamentos.listar()).thenReturn(List.of(
                lancamento("entry-pago", LocalDate.of(2028, 1, 31), "paid", "auto", "rule-ficticia", "99.99")));

        assertThat(service.reconstruir(1)).isEqualTo(new ReconstrucaoResposta(1, 0, 0, 0, 1));
        verify(lancamentos, never()).atualizar(any(), any());
        verify(lancamentos, never()).excluir(any());
    }

    @Test
    void removeSomenteAutoNaoPagoNoHorizonteDeRegraDesativada() {
        Regra regra = regra();
        regra.gerarAutomaticamente = false;
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(regra));
        when(lancamentos.listar()).thenReturn(List.of(
                lancamento("entry-antigo", LocalDate.of(2027, 12, 31), "pending", "auto", regra.id, "0.30"),
                lancamento("entry-futuro", LocalDate.of(2028, 1, 31), "review", "auto", regra.id, "0.30"),
                lancamento("entry-pago", LocalDate.of(2028, 1, 20), "paid", "auto", regra.id, "0.30"),
                lancamento("entry-fora", LocalDate.of(2028, 3, 31), "pending", "auto", regra.id, "0.30"),
                lancamento("entry-manual", LocalDate.of(2028, 1, 31), "pending", "manual", regra.id, "0.30"),
                lancamento("entry-sem-regra", LocalDate.of(2028, 1, 31), "pending", "auto", null, "0.30")));

        assertThat(service.reconstruir(1)).isEqualTo(new ReconstrucaoResposta(0, 0, 0, 1, 3));
        verify(lancamentos).excluir("entry-futuro");
        verify(lancamentos, times(1)).excluir(any());
    }

    @Test
    void exclusaoCancelaTodoFuturoNaoPagoSemLimiteDeHorizonte() {
        Regra regra = regra();
        when(repository.buscarPorIdEFamilia(regra.id, "local-demo")).thenReturn(Optional.of(regra));
        when(lancamentos.listar()).thenReturn(List.of(
                lancamento("entry-antigo", LocalDate.of(2027, 12, 31), "pending", "auto", regra.id, "0.30"),
                lancamento("entry-pago", LocalDate.of(2028, 1, 31), "paid", "auto", regra.id, "0.30"),
                lancamento("entry-distante", LocalDate.of(2035, 1, 31), "pending", "auto", regra.id, "0.30"),
                lancamento("entry-manual", LocalDate.of(2028, 1, 31), "pending", "manual", regra.id, "0.30")));

        service.excluir(regra.id);

        verify(lancamentos).excluir("entry-distante");
        verify(lancamentos, times(1)).excluir(any());
        verify(repository).delete(regra);
        verify(repository).listarComBloqueio("local-demo");
    }

    @Test
    void horizontePadraoGeraDezoitoMeses() {
        when(repository.listarComBloqueio("local-demo")).thenReturn(List.of(regra()));
        when(lancamentos.listar()).thenReturn(List.of());

        assertThat(service.reconstruir(null)).isEqualTo(new ReconstrucaoResposta(18, 18, 0, 0, 0));
        verify(lancamentos, times(18)).criar(any());
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 121})
    void horizonteInvalidoNaoConsultaNemAlteraPersistencia(int meses) {
        assertThatThrownBy(() -> service.reconstruir(meses))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).listarComBloqueio(any());
    }

    private Regra regra() {
        Regra regra = new Regra();
        regra.id = "rule-ficticia";
        regra.grupoFamiliarId = "local-demo";
        regra.titulo = "Regra ficticia";
        regra.descricao = "";
        regra.valor = new BigDecimal("0.30");
        regra.tipo = "expense";
        regra.diaVencimento = 31;
        regra.frequencia = "monthly";
        regra.inicio = LocalDate.of(2030, 1, 1);
        regra.fim = LocalDate.of(2020, 1, 1);
        return regra;
    }

    private RegraRequisicao requisicao(String contaId, String categoriaId, Boolean automatica) {
        return new RegraRequisicao(" Regra ficticia ", null, contaId, categoriaId, new BigDecimal("0.3"),
                "expense", 31, "monthly", null, null, automatica, null);
    }

    private LancamentoResposta lancamento(String id, LocalDate data, String estado, String origem, String regraId, String valor) {
        Instant instante = Instant.parse("2027-01-01T00:00:00Z");
        return new LancamentoResposta(id, "local-demo", regraId, null, null, "Regra ficticia", "",
                new BigDecimal(valor), "expense", data, data, null, null, estado, origem, false,
                Map.of("generatedFromRule", true), instante, instante);
    }
}
