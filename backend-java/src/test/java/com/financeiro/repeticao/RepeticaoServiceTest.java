package com.financeiro.repeticao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.lancamentos.LancamentoService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class RepeticaoServiceTest {
    @Test
    void preservaCentavosEStatusInicialERepeteSemDesviarDiaOriginal() {
        var lancamentos = mock(LancamentoService.class);
        when(lancamentos.criar(any())).thenReturn(mock(LancamentoResposta.class));
        var base = new LancamentoRequisicao(null, null, null, "Fictício", "", new BigDecimal("0.10"),
                "expense", LocalDate.of(2028, 1, 31), LocalDate.of(2028, 1, 30),
                null, null, "paid", "manual", false, null);
        var resultado = new RepeticaoService(lancamentos).criar(new RepeticaoRequisicao(base, 3));
        var enviados = ArgumentCaptor.forClass(LancamentoRequisicao.class);
        verify(lancamentos, times(3)).criar(enviados.capture());
        assertThat(resultado).hasSize(3);
        assertThat(enviados.getAllValues()).extracting(LancamentoRequisicao::dueDate)
                .containsExactly(LocalDate.of(2028, 1, 31), LocalDate.of(2028, 2, 29), LocalDate.of(2028, 3, 31));
        assertThat(enviados.getAllValues()).extracting(LancamentoRequisicao::competenceDate)
                .containsExactly(LocalDate.of(2028, 1, 30), LocalDate.of(2028, 2, 29), LocalDate.of(2028, 3, 30));
        assertThat(enviados.getAllValues()).extracting(LancamentoRequisicao::status).containsExactly("paid", "pending", "pending");
        assertThat(enviados.getAllValues()).allSatisfy(item -> assertThat(item.amount()).isEqualByComparingTo("0.10"));
    }
}
