package com.financeiro.configuracoes;

import com.financeiro.seguranca.ContextoFamilia;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.financeiro.configuracoes.ConfiguracaoRequisicao.Introducao;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.PreferenciasPainel;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Tema;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ConfiguracaoService {
    private final ContextoFamilia contexto;
    private final ConfiguracaoRepository repository;
    private final Clock clock;

    public ConfiguracaoService(ConfiguracaoRepository repository, Clock clock, ContextoFamilia contexto) {
        this.contexto = contexto;
        this.repository = repository;
        this.clock = clock;
    }

    public ConfiguracaoResposta buscar() {
        return ConfiguracaoResposta.de(exigirConfiguracao());
    }

    @Transactional
    public ConfiguracaoResposta atualizar(ConfiguracaoRequisicao requisicao) {
        Configuracao configuracao = exigirConfiguracao();
        configuracao.moeda = requisicao.currency();
        configuracao.fusoHorario = requisicao.timezone();
        configuracao.tema = requisicao.themeMode();
        configuracao.densidade = requisicao.densityMode();
        configuracao.criterioPeriodo = requisicao.periodMode();
        configuracao.horizonteMeses = requisicao.horizonMonths();
        configuracao.diasNotificacao = List.copyOf(requisicao.notificationDays());
        configuracao.horarioNotificacao = requisicao.notificationTime();
        configuracao.cores = requisicao.colorTokens();
        configuracao.painel = requisicao.dashboardConfig();
        configuracao.introducao = carimbar(requisicao.onboarding());
        return salvar(configuracao);
    }

    @Transactional
    public ConfiguracaoResposta salvarTema(Tema requisicao) {
        Configuracao configuracao = exigirConfiguracao();
        configuracao.tema = requisicao.themeMode();
        configuracao.densidade = requisicao.densityMode();
        configuracao.cores = requisicao.colorTokens();
        return salvar(configuracao);
    }

    @Transactional
    public ConfiguracaoResposta salvarPainel(PreferenciasPainel requisicao) {
        Configuracao configuracao = exigirConfiguracao();
        configuracao.criterioPeriodo = requisicao.periodMode();
        configuracao.painel = requisicao.dashboardConfig();
        if (requisicao.notificationTime() != null) configuracao.horarioNotificacao = requisicao.notificationTime();
        return salvar(configuracao);
    }

    @Transactional
    public ConfiguracaoResposta salvarIntroducao(Introducao requisicao) {
        Configuracao configuracao = exigirConfiguracao();
        configuracao.introducao = carimbar(requisicao);
        return salvar(configuracao);
    }

    private Configuracao exigirConfiguracao() {
        return repository.findById(contexto.familiaId()).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, "As configurações locais ainda não estão disponíveis."));
    }

    private Introducao carimbar(Introducao requisicao) {
        return new Introducao(requisicao.version(), requisicao.status(),
                List.copyOf(requisicao.completedSteps()), agora());
    }

    private ConfiguracaoResposta salvar(Configuracao configuracao) {
        configuracao.atualizadoEm = agora();
        return ConfiguracaoResposta.de(repository.save(configuracao));
    }

    private Instant agora() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
