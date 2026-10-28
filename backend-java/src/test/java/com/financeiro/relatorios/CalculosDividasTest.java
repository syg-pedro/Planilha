package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import com.financeiro.categorias.CategoriaResposta;
import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import org.junit.jupiter.api.Test;

class CalculosDividasTest {
    @Test
    void agrupaPorContaERegraPreservandoParcelasCadastradasEStatusReview() {
        var conta = new ContaResposta("card", "local-demo", "Cartão fictício", "Pessoa", "credit_card", null, null, null, true);
        var categoria = new CategoriaResposta("casa", "local-demo", "Casa fictícia", "expense", "#000000");
        var registros = List.of(
                parcela("segunda", "Título alterado", "rule", "card", "20", 2, 3, "review", "2026-11-01", false),
                parcela("primeira", "Compra fictícia", "rule", "card", "10", 1, 3, "paid", "2026-10-01", false),
                parcela("quitada", "Quitada", null, null, "50", 1, 2, "paid", "2026-10-01", false));
        var dividas = calcular(registros, List.of(conta), List.of(categoria), consulta());

        assertThat(dividas.groups()).hasSize(1);
        var grupo = dividas.groups().get(0);
        assertThat(grupo.key()).isEqualTo("[\"card\",\"rule\"]");
        assertThat(grupo.title()).isEqualTo("Compra fictícia");
        assertThat(grupo.catName()).isEqualTo("Casa fictícia");
        assertThat(grupo.accountName()).isEqualTo("Cartão fictício");
        assertThat(grupo.entries()).extracting(LancamentoResposta::id).containsExactly("primeira", "segunda");
        assertThat(grupo.totalCount()).isEqualTo(2);
        assertThat(grupo.paidCount()).isEqualTo(1);
        assertThat(grupo.totalAmount()).isEqualByComparingTo("30");
        assertThat(grupo.pendingAmount()).isEqualByComparingTo("20");
        assertThat(grupo.installmentAmount()).isEqualByComparingTo("15");
        assertThat(dividas.summary().totalAmount()).isEqualByComparingTo("30");
        assertThat(dividas.summary().thisMonth()).isEqualByComparingTo("0");
    }

    @Test
    void naoMisturaMesmoTituloDeContasDistintasENaoExcluiBeneficiosOuReceitasParceladas() {
        var beneficio = new ContaResposta("benefit", "local-demo", "Benefício fictício", "", "benefit", null, null, null, true);
        var registros = List.of(
                parcela("a", "Mesmo título", null, "benefit", "0.10", 1, 2, "pending", "2026-10-15", true),
                parcela("b", "Mesmo título", null, null, "0.20", 1, 2, "review", "2026-10-20", false));
        var dividas = calcular(registros, List.of(beneficio), List.of(), consulta());

        assertThat(dividas.groups()).hasSize(2);
        assertThat(dividas.summary().totalPending()).isEqualByComparingTo("0.30");
        assertThat(dividas.summary().thisMonth()).isEqualByComparingTo("0.30");
        assertThat(dividas.summary().totalCount()).isEqualTo(2);
        assertThat(dividas.groups().get(0).entries().get(0).kind()).isEqualTo("income");
    }

    @Test
    void conservaParcelaPendenteZeroEIgnoraRegistrosSemParcelamento() {
        var registros = List.of(
                parcela("zero", "Zero fictício", null, null, "0", 1, 2, "pending", "2026-10-01", false),
                parcela("unica", "Sem parcelamento", null, null, "10", 1, 1, "pending", "2026-10-01", false));
        var dividas = calcular(registros, List.of(), List.of(), consulta());

        assertThat(dividas.groups()).hasSize(1);
        assertThat(dividas.groups().get(0).title()).isEqualTo("Zero fictício");
        assertThat(dividas.summary().totalPending()).isEqualByComparingTo("0");
        assertThat(dividas.summary().totalCount()).isEqualTo(1);
    }

    @Test
    void aplicaFiltrosIndividuaisSemAlterarEntradasOriginais() {
        var registros = List.of(
                parcela("a", "Parcela selecionada", null, "card", "100", 1, 2, "pending", "2026-10-01", false),
                parcela("b", "Outra parcela", null, null, "200", 1, 2, "pending", "2026-10-01", false));
        var consulta = new ConsultaRelatorio(null, null, null, "card", null, null, null, "selecionada");
        var filtrado = calcular(registros, List.of(), List.of(), consulta);
        var completo = calcular(registros, List.of(), List.of(), consulta());

        assertThat(filtrado.summary().totalPending()).isEqualByComparingTo("100");
        assertThat(completo.summary().totalPending()).isEqualByComparingTo("300");
        assertThat(registros).hasSize(2);
    }

    private static DividasResposta calcular(List<LancamentoResposta> lancamentos, List<ContaResposta> contas,
            List<CategoriaResposta> categorias, ConsultaRelatorio consulta) {
        return CalculosDividas.calcular(lancamentos, contas, categorias, consulta, YearMonth.of(2026, 10));
    }

    private static ConsultaRelatorio consulta() {
        return new ConsultaRelatorio(null, null, null, null, null, null, null, null);
    }

    private static LancamentoResposta parcela(String id, String titulo, String regra, String conta,
            String valor, int indice, int total, String status, String vencimento, boolean excluido) {
        return new LancamentoResposta(id, "local-demo", regra, conta, "casa", titulo, "", new BigDecimal(valor),
                "income", LocalDate.parse(vencimento), LocalDate.parse(vencimento), indice, total,
                status, "manual", excluido, Map.of(), Instant.EPOCH, Instant.EPOCH);
    }
}
