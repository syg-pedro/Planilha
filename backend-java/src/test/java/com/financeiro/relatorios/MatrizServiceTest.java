package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import com.financeiro.configuracoes.ConfiguracaoResposta;
import com.financeiro.configuracoes.ConfiguracaoService;
import com.financeiro.contas.ContaResposta;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.lancamentos.LancamentoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MatrizServiceTest {
    private final ContaService contas = mock(ContaService.class);
    private final LancamentoService lancamentos = mock(LancamentoService.class);
    private final ConfiguracaoService configuracoes = mock(ConfiguracaoService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2028-01-01T01:00:00Z"), ZoneOffset.UTC);
    private final MatrizService service = new MatrizService(contas, lancamentos, configuracoes, clock);

    @BeforeEach
    void configurar() {
        ConfiguracaoResposta configuracao = mock(ConfiguracaoResposta.class);
        when(configuracao.timezone()).thenReturn("America/Sao_Paulo");
        when(configuracao.periodMode()).thenReturn("competence");
        when(configuracoes.buscar()).thenReturn(configuracao);
    }

    @Test
    void defaultsRespeitamFusoECriterioDaFamiliaNaViradaDoAno() {
        when(contas.listar()).thenReturn(List.of());
        when(lancamentos.listar()).thenReturn(List.of(entrada("entry-ficticio", BigDecimal.ONE)));

        var resposta = service.consultar(new ConsultaMatriz(null, null, null, null, null, null, null));

        assertThat(resposta.months()).hasSize(12).startsWith("2027-12").endsWith("2028-11");
        assertThat(resposta.summaries().get("2027-12").expense()).isEqualByComparingTo("1.00");
        assertThat(resposta.summaries().get("2028-01").expense()).isEqualByComparingTo("0.00");
    }

    @Test
    void filtraAntesDeSomarEMantemCompromissoGlobalDoCartao() {
        var cartao = new ContaResposta("card-ficticio", "fixture-family", "Cartão fictício", "", "credit_card",
                new BigDecimal("100.00"), null, 28, true);
        var atual = entrada("entry-atual", new BigDecimal("10.00"));
        var futuro = new LancamentoResposta("entry-futuro", atual.householdId(), null, atual.accountId(), null,
                "Futuro", "", new BigDecimal("30.00"), "expense", LocalDate.of(2030, 1, 28),
                LocalDate.of(2030, 1, 28), null, null, "review", "manual", false, null, atual.createdAt(), atual.updatedAt());
        when(contas.listar()).thenReturn(List.of(cartao));
        when(lancamentos.listar()).thenReturn(List.of(atual, futuro));

        var resposta = service.consultar(new ConsultaMatriz("2028-01", 1, "due_date", cartao.id(), "expense", "pending", ""));

        assertThat(resposta.totals().expense()).isEqualByComparingTo("10.00");
        assertThat(resposta.cardCommitments().get(cartao.id()).committed()).isEqualByComparingTo("40.00");
        assertThat(resposta.cardCommitments().get(cartao.id()).available()).isEqualByComparingTo("60.00");
        assertThat(resposta.rows()).singleElement().satisfies(linha -> assertThat(linha.entries()).containsExactly(atual));
    }

    @Test
    void cartaoVazioSoApareceSemFiltrosEZeroMantemRegistro() {
        var cartao = new ContaResposta("empty", "fixture-family", "Cartão vazio", "", "credit_card",
                null, null, 28, true);
        when(contas.listar()).thenReturn(List.of(cartao));
        when(lancamentos.listar()).thenReturn(List.of());

        var geral = service.consultar(new ConsultaMatriz("2028-01", 1, "due_date", null, null, null, null));
        var filtrado = service.consultar(new ConsultaMatriz("2028-01", 1, "due_date", null, null, null, "inexistente"));

        assertThat(geral.rows()).hasSize(1);
        assertThat(geral.rows().getFirst().cells().get("2028-01").status()).isNull();
        assertThat(filtrado.rows()).isEmpty();
        assertThat(CalculosMatriz.valor(List.of(entrada("zero", BigDecimal.ZERO))).status()).isEqualTo("pending");
        assertThat(CalculosMatriz.valor(List.of(entrada("zero", BigDecimal.ZERO))).entries()).hasSize(1);
    }

    private LancamentoResposta entrada(String id, BigDecimal valor) {
        return new LancamentoResposta(id, "fixture-family", null, "card-ficticio", null, "Despesa fictícia", "",
                valor, "expense", LocalDate.of(2028, 1, 28), LocalDate.of(2027, 12, 28),
                null, null, "pending", "manual", false, null, Instant.EPOCH, Instant.EPOCH);
    }
}
