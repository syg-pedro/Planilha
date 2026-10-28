package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.relatorios.MatrizResposta.Celula;
import com.financeiro.relatorios.MatrizResposta.Compromisso;
import com.financeiro.relatorios.MatrizResposta.Linha;
import com.financeiro.relatorios.MatrizResposta.Resumo;

public final class CalculosMatriz {
    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final ObjectMapper JSON = new ObjectMapper();

    private CalculosMatriz() {
    }

    public static MatrizResposta calcular(List<LancamentoResposta> entradas, List<ContaResposta> contas,
            List<String> meses, String criterio, List<LancamentoResposta> todosLancamentos) {
        Map<String, ContaResposta> contasPorId = contas.stream().collect(Collectors.toMap(ContaResposta::id, conta -> conta));
        Set<String> beneficios = contas.stream().filter(conta -> "benefit".equals(conta.type()))
                .map(ContaResposta::id).collect(Collectors.toSet());
        Map<String, List<LancamentoResposta>> agrupados = new LinkedHashMap<>();
        for (LancamentoResposta entrada : entradas) {
            agrupados.computeIfAbsent(id(entrada, contasPorId.get(entrada.accountId())), chave -> new ArrayList<>()).add(entrada);
        }
        List<Linha> linhas = new ArrayList<>();
        for (var grupo : agrupados.entrySet()) {
            List<LancamentoResposta> registros = List.copyOf(grupo.getValue());
            LancamentoResposta primeiro = registros.getFirst();
            ContaResposta conta = contasPorId.get(primeiro.accountId());
            String tipoGrupo = excluido(primeiro, beneficios) ? "excluded"
                    : "income".equals(primeiro.kind()) ? "income"
                    : conta != null && "credit_card".equals(conta.type()) ? "cards" : "expenses";
            Map<String, Celula> celulas = new LinkedHashMap<>();
            for (String mes : meses) {
                celulas.put(mes, valor(registros.stream().filter(entrada -> mes.equals(mes(entrada, criterio))).toList()));
            }
            List<LancamentoResposta> doPeriodo = celulas.values().stream().flatMap(celula -> celula.entries().stream()).toList();
            if (doPeriodo.isEmpty()) continue;
            List<Integer> dias = doPeriodo.stream().map(entrada -> entrada.dueDate().getDayOfMonth()).distinct().sorted().toList();
            BigDecimal total = celulas.values().stream().map(Celula::amount).reduce(ZERO, BigDecimal::add);
            linhas.add(new Linha(grupo.getKey(), "cards".equals(tipoGrupo) ? conta.name() : primeiro.title(),
                    primeiro.kind(), tipoGrupo, conta, registros, celulas, total, dias));
        }
        for (ContaResposta conta : contas) {
            if (!"credit_card".equals(conta.type()) || !conta.active()) continue;
            String id = json(List.of("card", conta.id()));
            if (linhas.stream().anyMatch(linha -> id.equals(linha.id()))) continue;
            Map<String, Celula> celulas = new LinkedHashMap<>();
            meses.forEach(mes -> celulas.put(mes, valor(List.of())));
            linhas.add(new Linha(id, conta.name(), "expense", "cards", conta,
                    List.copyOf(agrupados.getOrDefault(id, List.of())), celulas, ZERO,
                    conta.dueDay() == null ? List.of() : List.of(conta.dueDay())));
        }
        Collator portugues = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
        linhas.sort(Comparator.comparingInt((Linha linha) -> linha.dueDays().isEmpty() ? 32 : linha.dueDays().getFirst())
                .thenComparing(Linha::title, portugues));
        Map<String, Resumo> resumos = new LinkedHashMap<>();
        for (String mes : meses) {
            List<LancamentoResposta> periodo = entradas.stream().filter(entrada -> mes.equals(mes(entrada, criterio))).toList();
            List<LancamentoResposta> receitas = periodo.stream().filter(entrada -> !excluido(entrada, beneficios)
                    && "income".equals(entrada.kind())).toList();
            List<LancamentoResposta> despesas = periodo.stream().filter(entrada -> !excluido(entrada, beneficios)
                    && "expense".equals(entrada.kind())).toList();
            Celula receita = valor(receitas);
            Celula despesa = valor(despesas);
            resumos.put(mes, new Resumo(receita.amount(), despesa.amount(), receita.amount().subtract(despesa.amount()),
                    despesa.paid(), receita.paid(), despesa.pending(), receita.pending(),
                    receita.paid().subtract(despesa.paid()), CalculosRelatorios.somar(periodo, entrada -> excluido(entrada, beneficios)),
                    receitas.size(), despesas.size()));
        }
        Map<String, Compromisso> compromissos = new LinkedHashMap<>();
        for (ContaResposta conta : contas) {
            if (!"credit_card".equals(conta.type())) continue;
            BigDecimal comprometido = CalculosRelatorios.somar(todosLancamentos, entrada -> "expense".equals(entrada.kind())
                    && conta.id().equals(entrada.accountId()) && !"paid".equals(entrada.status()));
            compromissos.put(conta.id(), new Compromisso(comprometido,
                    conta.limitTotal() == null ? null : CalculosRelatorios.dinheiro(conta.limitTotal()).subtract(comprometido)));
        }
        return new MatrizResposta(List.copyOf(meses), List.copyOf(linhas), resumos, totalizar(List.copyOf(resumos.values())), compromissos);
    }

    public static Celula valor(List<LancamentoResposta> entradas) {
        BigDecimal total = CalculosRelatorios.somar(entradas, entrada -> true);
        BigDecimal pago = CalculosRelatorios.somar(entradas, entrada -> "paid".equals(entrada.status()));
        BigDecimal pendente = CalculosRelatorios.somar(entradas, entrada -> !"paid".equals(entrada.status()));
        boolean temPago = entradas.stream().anyMatch(entrada -> "paid".equals(entrada.status()));
        boolean temPendente = entradas.stream().anyMatch(entrada -> !"paid".equals(entrada.status()));
        String estado = entradas.isEmpty() ? null : temPago && temPendente ? "mixed"
                : temPago ? "paid" : entradas.stream().anyMatch(entrada -> "review".equals(entrada.status())) ? "review" : "pending";
        return new Celula(List.copyOf(entradas), total, pago, pendente, estado);
    }

    private static String id(LancamentoResposta entrada, ContaResposta conta) {
        boolean excluido = entrada.excludeFromCalc() || conta != null && "benefit".equals(conta.type());
        if (!excluido && "expense".equals(entrada.kind()) && conta != null && "credit_card".equals(conta.type())) {
            return json(List.of("card", conta.id()));
        }
        return json(Arrays.asList(excluido ? "excluded" : entrada.kind(), entrada.kind(),
                entrada.accountId(), entrada.ruleId(), entrada.title()));
    }

    private static String mes(LancamentoResposta entrada, String criterio) {
        return ("competence".equals(criterio) ? entrada.competenceDate() : entrada.dueDate()).toString().substring(0, 7);
    }

    private static boolean excluido(LancamentoResposta entrada, Set<String> beneficios) {
        return entrada.excludeFromCalc() || beneficios.contains(entrada.accountId());
    }

    private static Resumo totalizar(List<Resumo> resumos) {
        return new Resumo(somar(resumos, Resumo::income), somar(resumos, Resumo::expense), somar(resumos, Resumo::net),
                somar(resumos, Resumo::paid), somar(resumos, Resumo::received), somar(resumos, Resumo::pendingExpense),
                somar(resumos, Resumo::pendingIncome), somar(resumos, Resumo::settledNet), somar(resumos, Resumo::excluded),
                resumos.stream().mapToLong(Resumo::incomeCount).sum(), resumos.stream().mapToLong(Resumo::expenseCount).sum());
    }

    private static BigDecimal somar(List<Resumo> resumos, java.util.function.Function<Resumo, BigDecimal> valor) {
        return resumos.stream().map(valor).reduce(ZERO, BigDecimal::add);
    }

    private static String json(List<?> valores) {
        try {
            return JSON.writeValueAsString(valores);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível agrupar os lançamentos.", exception);
        }
    }
}
