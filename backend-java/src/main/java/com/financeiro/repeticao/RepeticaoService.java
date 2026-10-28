package com.financeiro.repeticao;

import java.util.ArrayList;
import java.util.List;

import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.lancamentos.LancamentoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RepeticaoService {
    private final LancamentoService lancamentos;

    public RepeticaoService(LancamentoService lancamentos) {
        this.lancamentos = lancamentos;
    }

    @Transactional
    public List<LancamentoResposta> criar(RepeticaoRequisicao requisicao) {
        var base = requisicao.entry();
        List<LancamentoResposta> criados = new ArrayList<>();
        for (int indice = 0; indice < requisicao.months(); indice++) {
            var seguinte = new LancamentoRequisicao(base.ruleId(), base.accountId(), base.categoryId(),
                    base.title(), base.description(), base.amount(), base.kind(), base.dueDate().plusMonths(indice),
                    base.competenceDate().plusMonths(indice), base.installmentIndex(), base.installmentTotal(),
                    indice == 0 ? base.status() : "pending", base.origin(), base.excludeFromCalc(), base.metadata());
            criados.add(lancamentos.criar(seguinte));
        }
        return List.copyOf(criados);
    }
}
