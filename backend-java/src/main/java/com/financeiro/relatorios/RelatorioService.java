package com.financeiro.relatorios;

import java.time.Clock;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;

import com.financeiro.categorias.CategoriaService;
import com.financeiro.configuracoes.ConfiguracaoService;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class RelatorioService {
    private final LancamentoService lancamentos;
    private final ContaService contas;
    private final Clock relogio;
    private final CategoriaService categorias;
    private final ConfiguracaoService configuracoes;

    public RelatorioService(LancamentoService lancamentos, ContaService contas, Clock relogio,
            CategoriaService categorias, ConfiguracaoService configuracoes) {
        this.lancamentos = lancamentos;
        this.contas = contas;
        this.relogio = relogio;
        this.categorias = categorias;
        this.configuracoes = configuracoes;
    }

    public RelatorioResposta resumir(ConsultaRelatorio consulta) {
        return resumir(consulta, null);
    }

    public RelatorioResposta resumir(ConsultaRelatorio consulta, String periodo) {
        Instant agora = relogio.instant();
        ZoneId fuso = fuso();
        YearMonth mesAtual = YearMonth.from(agora.atZone(fuso));
        ConsultaRelatorio intervalo = consulta;
        if (periodo != null) {
            YearMonth inicio = switch (periodo) {
                case "month" -> mesAtual;
                case "quarter" -> mesAtual.minusMonths(2);
                case "6months" -> mesAtual.minusMonths(5);
                case "year" -> YearMonth.of(mesAtual.getYear(), 1);
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha um período válido.");
            };
            intervalo = consulta.noIntervalo(inicio.atDay(1), mesAtual.atEndOfMonth());
        }
        return CalculosRelatorios.calcular(lancamentos.listar(), contas.listar(), intervalo, agora, fuso);
    }

    public PlanejamentoResposta planejar(Integer ano, ConsultaRelatorio consulta) {
        Instant agora = relogio.instant();
        YearMonth mesAtual = YearMonth.from(agora.atZone(fuso()));
        int selecionado = ano == null ? mesAtual.getYear() : ano;
        if (selecionado < 1 || selecionado > 9999) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha um ano entre 1 e 9999.");
        }
        return CalculosPlanejamento.calcular(lancamentos.listar(), contas.listar(), selecionado, consulta, mesAtual, agora);
    }

    public DividasResposta dividas(ConsultaRelatorio consulta) {
        YearMonth mesAtual = YearMonth.from(relogio.instant().atZone(fuso()));
        return CalculosDividas.calcular(lancamentos.listar(), contas.listar(), categorias.listar(), consulta, mesAtual);
    }

    private ZoneId fuso() {
        return ZoneId.of(configuracoes.buscar().timezone());
    }
}
