package com.financeiro.desejos;

import java.math.BigDecimal;
import java.time.Instant;

public record DesejoResposta(String id, String householdId, String name, BigDecimal price, String url,
        String imageUrl, String notes, String priority, String status, String category,
        Instant createdAt, Instant updatedAt) {
    static DesejoResposta de(Desejo desejo) {
        return new DesejoResposta(desejo.id, desejo.grupoFamiliarId, desejo.nome, desejo.preco, desejo.url,
                desejo.imagemUrl, desejo.observacoes, desejo.prioridade, desejo.estado, desejo.categoria,
                desejo.criadoEm, desejo.atualizadoEm);
    }
}
