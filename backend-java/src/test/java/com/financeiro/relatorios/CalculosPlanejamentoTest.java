package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import org.junit.jupiter.api.Test;

class CalculosPlanejamentoTest {
    private static final Instant AGORA = Instant.parse("2026-10-28T12:00:00Z");

    @Test
    void reproduzMesZeroDistintoDeMesVazioEExclusoesDoPlanejamentoTypescript() {
        var beneficio = new ContaResposta("benefit", "local-demo", "Benefício fictício", "", "benefit", null, null, null, true);
        var registros = List.of(
                lancamento("a", "expense", "0.10", "2026-10-05", null, false),
                lancamento("b", "expense", "0.20", "2026-10-05", null, false),
                lancamento("zero", "expense", "0", "2026-11-01", null, false),
                lancamento("benefit", "expense", "900", "2026-10-05", "benefit", false),
                lancamento("excluded", "expense", "500", "2026-10-05", null, true));
        var plano = calcular(registros, List.of(beneficio), "due_date");

        assertThat(plano.rows()).hasSize(12);
        assertThat(plano.rows().get(9).expense()).isEqualByComparingTo("0.30");
        assertThat(plano.rows().get(9).isCurrentMonth()).isTrue();
        assertThat(plano.rows().get(9).label()).isEqualTo("Outubro 2026");
        assertThat(plano.rows().get(10).hasRecords()).isTrue();
        assertThat(plano.rows().get(10).expense()).isEqualByComparingTo("0");
        assertThat(plano.rows().get(8).hasRecords()).isFalse();
        assertThat(plano.totals().recordedMonths()).isEqualTo(2);
        assertThat(plano.totals().totalExpense()).isEqualByComparingTo("0.30");
        assertThat(plano.totals().totalNet()).isEqualByComparingTo("-0.30");
        assertThat(plano.totals().projectedExpense()).isEqualByComparingTo("1.80");
        assertThat(plano.totals().riskMonths()).isEqualTo(1);
    }

    @Test
    void mudaAgrupamentoPorCompetenciaEPreservaAcumuladoNosMesesVazios() {
        var plano = calcular(List.of(
                lancamento("salario", "income", "1", "2026-10-05", null, false),
                lancamento("a", "expense", "0.10", "2026-10-05", null, false),
                lancamento("b", "expense", "0.20", "2026-10-05", null, false)), List.of(), "competence");

        assertThat(plano.rows().get(8).income()).isEqualByComparingTo("1");
        assertThat(plano.rows().get(8).expense()).isEqualByComparingTo("0.30");
        assertThat(plano.rows().get(8).net()).isEqualByComparingTo("0.70");
        assertThat(plano.rows().get(8).accumulated()).isEqualByComparingTo("0.70");
        assertThat(plano.rows().get(9).hasRecords()).isFalse();
        assertThat(plano.rows().get(9).accumulated()).isEqualByComparingTo("0.70");
        assertThat(plano.totals().projectedNet()).isEqualByComparingTo("8.40");
    }

    @Test
    void anoVazioNaoInventaProjecaoNemContagem() {
        var plano = calcular(List.of(lancamento("fora", "expense", "100", "2027-01-01", null, false)), List.of(), "due_date");
        assertThat(plano.rows()).hasSize(12).allSatisfy(mes -> {
            assertThat(mes.hasRecords()).isFalse();
            assertThat(mes.accumulated()).isEqualByComparingTo("0");
        });
        assertThat(plano.totals().recordedMonths()).isZero();
        assertThat(plano.totals().projectedIncome()).isEqualByComparingTo("0");
        assertThat(plano.totals().projectedExpense()).isEqualByComparingTo("0");
    }

    @Test
    void arredondaSomenteEstimativaFinalEContaMesesComValorZero() {
        List<LancamentoResposta> registros = new ArrayList<>();
        for (int mes = 1; mes <= 7; mes++) {
            registros.add(lancamento("mes" + mes, "expense", mes == 1 ? "0.01" : "0",
                    LocalDate.of(2026, mes, 1).toString(), null, false));
        }
        var plano = calcular(registros, List.of(), "due_date");
        assertThat(plano.totals().recordedMonths()).isEqualTo(7);
        assertThat(plano.totals().projectedExpense()).isEqualByComparingTo("0.02");
    }

    private static PlanejamentoResposta calcular(List<LancamentoResposta> lancamentos, List<ContaResposta> contas, String modo) {
        return CalculosPlanejamento.calcular(lancamentos, contas, 2026,
                new ConsultaRelatorio(null, null, modo, null, null, null, null, null), YearMonth.of(2026, 10), AGORA);
    }

    private static LancamentoResposta lancamento(String id, String tipo, String valor, String vencimento,
            String conta, boolean excluido) {
        return new LancamentoResposta(id, "local-demo", null, conta, null, id, "", new BigDecimal(valor),
                tipo, LocalDate.parse(vencimento), LocalDate.parse("2026-09-30"), null, null,
                "pending", "manual", excluido, Map.of(), AGORA, AGORA);
    }
}
