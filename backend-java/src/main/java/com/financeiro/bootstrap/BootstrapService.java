package com.financeiro.bootstrap;

import java.time.Clock;
import java.time.ZoneId;
import java.util.List;

import com.financeiro.categorias.CategoriaService;
import com.financeiro.configuracoes.ConfiguracaoService;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoService;
import com.financeiro.regras.RegraService;
import com.financeiro.relatorios.CalculosRelatorios;
import com.financeiro.relatorios.ConsultaRelatorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BootstrapService {
    private final ConfiguracaoService configuracoes;
    private final ContaService contas;
    private final CategoriaService categorias;
    private final RegraService regras;
    private final LancamentoService lancamentos;
    private final Clock relogio;

    public BootstrapService(ConfiguracaoService configuracoes, ContaService contas,
            CategoriaService categorias, RegraService regras, LancamentoService lancamentos, Clock relogio) {
        this.configuracoes = configuracoes;
        this.contas = contas;
        this.categorias = categorias;
        this.regras = regras;
        this.lancamentos = lancamentos;
        this.relogio = relogio;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public BootstrapResposta carregar() {
        var preferencias = configuracoes.buscar();
        var listaContas = contas.listar();
        var listaLancamentos = lancamentos.listar();
        var relatorio = CalculosRelatorios.calcular(listaLancamentos, listaContas,
                new ConsultaRelatorio(null, null, null, null, null, null, null, null), relogio.instant(),
                ZoneId.of(preferencias.timezone()));
        return new BootstrapResposta(preferencias, listaContas, categorias.listar(),
                regras.listar(), listaLancamentos, relatorio.kpis(), List.of());
    }
}
