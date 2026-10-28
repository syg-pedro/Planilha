package com.financeiro.configuracoes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import com.financeiro.configuracoes.ConfiguracaoRequisicao.Introducao;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Painel;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.PreferenciasPainel;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Tema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ConfiguracaoServiceTest {
    private static final Instant AGORA = Instant.parse("2026-10-28T12:00:00.123456789Z");
    private static final Instant AGORA_BANCO = Instant.parse("2026-10-28T12:00:00.123456Z");
    private final ConfiguracaoRepository repository = mock(ConfiguracaoRepository.class);
    private final ConfiguracaoService service = new ConfiguracaoService(repository, Clock.fixed(AGORA, ZoneOffset.UTC), com.financeiro.seguranca.ContextoLocalTestConfig.local());
    private Configuracao configuracao;

    @BeforeEach
    void preparar() {
        configuracao = new Configuracao();
        configuracao.id = "local-demo";
        configuracao.moeda = "BRL";
        configuracao.fusoHorario = "America/Sao_Paulo";
        configuracao.tema = "system";
        configuracao.densidade = "compact";
        configuracao.criterioPeriodo = "due_date";
        configuracao.horizonteMeses = 18;
        configuracao.diasNotificacao = List.of(3, 1);
        configuracao.horarioNotificacao = "09:00";
        configuracao.cores = ConfiguracaoRequisicaoTest.cores();
        configuracao.painel = new Painel(List.of("kpis"), "date_asc", "month", null);
        configuracao.introducao = new Introducao(1, "new", List.of(), Instant.EPOCH);
        configuracao.atualizadoEm = Instant.EPOCH;
        when(repository.findById("local-demo")).thenReturn(Optional.of(configuracao));
        when(repository.save(any(Configuracao.class))).thenAnswer(invocacao -> invocacao.getArgument(0));
    }

    @Test
    void leSomenteConfiguracaoLocalSemGravarNoGet() {
        assertThat(service.buscar().id()).isEqualTo("local-demo");
        verify(repository).findById("local-demo");
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.never()).save(any(Configuracao.class));
    }

    @Test
    void alteraTemaSemMudarPainelOuPreferenciasFinanceiras() {
        var painelAnterior = configuracao.painel;
        var resposta = service.salvarTema(new Tema("dark", "comfortable", ConfiguracaoRequisicaoTest.cores()));

        assertThat(resposta.themeMode()).isEqualTo("dark");
        assertThat(resposta.densityMode()).isEqualTo("comfortable");
        assertThat(resposta.dashboardConfig()).isEqualTo(painelAnterior);
        assertThat(resposta.horizonMonths()).isEqualTo(18);
        assertThat(resposta.periodMode()).isEqualTo("due_date");
        assertThat(resposta.updatedAt()).isEqualTo(AGORA_BANCO);
    }

    @Test
    void alteraPainelPreservandoHorarioOmitido() {
        var painel = new Painel(List.of("cashflow"), "amount_desc", "quarter", null);
        var resposta = service.salvarPainel(new PreferenciasPainel("competence", painel, null));
        assertThat(resposta.dashboardConfig()).isEqualTo(painel);
        assertThat(resposta.periodMode()).isEqualTo("competence");
        assertThat(resposta.notificationTime()).isEqualTo("09:00");
        assertThat(resposta.themeMode()).isEqualTo("system");
    }

    @Test
    void persistePreferenciasCompletasSemPermitirIdentidadeOuCarimboDoCliente() {
        var resposta = service.atualizar(ConfiguracaoRequisicaoTest.requisicao(24, "UTC"));
        assertThat(resposta.id()).isEqualTo("local-demo");
        assertThat(resposta.horizonMonths()).isEqualTo(24);
        assertThat(resposta.timezone()).isEqualTo("UTC");
        assertThat(resposta.updatedAt()).isEqualTo(AGORA_BANCO);
        assertThat(resposta.onboarding().updatedAt()).isEqualTo(AGORA_BANCO);
    }

    @Test
    void atualizaIntroducaoComHorarioDoServidor() {
        var resposta = service.salvarIntroducao(new Introducao(1, "completed", List.of("contas"), Instant.EPOCH));
        assertThat(resposta.onboarding().status()).isEqualTo("completed");
        assertThat(resposta.onboarding().completedSteps()).containsExactly("contas");
        assertThat(resposta.onboarding().updatedAt()).isEqualTo(AGORA_BANCO);
        assertThat(resposta.updatedAt()).isEqualTo(AGORA_BANCO);
    }

    @Test
    void ausenciaDeMigrationNaoCriaConfiguracaoDuranteConsulta() {
        when(repository.findById("local-demo")).thenReturn(Optional.empty());
        assertThatThrownBy(service::buscar).isInstanceOfSatisfying(ResponseStatusException.class,
                erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.never()).save(any(Configuracao.class));
    }
}
