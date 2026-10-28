package com.financeiro.bootstrap;

import java.util.List;

import com.financeiro.categorias.CategoriaResposta;
import com.financeiro.configuracoes.ConfiguracaoResposta;
import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.regras.RegraResposta;
import com.financeiro.relatorios.RelatorioResposta.Indicadores;

public record BootstrapResposta(ConfiguracaoResposta settings, List<ContaResposta> accounts,
        List<CategoriaResposta> categories, List<RegraResposta> rules, List<LancamentoResposta> entries,
        Indicadores kpis, List<String> warnings) {
}
