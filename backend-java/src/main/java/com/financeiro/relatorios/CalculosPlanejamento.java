package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;

public final class CalculosPlanejamento {
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private CalculosPlanejamento() {
    }

    public static PlanejamentoResposta calcular(List<LancamentoResposta> lancamentos, List<ContaResposta> contas,
            int ano, ConsultaRelatorio consulta, YearMonth mesAtual, Instant agora) {
        ConsultaRelatorio anoSelecionado = consulta.noIntervalo(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31));
        RelatorioResposta resumo = CalculosRelatorios.calcular(lancamentos, contas, anoSelecionado, agora);
        Map<String, RelatorioResposta.FluxoMensal> fluxo = resumo.cashflow().stream()
                .collect(Collectors.toMap(RelatorioResposta.FluxoMensal::month, mes -> mes));
        List<PlanejamentoResposta.Mes> meses = new ArrayList<>();
        BigDecimal acumulado = ZERO;
        for (int numero = 1; numero <= 12; numero++) {
            YearMonth mes = YearMonth.of(ano, numero);
            var cadastrado = fluxo.get(mes.toString());
            BigDecimal receitas = cadastrado == null ? ZERO : cadastrado.income();
            BigDecimal despesas = cadastrado == null ? ZERO : cadastrado.expense();
            BigDecimal saldo = receitas.subtract(despesas);
            acumulado = acumulado.add(saldo);
            String nome = Month.of(numero).getDisplayName(TextStyle.FULL, Locale.forLanguageTag("pt-BR"));
            String titulo = nome.substring(0, 1).toUpperCase(Locale.forLanguageTag("pt-BR")) + nome.substring(1) + " " + ano;
            meses.add(new PlanejamentoResposta.Mes(mes.toString(), titulo, receitas, despesas, saldo,
                    acumulado, cadastrado != null, mes.equals(mesAtual)));
        }
        int registrados = fluxo.size();
        BigDecimal receitas = resumo.kpis().totalIncome();
        BigDecimal despesas = resumo.kpis().totalExpense();
        BigDecimal receitasProjetadas = projetar(receitas, registrados);
        BigDecimal despesasProjetadas = projetar(despesas, registrados);
        var totais = new PlanejamentoResposta.Totais(receitas, despesas, receitas.subtract(despesas),
                receitasProjetadas, despesasProjetadas, receitasProjetadas.subtract(despesasProjetadas),
                meses.stream().filter(mes -> mes.hasRecords() && mes.net().signum() < 0).count(), registrados);
        return new PlanejamentoResposta(List.copyOf(meses), totais);
    }

    private static BigDecimal projetar(BigDecimal total, int registrados) {
        return registrados == 0 ? ZERO : total.add(total.multiply(BigDecimal.valueOf(12L - registrados))
                .divide(BigDecimal.valueOf(registrados), 2, RoundingMode.HALF_UP));
    }
}
