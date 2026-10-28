package com.financeiro.relatorios;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import com.financeiro.categorias.CategoriaService;
import com.financeiro.configuracoes.ConfiguracaoResposta;
import com.financeiro.configuracoes.ConfiguracaoService;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.lancamentos.LancamentoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class RelatorioServiceTest {
    private final LancamentoService lancamentos = mock(LancamentoService.class);
    private final ContaService contas = mock(ContaService.class);
    private final CategoriaService categorias = mock(CategoriaService.class);
    private final ConfiguracaoService configuracoes = mock(ConfiguracaoService.class);
    private final RelatorioService service = new RelatorioService(lancamentos, contas,
            Clock.fixed(Instant.parse("2026-11-01T01:00:00Z"), ZoneOffset.UTC), categorias, configuracoes);

    @BeforeEach
    void preparar() {
        ConfiguracaoResposta configuracao = mock(ConfiguracaoResposta.class);
        when(configuracao.timezone()).thenReturn("America/Sao_Paulo");
        when(configuracoes.buscar()).thenReturn(configuracao);
        when(contas.listar()).thenReturn(List.of());
        when(categorias.listar()).thenReturn(List.of());
    }

    @Test
    void limitaRelatorioAoPeriodoAtualNoFusoLocalSemIncluirFuturo() {
        when(lancamentos.listar()).thenReturn(List.of(
                lancamento("anterior", "2026-07-31", "2026-07-31"),
                lancamento("inicio", "2026-08-01", "2026-08-01"),
                lancamento("competencia", "2026-11-01", "2026-10-31"),
                lancamento("futuro", "2027-01-01", "2027-01-01")));
        var vencimento = service.resumir(consulta("due_date"), "quarter");
        var competencia = service.resumir(consulta("competence"), "quarter");

        assertThat(vencimento.kpis().totalExpense()).isEqualByComparingTo("0.10");
        assertThat(competencia.kpis().totalExpense()).isEqualByComparingTo("0.20");
        assertThat(service.resumir(consulta("due_date")).kpis().totalExpense()).isEqualByComparingTo("0.40");
    }

    @Test
    void escolheAnoAtualComClockERejeitaParametrosInvalidos() {
        when(lancamentos.listar()).thenReturn(List.of());
        assertThat(service.planejar(null, consulta("due_date")).rows().get(9).isCurrentMonth()).isTrue();
        assertThatThrownBy(() -> service.planejar(0, consulta("due_date")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> service.resumir(consulta("due_date"), "futuro"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    private static ConsultaRelatorio consulta(String modo) {
        return new ConsultaRelatorio(null, null, modo, null, null, null, null, null);
    }

    private static LancamentoResposta lancamento(String id, String vencimento, String competencia) {
        return new LancamentoResposta(id, "local-demo", null, null, null, id, "", new BigDecimal("0.10"),
                "expense", LocalDate.parse(vencimento), LocalDate.parse(competencia), null, null,
                "pending", "manual", false, Map.of(), Instant.EPOCH, Instant.EPOCH);
    }
}
