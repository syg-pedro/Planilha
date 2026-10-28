package com.financeiro.configuracoes;

import java.time.Instant;
import java.util.List;

import com.financeiro.configuracoes.ConfiguracaoRequisicao.Cores;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Introducao;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Painel;

public record ConfiguracaoResposta(String id, String currency, String timezone, String themeMode,
        String densityMode, String periodMode, int horizonMonths, List<Integer> notificationDays,
        String notificationTime, Cores colorTokens, Painel dashboardConfig, Introducao onboarding,
        Instant updatedAt) {
    static ConfiguracaoResposta de(Configuracao configuracao) {
        return new ConfiguracaoResposta(configuracao.id, configuracao.moeda, configuracao.fusoHorario,
                configuracao.tema, configuracao.densidade, configuracao.criterioPeriodo, configuracao.horizonteMeses,
                configuracao.diasNotificacao, configuracao.horarioNotificacao, configuracao.cores,
                configuracao.painel, configuracao.introducao, configuracao.atualizadoEm);
    }
}
