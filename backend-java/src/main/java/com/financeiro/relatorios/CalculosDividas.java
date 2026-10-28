package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.financeiro.categorias.CategoriaResposta;
import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;

public final class CalculosDividas {
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private CalculosDividas() {
    }

    private record Chave(String conta, String regraOuTitulo) {
    }

    public static DividasResposta calcular(List<LancamentoResposta> lancamentos, List<ContaResposta> contas,
            List<CategoriaResposta> categorias, ConsultaRelatorio consulta, YearMonth mesAtual) {
        Map<String, ContaResposta> contasPorId = contas.stream().collect(Collectors.toMap(ContaResposta::id, conta -> conta));
        Map<String, CategoriaResposta> categoriasPorId = categorias.stream().collect(Collectors.toMap(CategoriaResposta::id, categoria -> categoria));
        Map<Chave, List<LancamentoResposta>> parcelas = lancamentos.stream()
                .filter(lancamento -> lancamento.installmentTotal() != null && lancamento.installmentTotal() > 1)
                .filter(lancamento -> CalculosRelatorios.corresponde(lancamento, contasPorId, consulta))
                .collect(Collectors.groupingBy(lancamento -> new Chave(lancamento.accountId(),
                        lancamento.ruleId() == null ? lancamento.title() : lancamento.ruleId()),
                        LinkedHashMap::new, Collectors.toList()));
        List<DividasResposta.Grupo> grupos = parcelas.entrySet().stream().map(parcela -> {
            List<LancamentoResposta> ordenados = parcela.getValue().stream().sorted(Comparator.comparingInt(
                    lancamento -> lancamento.installmentIndex() == null ? 0 : lancamento.installmentIndex())).toList();
            LancamentoResposta primeiro = ordenados.get(0);
            BigDecimal total = CalculosRelatorios.somar(ordenados, lancamento -> true);
            BigDecimal pendente = CalculosRelatorios.somar(ordenados, lancamento -> !"paid".equals(lancamento.status()));
            long pagas = ordenados.stream().filter(lancamento -> "paid".equals(lancamento.status())).count();
            ContaResposta conta = contasPorId.get(primeiro.accountId());
            CategoriaResposta categoria = categoriasPorId.get(primeiro.categoryId());
            String chave = JsonNodeFactory.instance.arrayNode().add(parcela.getKey().conta())
                    .add(parcela.getKey().regraOuTitulo()).toString();
            return new DividasResposta.Grupo(chave, primeiro.title(), categoria == null ? "—" : categoria.name(),
                    conta == null ? "—" : conta.name(), primeiro.accountId(), ordenados, pagas, ordenados.size(),
                    total, pendente, total.divide(BigDecimal.valueOf(ordenados.size()), MathContext.DECIMAL128));
        }).filter(grupo -> grupo.pendingAmount().signum() > 0 || grupo.paidCount() < grupo.totalCount())
                .sorted(Comparator.comparing(DividasResposta.Grupo::pendingAmount).reversed()).toList();
        List<LancamentoResposta> registros = grupos.stream().flatMap(grupo -> grupo.entries().stream()).toList();
        BigDecimal nesteMes = CalculosRelatorios.somar(registros, lancamento -> !"paid".equals(lancamento.status())
                && YearMonth.from(lancamento.dueDate()).equals(mesAtual));
        var resumo = new DividasResposta.Resumo(
                grupos.stream().map(DividasResposta.Grupo::pendingAmount).reduce(ZERO, BigDecimal::add),
                grupos.stream().map(DividasResposta.Grupo::totalAmount).reduce(ZERO, BigDecimal::add),
                grupos.stream().mapToLong(DividasResposta.Grupo::paidCount).sum(),
                grupos.stream().mapToLong(DividasResposta.Grupo::totalCount).sum(), nesteMes);
        return new DividasResposta(grupos, resumo);
    }
}
