package com.financeiro.contas;

import java.math.BigDecimal;

public record ContaResposta(
        String id,
        String householdId,
        String name,
        String owner,
        String type,
        BigDecimal limitTotal,
        Integer closingDay,
        Integer dueDay,
        boolean active) {
    static ContaResposta de(Conta conta) {
        return new ContaResposta(conta.id, conta.grupoFamiliarId, conta.nome, conta.responsavel,
                conta.tipo, conta.limiteTotal, conta.diaFechamento, conta.diaVencimento, conta.ativa);
    }
}
