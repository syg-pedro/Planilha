package com.financeiro.onboarding;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.financeiro.categorias.CategoriaRequisicao;
import com.financeiro.categorias.CategoriaResposta;
import com.financeiro.categorias.CategoriaService;
import com.financeiro.configuracoes.ConfiguracaoResposta;
import com.financeiro.configuracoes.ConfiguracaoService;
import com.financeiro.contas.ContaRequisicao;
import com.financeiro.contas.ContaResposta;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoService;
import com.financeiro.onboarding.OnboardingRequisicao.CategoriaImportada;
import com.financeiro.onboarding.OnboardingRequisicao.ContaImportada;
import com.financeiro.onboarding.OnboardingRequisicao.LancamentoImportado;
import com.financeiro.onboarding.OnboardingRequisicao.RegraImportada;
import com.financeiro.regras.RegraRequisicao;
import com.financeiro.regras.RegraService;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class OnboardingServiceTest {
    private static ValidatorFactory factory;
    private static Validator validador;
    private final ContaService contas = mock(ContaService.class);
    private final CategoriaService categorias = mock(CategoriaService.class);
    private final RegraService regras = mock(RegraService.class);
    private final LancamentoService lancamentos = mock(LancamentoService.class);
    private final ConfiguracaoService configuracoes = mock(ConfiguracaoService.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private OnboardingService service;

    @BeforeAll
    static void iniciarValidacao() {
        factory = Validation.buildDefaultValidatorFactory();
        validador = factory.getValidator();
    }

    @AfterAll
    static void encerrarValidacao() {
        factory.close();
    }

    @BeforeEach
    void preparar() {
        service = new OnboardingService(contas, categorias, regras, lancamentos, configuracoes, jdbc, validador, com.financeiro.seguranca.ContextoLocalTestConfig.local());
        ConfiguracaoResposta configuracao = mock(ConfiguracaoResposta.class);
        when(configuracao.horizonMonths()).thenReturn(3);
        when(configuracoes.buscar()).thenReturn(configuracao);
        when(jdbc.queryForObject("SELECT id FROM household_settings WHERE id = ? FOR UPDATE",
                String.class, "local-demo")).thenReturn("local-demo");
    }

    @Test
    void normalizaAcentosCaixaEEspacosComoOrigem() {
        assertThat(OnboardingService.normalizar("  CôNTA   Á  ")).isEqualTo("conta a");
        assertThat(OnboardingService.normalizar("CATEGORIA\u00a0FICTÍCIA")).isEqualTo("categoria ficticia");
    }

    @Test
    void previewContaGeradosComHorizonteConfiguradoSemEscrever() {
        OnboardingPrevia previa = service.prever(payload());

        assertThat(previa).isEqualTo(new OnboardingPrevia(1, 1, 1, 3, 1, List.of(), true));
        verify(contas, never()).criar(any());
        verify(categorias, never()).criar(any());
        verify(regras, never()).criar(any());
        verify(regras, never()).reconstruir(any());
        verify(lancamentos, never()).criar(any());
        verifyNoInteractions(jdbc);
    }

    @Test
    void dadosExistentesBloqueiamPreviewEImportAntesDeCriar() {
        when(contas.listar()).thenReturn(List.of(new ContaResposta("account-existente", "local-demo",
                "Conta ficticia", "", "bank", null, null, null, true)));

        OnboardingPrevia previa = service.prever(payload());

        assertThat(previa.canImport()).isFalse();
        assertThat(previa.warnings()).hasSize(1);
        assertThatThrownBy(() -> service.importar(payload()))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(contas, never()).criar(any());
        verify(regras, never()).reconstruir(any());
    }

    @Test
    void duplicataNormalizadaRecusaAntesDeAcessarPersistencia() {
        var duplicadas = new OnboardingRequisicao(1,
                List.of(conta(), new ContaImportada(3, "CONTA A", "bank", "", null, null, null)),
                List.of(), List.of(), List.of());

        assertThatThrownBy(() -> service.importar(duplicadas))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(jdbc);
        verify(contas, never()).criar(any());
    }

    @Test
    void referenciaAusenteRecusaAntesDaPrimeiraEscrita() {
        var semConta = new OnboardingRequisicao(1, List.of(), List.of(categoria()),
                List.of(regra()), List.of());

        assertThatThrownBy(() -> service.importar(semConta))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(jdbc);
        verify(categorias, never()).criar(any());
    }

    @Test
    void payloadVazioNaoImporta() {
        assertThatThrownBy(() -> service.prever(new OnboardingRequisicao(1, List.of(), List.of(), List.of(), List.of())))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(jdbc);
    }

    @Test
    void importResolveNomesParaIdsEGeraUmaVezAntesDosLancamentos() {
        when(contas.criar(any())).thenReturn(new ContaResposta("account-servidor", "local-demo",
                "Cônta Á", "Família", "bank", null, null, null, true));
        when(categorias.criar(any())).thenReturn(new CategoriaResposta("category-servidor", "local-demo",
                "Categoria ficticia", "expense", "#123456"));

        assertThat(service.importar(payload())).isEqualTo(new OnboardingResumo(1, 1, 1, 3, 1));

        var ordem = inOrder(jdbc, contas, categorias, regras, lancamentos, configuracoes);
        ordem.verify(jdbc).queryForObject("SELECT id FROM household_settings WHERE id = ? FOR UPDATE",
                String.class, "local-demo");
        ordem.verify(contas).listar();
        ordem.verify(categorias).listar();
        ordem.verify(regras).listar();
        ordem.verify(lancamentos).listar();
        ordem.verify(configuracoes).buscar();
        ordem.verify(contas).criar(any());
        ordem.verify(categorias).criar(any());
        ordem.verify(regras).criar(any());
        ordem.verify(regras).reconstruir(3);
        ordem.verify(lancamentos).criar(any());
        ordem.verify(configuracoes).salvarIntroducao(any());

        ArgumentCaptor<ContaRequisicao> conta = ArgumentCaptor.forClass(ContaRequisicao.class);
        verify(contas).criar(conta.capture());
        assertThat(conta.getValue().owner()).isEqualTo("Família");
        ArgumentCaptor<RegraRequisicao> regra = ArgumentCaptor.forClass(RegraRequisicao.class);
        verify(regras).criar(regra.capture());
        assertThat(regra.getValue().accountId()).isEqualTo("account-servidor");
        assertThat(regra.getValue().categoryId()).isEqualTo("category-servidor");
        assertThat(regra.getValue().metadata()).containsEntry("source", "onboarding-workbook");
        ArgumentCaptor<LancamentoRequisicao> entrada = ArgumentCaptor.forClass(LancamentoRequisicao.class);
        verify(lancamentos).criar(entrada.capture());
        assertThat(entrada.getValue().accountId()).isEqualTo("account-servidor");
        assertThat(entrada.getValue().categoryId()).isEqualTo("category-servidor");
        assertThat(entrada.getValue().origin()).isEqualTo("imported");
        assertThat(entrada.getValue().competenceDate()).isEqualTo(entrada.getValue().dueDate());
    }

    @Test
    void falhaIntermediariaNaoMarcaOnboardingConcluido() {
        when(contas.criar(any())).thenReturn(new ContaResposta("account-servidor", "local-demo",
                "Cônta Á", "Família", "bank", null, null, null, true));
        when(categorias.criar(any())).thenThrow(new IllegalStateException("falha ficticia"));

        assertThatThrownBy(() -> service.importar(payload())).isInstanceOf(IllegalStateException.class);
        verify(regras, never()).criar(any());
        verify(regras, never()).reconstruir(any());
        verify(configuracoes, never()).salvarIntroducao(any());
    }

    private ContaImportada conta() {
        return new ContaImportada(2, " Cônta Á ", "bank", "", null, null, null);
    }

    private CategoriaImportada categoria() {
        return new CategoriaImportada(2, "Categoria ficticia", "expense", "#123456");
    }

    private RegraImportada regra() {
        return new RegraImportada(2, "Regra ficticia", "expense", new BigDecimal("10.10"), 31,
                "CONTA A", "categoria FICTÍCIA");
    }

    private OnboardingRequisicao payload() {
        return new OnboardingRequisicao(1, List.of(conta()), List.of(categoria()), List.of(regra()),
                List.of(new LancamentoImportado(2, "Despesa ficticia", "expense", new BigDecimal("12.34"),
                        LocalDate.of(2028, 2, 29), "conta a", "CATEGORIA ficticia", "pending", 1, 2)));
    }
}
