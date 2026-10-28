package com.financeiro.lancamentos;

import java.util.List;

public record PaginaLancamentos(List<LancamentoResposta> entries, int page, int size,
        long totalElements, int totalPages) {
}
