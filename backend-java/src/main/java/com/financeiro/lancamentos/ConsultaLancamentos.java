package com.financeiro.lancamentos;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

public record ConsultaLancamentos(@Min(0) @Max(1000000) Integer page, @Min(1) @Max(100) Integer size,
        @Pattern(regexp = "date_asc|date_desc|amount_desc") String sort,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @Pattern(regexp = "due_date|competence") String periodMode,
        @Size(max = 64) String accountId, @Size(max = 64) String categoryId,
        @Pattern(regexp = "all|income|expense") String kind,
        @Pattern(regexp = "all|pending|paid|review") String status, @Size(max = 200) String search) {
    public ConsultaLancamentos {
        page = page == null ? 0 : page;
        size = size == null ? 25 : size;
        sort = sort == null ? "date_asc" : sort;
        periodMode = periodMode == null ? "due_date" : periodMode;
        accountId = accountId == null ? "" : accountId.trim();
        categoryId = categoryId == null ? "" : categoryId.trim();
        kind = kind == null ? "all" : kind;
        status = status == null ? "all" : status;
        search = search == null ? "" : search.trim();
    }

    @AssertTrue(message = "A data final deve ser igual ou posterior à inicial.")
    public boolean isPeriodoValido() {
        return from == null || to == null || !to.isBefore(from);
    }
}
