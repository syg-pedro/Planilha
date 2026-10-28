package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import org.junit.jupiter.api.Test;

class CalculosRelatoriosTest {
    private static final Instant AGORA = Instant.parse("2026-05-01T12:00:00Z");

    @Test
    void reproduzIndicadoresDoContratoTypescript() {
        var contas = List.of(conta("cartao", "credit_card", "1000"));
        var registros = List.of(
                lancamento("salario", "income", "2000", "2026-05-05", "2026-05-05", "paid", null, null, false),
                lancamento("compra", "expense", "500", "2026-05-10", "2026-05-10", "pending", "cartao", null, false));
        var resumo = CalculosRelatorios.calcular(registros, contas, consulta(), AGORA);

        assertThat(resumo.kpis().totalIncome()).isEqualByComparingTo("2000");
        assertThat(resumo.kpis().totalExpense()).isEqualByComparingTo("500");
        assertThat(resumo.kpis().net()).isEqualByComparingTo("1500");
        assertThat(resumo.kpis().cardsUsedPercent()).isEqualByComparingTo("50");
        assertThat(resumo.kpis().pendingAmount()).isEqualByComparingTo("500");
    }

    @Test
    void somaCentavosSemPontoFlutuanteEExcluiBeneficiosEItensMarcados() {
        var registros = List.of(
                lancamento("centavos1", "expense", "0.10", "2026-05-05", "2026-05-05", "pending", null, null, false),
                lancamento("centavos2", "expense", "0.20", "2026-05-05", "2026-05-05", "review", null, null, false),
                lancamento("recebida", "income", "100", "2026-05-05", "2026-05-05", "paid", null, null, false),
                lancamento("receber", "income", "20", "2026-05-05", "2026-05-05", "pending", null, null, false),
                lancamento("paga", "expense", "10", "2026-05-05", "2026-05-05", "paid", null, null, false),
                lancamento("beneficio", "income", "500", "2026-05-05", "2026-05-05", "paid", "beneficio", null, false),
                lancamento("excluido", "expense", "99", "2026-05-05", "2026-05-05", "pending", null, null, true));
        var resumo = CalculosRelatorios.calcular(registros, List.of(conta("beneficio", "benefit", null)), consulta(), AGORA);

        assertThat(resumo.totals().income()).isEqualByComparingTo("120.00");
        assertThat(resumo.totals().expense()).isEqualByComparingTo("10.30");
        assertThat(resumo.totals().net()).isEqualByComparingTo("109.70");
        assertThat(resumo.totals().pendingExpense()).isEqualByComparingTo("0.30");
        assertThat(resumo.totals().pendingIncome()).isEqualByComparingTo("20");
        assertThat(resumo.kpis().pendingAmount()).isEqualByComparingTo("-19.70");
        assertThat(resumo.totals().settledNet()).isEqualByComparingTo("90");
        assertThat(resumo.totals().excluded()).isEqualByComparingTo("599");
        assertThat(resumo.totals().incomeCount()).isEqualTo(2);
        assertThat(resumo.totals().expenseCount()).isEqualTo(3);
        assertThat(resumo.categories()).containsEntry("sem-categoria", new BigDecimal("10.30"));
        assertThat(resumo.dailyExpenses()).containsOnlyKeys("2026-05-05");
        assertThat(resumo.dailyExpenses().get("2026-05-05")).isEqualByComparingTo("10.30");
    }

    @Test
    void preservaComparacaoUtcLegadaQueDeixaVencimentoDeHojeForaDepoisDaMeiaNoite() {
        var registros = List.of(
                lancamento("hoje", "expense", "10", "2026-05-05", "2026-05-05", "pending", null, null, false),
                lancamento("limite", "expense", "20", "2026-05-12", "2026-05-12", "review", null, null, false),
                lancamento("fora", "expense", "40", "2026-05-13", "2026-05-13", "pending", null, null, false),
                lancamento("paga", "expense", "80", "2026-05-06", "2026-05-06", "paid", null, null, false));

        var meioDia = CalculosRelatorios.calcular(registros, List.of(), consulta(), Instant.parse("2026-05-05T12:00:00Z"));
        var meiaNoite = CalculosRelatorios.calcular(registros, List.of(), consulta(), Instant.parse("2026-05-05T00:00:00Z"));

        assertThat(meioDia.kpis().upcoming7Days()).isEqualByComparingTo("20");
        assertThat(meiaNoite.kpis().upcoming7Days()).isEqualByComparingTo("30");
    }

    @Test
    void separaQuinzenasPeloVencimentoEEncerraFevereiroNoDiaCorreto() {
        var registros = List.of(
                lancamento("primeira", "expense", "100", "2026-02-15", "2026-01-10", "pending", null, null, false),
                lancamento("segunda", "expense", "200", "2026-02-28", "2026-01-10", "review", null, null, false),
                lancamento("paga", "expense", "300", "2026-02-16", "2026-02-16", "paid", null, null, false),
                lancamento("excluida", "expense", "400", "2026-02-20", "2026-02-20", "pending", null, null, true),
                lancamento("beneficio", "expense", "500", "2026-02-10", "2026-02-10", "pending", "beneficio", null, false),
                lancamento("outro-mes", "expense", "600", "2026-03-01", "2026-03-01", "pending", null, null, false));
        var resumo = CalculosRelatorios.calcular(registros, List.of(conta("beneficio", "benefit", null)),
                consulta(), Instant.parse("2026-03-01T01:00:00Z"));

        var primeira = resumo.paymentCycles().get(0);
        var segunda = resumo.paymentCycles().get(1);
        assertThat(primeira.id()).isEqualTo("first-half");
        assertThat(primeira.startDay()).isEqualTo(1);
        assertThat(primeira.endDay()).isEqualTo(15);
        assertThat(primeira.pendingTotal()).isEqualByComparingTo("100");
        assertThat(primeira.pendingCount()).isEqualTo(1);
        assertThat(primeira.projectedBalanceImpact()).isEqualByComparingTo("-100");
        assertThat(segunda.id()).isEqualTo("second-half");
        assertThat(segunda.endDay()).isEqualTo(28);
        assertThat(segunda.pendingTotal()).isEqualByComparingTo("200");
        assertThat(segunda.projectedBalanceImpact()).isEqualByComparingTo("-200");
    }

    @Test
    void aplicaFiltrosComDatasInclusivasECompetenciaIndependenteDoVencimento() {
        var contas = List.of(conta("banco", "bank", null));
        var registros = List.of(
                lancamento("ALUGUEL", "expense", "100", "2026-10-01", "2026-09-01", "review", "banco", "casa", false),
                lancamento("ALUGUEL2", "expense", "200", "2026-10-01", "2026-09-30", "review", "banco", "casa", false),
                lancamento("outro", "expense", "300", "2026-09-30", "2026-10-01", "review", "banco", "casa", false),
                lancamento("pago", "expense", "400", "2026-09-10", "2026-09-10", "paid", "banco", "casa", false));
        var filtro = new ConsultaRelatorio(LocalDate.parse("2026-09-01"), LocalDate.parse("2026-09-30"),
                "competence", "banco", "casa", "expense", "review", "  aluguel  ");
        var resumo = CalculosRelatorios.calcular(registros, contas, filtro, AGORA);

        assertThat(resumo.kpis().totalExpense()).isEqualByComparingTo("300");
        assertThat(resumo.cashflow()).hasSize(1);
        assertThat(resumo.cashflow().get(0).month()).isEqualTo("2026-09");
        assertThat(resumo.categories()).containsOnlyKeys("casa");
        assertThat(resumo.categories().get("casa")).isEqualByComparingTo("300");
    }

    @Test
    void buscaPelaContaEResponsavelEAceitaSemContaCategoria() {
        var conta = new ContaResposta("banco", "local-demo", "Banco fictício", "Pessoa fictícia", "bank", null, null, null, true);
        var registros = List.of(
                lancamento("a", "expense", "10", "2026-05-05", "2026-05-05", "pending", "banco", "casa", false),
                lancamento("b", "expense", "20", "2026-05-05", "2026-05-05", "pending", null, null, false));
        var porResponsavel = new ConsultaRelatorio(null, null, null, null, null, null, null, "PESSOA FICTÍCIA");
        var semConta = new ConsultaRelatorio(null, null, null, "none", "none", null, null, null);

        assertThat(CalculosRelatorios.calcular(registros, List.of(conta), porResponsavel, AGORA).totals().expense())
                .isEqualByComparingTo("10");
        assertThat(CalculosRelatorios.calcular(registros, List.of(conta), semConta, AGORA).totals().expense())
                .isEqualByComparingTo("20");
    }

    @Test
    void conservaComprometimentoGlobalDoCartaoMesmoComFiltroDeMes() {
        var registros = List.of(
                lancamento("atual", "expense", "100", "2026-05-05", "2026-05-05", "pending", "cartao", null, false),
                lancamento("futuro", "expense", "200", "2027-05-05", "2027-05-05", "review", "cartao", null, false),
                lancamento("pago", "expense", "500", "2026-05-05", "2026-05-05", "paid", "cartao", null, false),
                lancamento("excluido", "expense", "30", "2027-06-05", "2027-06-05", "pending", "cartao", null, true));
        var filtro = new ConsultaRelatorio(LocalDate.parse("2026-05-01"), LocalDate.parse("2026-05-31"),
                null, null, null, null, null, null);
        var resumo = CalculosRelatorios.calcular(registros, List.of(conta("cartao", "credit_card", "1000")), filtro, AGORA);
        var cartao = resumo.cards().get(0);

        assertThat(cartao.expense()).isEqualByComparingTo("600");
        assertThat(cartao.globalCommitted()).isEqualByComparingTo("330");
        assertThat(cartao.available()).isEqualByComparingTo("670");
        assertThat(cartao.usagePercent()).isEqualByComparingTo("60");
        assertThat(resumo.kpis().cardsUsedPercent()).isEqualByComparingTo("60");
    }

    @Test
    void acumulaFluxoEmOrdemCronologicaSemInventarMesesVazios() {
        var registros = List.of(
                lancamento("despesa", "expense", "0.20", "2027-01-05", "2027-01-05", "pending", null, null, false),
                lancamento("receita", "income", "0.10", "2026-11-05", "2026-11-05", "paid", null, null, false),
                lancamento("zero", "income", "0", "2027-02-05", "2027-02-05", "pending", null, null, false));
        var resumo = CalculosRelatorios.calcular(registros, List.of(), consulta(), AGORA);

        assertThat(resumo.cashflow()).extracting(RelatorioResposta.FluxoMensal::month)
                .containsExactly("2026-11", "2027-01", "2027-02");
        assertThat(resumo.projection().get(0).balance()).isEqualByComparingTo("0.10");
        assertThat(resumo.projection().get(1).balance()).isEqualByComparingTo("-0.10");
        assertThat(resumo.projection().get(2).balance()).isEqualByComparingTo("-0.10");
    }

    @Test
    void devolveZeroSemRegistrosEPreservaCartoesSemMovimento() {
        var contas = List.of(conta("cartao", "credit_card", null));
        var resumo = CalculosRelatorios.calcular(List.of(), contas, consulta(), AGORA);

        assertThat(resumo.kpis().totalIncome()).isEqualByComparingTo("0");
        assertThat(resumo.kpis().cardsUsedPercent()).isEqualByComparingTo("0");
        assertThat(resumo.cashflow()).isEmpty();
        assertThat(resumo.projection()).isEmpty();
        assertThat(resumo.categories()).isEmpty();
        assertThat(resumo.cards()).hasSize(1);
        assertThat(resumo.cards().get(0).available()).isNull();
        assertThat(resumo.cards().get(0).globalCommitted()).isEqualByComparingTo("0");
        assertThat(resumo.paymentCycles()).hasSize(2);
    }

    @Test
    void calculaPoupancaESobraPorPessoaSemPerderResponsavelVazio() {
        var contas = List.of(
                new ContaResposta("a", "local-demo", "Banco A", "Pessoa fictícia", "bank", null, null, null, true),
                new ContaResposta("b", "local-demo", "Banco B", "", "bank", null, null, null, true));
        var registros = List.of(
                lancamento("renda", "income", "100", "2026-05-05", "2026-05-05", "paid", "a", null, false),
                lancamento("gasto", "expense", "20", "2026-05-05", "2026-05-05", "pending", "a", null, false),
                lancamento("vazio", "expense", "5", "2026-05-05", "2026-05-05", "pending", "b", null, false),
                lancamento("sem-conta", "expense", "10", "2026-05-05", "2026-05-05", "review", null, null, false));
        var resumo = CalculosRelatorios.calcular(registros, contas, consulta(), AGORA);

        assertThat(resumo.savingsRate()).isEqualByComparingTo("65");
        assertThat(resumo.persons()).extracting(RelatorioResposta.Pessoa::name)
                .containsExactly("Pessoa fictícia", "", "Sem titular");
        assertThat(resumo.persons().get(0).net()).isEqualByComparingTo("80");
        assertThat(resumo.persons().get(1).net()).isEqualByComparingTo("-5");
        assertThat(resumo.persons().get(2).net()).isEqualByComparingTo("-10");
    }

    private static ConsultaRelatorio consulta() {
        return new ConsultaRelatorio(null, null, null, null, null, null, null, null);
    }

    private static ContaResposta conta(String id, String tipo, String limite) {
        return new ContaResposta(id, "local-demo", id, "", tipo,
                limite == null ? null : new BigDecimal(limite), null, null, true);
    }

    private static LancamentoResposta lancamento(String id, String tipo, String valor, String vencimento,
            String competencia, String status, String conta, String categoria, boolean excluido) {
        return new LancamentoResposta(id, "local-demo", null, conta, categoria, id, "", new BigDecimal(valor),
                tipo, LocalDate.parse(vencimento), LocalDate.parse(competencia), null, null, status, "manual",
                excluido, Map.of(), AGORA, AGORA);
    }
}
