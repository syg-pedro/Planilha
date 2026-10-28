package com.financeiro.relatorios;

import java.time.Clock;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.financeiro.configuracoes.ConfiguracaoService;
import com.financeiro.contas.ContaResposta;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MatrizService {
    private final ContaService contas;
    private final LancamentoService lancamentos;
    private final ConfiguracaoService configuracoes;
    private final Clock clock;

    public MatrizService(ContaService contas, LancamentoService lancamentos, ConfiguracaoService configuracoes, Clock clock) {
        this.contas = contas;
        this.lancamentos = lancamentos;
        this.configuracoes = configuracoes;
        this.clock = clock;
    }

    public MatrizResposta consultar(ConsultaMatriz consulta) {
        var configuracao = configuracoes.buscar();
        YearMonth inicio = consulta.startMonth() == null
                ? YearMonth.now(clock.withZone(ZoneId.of(configuracao.timezone()))) : YearMonth.parse(consulta.startMonth());
        String criterio = consulta.periodMode() == null ? configuracao.periodMode() : consulta.periodMode();
        List<String> meses = IntStream.range(0, consulta.count()).mapToObj(indice -> inicio.plusMonths(indice).toString()).toList();
        var todasContas = contas.listar();
        var todosLancamentos = lancamentos.listar();
        Map<String, ContaResposta> contasPorId = todasContas.stream().collect(Collectors.toMap(ContaResposta::id, conta -> conta));
        var filtro = new ConsultaRelatorio(inicio.atDay(1), inicio.plusMonths(consulta.count()).atDay(1).minusDays(1),
                criterio, consulta.accountId(), null, consulta.kind(), consulta.status(), consulta.search());
        var filtrados = todosLancamentos.stream().filter(entrada -> CalculosRelatorios.corresponde(entrada, contasPorId, filtro)).toList();
        var resposta = CalculosMatriz.calcular(filtrados, todasContas, meses, criterio, todosLancamentos);
        if (!consulta.filtrada()) return resposta;
        return new MatrizResposta(resposta.months(), resposta.rows().stream().filter(linha -> !linha.entries().isEmpty()).toList(),
                resposta.summaries(), resposta.totals(), resposta.cardCommitments());
    }
}
