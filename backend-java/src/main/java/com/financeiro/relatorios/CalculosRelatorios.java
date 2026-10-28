package com.financeiro.relatorios;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import com.financeiro.contas.ContaResposta;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.relatorios.RelatorioResposta.Cartao;
import com.financeiro.relatorios.RelatorioResposta.CicloPagamento;
import com.financeiro.relatorios.RelatorioResposta.FluxoMensal;
import com.financeiro.relatorios.RelatorioResposta.Indicadores;
import com.financeiro.relatorios.RelatorioResposta.ProjecaoMensal;
import com.financeiro.relatorios.RelatorioResposta.Totais;

public final class CalculosRelatorios {
    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final Locale PORTUGUES = Locale.forLanguageTag("pt-BR");
    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private CalculosRelatorios() {
    }

    public static RelatorioResposta calcular(List<LancamentoResposta> lancamentos, List<ContaResposta> contas,
            ConsultaRelatorio consulta, Instant agora) {
        return calcular(lancamentos, contas, consulta, agora, FUSO);
    }

    public static RelatorioResposta calcular(List<LancamentoResposta> lancamentos, List<ContaResposta> contas,
            ConsultaRelatorio consulta, Instant agora, ZoneId fuso) {
        Map<String, ContaResposta> contasPorId = contas.stream().collect(Collectors.toMap(ContaResposta::id, conta -> conta));
        Set<String> beneficios = contas.stream().filter(conta -> "benefit".equals(conta.type()))
                .map(ContaResposta::id).collect(Collectors.toSet());
        Predicate<LancamentoResposta> elegivel = lancamento -> !lancamento.excludeFromCalc()
                && !beneficios.contains(lancamento.accountId());
        List<LancamentoResposta> filtrados = lancamentos.stream()
                .filter(lancamento -> corresponde(lancamento, contasPorId, consulta)).toList();
        List<LancamentoResposta> caixa = filtrados.stream().filter(elegivel).toList();
        BigDecimal receitas = somar(caixa, CalculosRelatorios::receita);
        BigDecimal despesas = somar(caixa, CalculosRelatorios::despesa);
        BigDecimal saldo = receitas.subtract(despesas);
        BigDecimal pagos = somar(caixa, lancamento -> despesa(lancamento) && pago(lancamento));
        BigDecimal recebidos = somar(caixa, lancamento -> receita(lancamento) && pago(lancamento));
        BigDecimal despesasPendentes = somar(caixa, lancamento -> despesa(lancamento) && !pago(lancamento));
        BigDecimal receitasPendentes = somar(caixa, lancamento -> receita(lancamento) && !pago(lancamento));
        Totais totais = new Totais(receitas, despesas, saldo, pagos, recebidos, despesasPendentes, receitasPendentes,
                recebidos.subtract(pagos), somar(filtrados, elegivel.negate()),
                caixa.stream().filter(CalculosRelatorios::receita).count(),
                caixa.stream().filter(CalculosRelatorios::despesa).count());
        List<Cartao> cartoes = cartoes(caixa, lancamentos, contas);
        BigDecimal limite = contas.stream().filter(conta -> "credit_card".equals(conta.type()))
                .map(ContaResposta::limitTotal).filter(valor -> valor != null)
                .map(CalculosRelatorios::dinheiro).reduce(ZERO, BigDecimal::add);
        BigDecimal despesasCartoes = cartoes.stream().map(Cartao::expense).reduce(ZERO, BigDecimal::add);
        Instant seteDias = agora.plus(7, ChronoUnit.DAYS);
        BigDecimal proximos = somar(caixa, lancamento -> {
            Instant vencimento = lancamento.dueDate().atStartOfDay(ZoneOffset.UTC).toInstant();
            return despesa(lancamento) && !pago(lancamento)
                    && !vencimento.isBefore(agora) && !vencimento.isAfter(seteDias);
        });
        Indicadores indicadores = new Indicadores(receitas, despesas, saldo,
                despesasPendentes.subtract(receitasPendentes), proximos, percentual(despesasCartoes, limite));
        List<FluxoMensal> fluxo = fluxo(caixa, consulta.periodMode());
        Map<String, BigDecimal> categorias = new TreeMap<>();
        caixa.stream().filter(CalculosRelatorios::despesa).forEach(lancamento -> categorias.merge(
                lancamento.categoryId() == null ? "sem-categoria" : lancamento.categoryId(),
                dinheiro(lancamento.amount()), BigDecimal::add));
        Map<String, BigDecimal> despesasDiarias = new TreeMap<>();
        caixa.stream().filter(CalculosRelatorios::despesa).forEach(lancamento -> despesasDiarias.merge(
                lancamento.dueDate().toString(), dinheiro(lancamento.amount()), BigDecimal::add));
        return new RelatorioResposta(totais, indicadores, fluxo, categorias, cartoes,
                ciclos(caixa, agora, fuso), projecao(fluxo), percentual(saldo, receitas), pessoas(caixa, contasPorId), despesasDiarias);
    }

    static boolean corresponde(LancamentoResposta lancamento, Map<String, ContaResposta> contas,
            ConsultaRelatorio consulta) {
        LocalDate data = data(lancamento, consulta.periodMode());
        if (consulta.from() != null && data.isBefore(consulta.from())) return false;
        if (consulta.to() != null && data.isAfter(consulta.to())) return false;
        if (!consulta.kind().equals("all") && !consulta.kind().equals(lancamento.kind())) return false;
        if (!consulta.status().equals("all") && !consulta.status().equals(lancamento.status())) return false;
        if (!consulta.accountId().isEmpty() && !consulta.accountId().equals(
                lancamento.accountId() == null ? "none" : lancamento.accountId())) return false;
        if (!consulta.categoryId().isEmpty() && !consulta.categoryId().equals(
                lancamento.categoryId() == null ? "none" : lancamento.categoryId())) return false;
        if (consulta.search().isEmpty()) return true;
        ContaResposta conta = contas.get(lancamento.accountId());
        String texto = lancamento.title() + " " + lancamento.description() + " "
                + (conta == null ? "" : conta.name() + " " + conta.owner());
        return texto.toLowerCase(PORTUGUES).contains(consulta.search().toLowerCase(PORTUGUES));
    }

    private static List<Cartao> cartoes(List<LancamentoResposta> caixa, List<LancamentoResposta> lancamentos,
            List<ContaResposta> contas) {
        return contas.stream().filter(conta -> "credit_card".equals(conta.type()))
                .sorted(java.util.Comparator.comparing(ContaResposta::name).thenComparing(ContaResposta::id))
                .map(conta -> {
                    Predicate<LancamentoResposta> doCartao = lancamento -> despesa(lancamento)
                            && conta.id().equals(lancamento.accountId());
                    BigDecimal despesas = somar(caixa, doCartao);
                    BigDecimal comprometido = somar(lancamentos, doCartao.and(lancamento -> !pago(lancamento)));
                    BigDecimal limite = conta.limitTotal() == null ? null : dinheiro(conta.limitTotal());
                    return new Cartao(conta.id(), conta.name(), limite, despesas, comprometido,
                            limite == null ? null : limite.subtract(comprometido), percentual(despesas, limite));
                }).toList();
    }

    private static List<RelatorioResposta.Pessoa> pessoas(List<LancamentoResposta> caixa, Map<String, ContaResposta> contas) {
        Map<String, List<LancamentoResposta>> titulares = caixa.stream().collect(Collectors.groupingBy(lancamento -> {
            ContaResposta conta = contas.get(lancamento.accountId());
            return conta == null ? "Sem titular" : conta.owner();
        }, LinkedHashMap::new, Collectors.toList()));
        return titulares.entrySet().stream().map(titular -> {
            BigDecimal receitas = somar(titular.getValue(), CalculosRelatorios::receita);
            BigDecimal despesas = somar(titular.getValue(), CalculosRelatorios::despesa);
            return new RelatorioResposta.Pessoa(titular.getKey(), receitas, despesas, receitas.subtract(despesas));
        }).sorted(java.util.Comparator.comparing(RelatorioResposta.Pessoa::income).reversed()).toList();
    }

    private static List<FluxoMensal> fluxo(List<LancamentoResposta> caixa, String modo) {
        Map<YearMonth, List<LancamentoResposta>> meses = caixa.stream().collect(Collectors.groupingBy(
                lancamento -> YearMonth.from(data(lancamento, modo)), TreeMap::new, Collectors.toList()));
        return meses.entrySet().stream().map(mes -> {
            BigDecimal receitas = somar(mes.getValue(), CalculosRelatorios::receita);
            BigDecimal despesas = somar(mes.getValue(), CalculosRelatorios::despesa);
            return new FluxoMensal(mes.getKey().toString(), receitas, despesas, receitas.subtract(despesas));
        }).toList();
    }

    private static List<ProjecaoMensal> projecao(List<FluxoMensal> fluxo) {
        List<ProjecaoMensal> projecao = new ArrayList<>();
        BigDecimal acumulado = ZERO;
        for (FluxoMensal mes : fluxo) {
            acumulado = acumulado.add(mes.net());
            projecao.add(new ProjecaoMensal(mes.month(), acumulado));
        }
        return List.copyOf(projecao);
    }

    private static List<CicloPagamento> ciclos(List<LancamentoResposta> caixa, Instant agora, ZoneId fuso) {
        YearMonth mesAtual = YearMonth.from(agora.atZone(fuso));
        List<CicloPagamento> ciclos = new ArrayList<>();
        for (int metade = 0; metade < 2; metade++) {
            int inicio = metade == 0 ? 1 : 16;
            int fim = metade == 0 ? 15 : mesAtual.lengthOfMonth();
            Predicate<LancamentoResposta> noCiclo = lancamento -> despesa(lancamento) && !pago(lancamento)
                    && YearMonth.from(lancamento.dueDate()).equals(mesAtual)
                    && lancamento.dueDate().getDayOfMonth() >= inicio && lancamento.dueDate().getDayOfMonth() <= fim;
            BigDecimal pendente = somar(caixa, noCiclo);
            ciclos.add(new CicloPagamento(metade == 0 ? "first-half" : "second-half", inicio, fim,
                    pendente, caixa.stream().filter(noCiclo).count(), pendente.negate()));
        }
        return List.copyOf(ciclos);
    }

    private static LocalDate data(LancamentoResposta lancamento, String modo) {
        return "competence".equals(modo) ? lancamento.competenceDate() : lancamento.dueDate();
    }

    private static boolean receita(LancamentoResposta lancamento) {
        return "income".equals(lancamento.kind());
    }

    private static boolean despesa(LancamentoResposta lancamento) {
        return "expense".equals(lancamento.kind());
    }

    private static boolean pago(LancamentoResposta lancamento) {
        return "paid".equals(lancamento.status());
    }

    static BigDecimal somar(List<LancamentoResposta> lancamentos, Predicate<LancamentoResposta> filtro) {
        return lancamentos.stream().filter(filtro).map(LancamentoResposta::amount)
                .map(CalculosRelatorios::dinheiro).reduce(ZERO, BigDecimal::add);
    }

    static BigDecimal dinheiro(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    static BigDecimal percentual(BigDecimal valor, BigDecimal limite) {
        return limite == null || limite.signum() <= 0 ? ZERO
                : valor.multiply(BigDecimal.valueOf(100)).divide(limite, 6, RoundingMode.HALF_UP);
    }
}
