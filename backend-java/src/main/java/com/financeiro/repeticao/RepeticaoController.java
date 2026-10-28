package com.financeiro.repeticao;

import java.util.List;
import java.util.Map;

import com.financeiro.lancamentos.LancamentoResposta;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RepeticaoController {
    private final RepeticaoService service;

    public RepeticaoController(RepeticaoService service) {
        this.service = service;
    }

    @PostMapping("/api/entries/repeat")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, List<LancamentoResposta>> criar(@Valid @RequestBody RepeticaoRequisicao requisicao) {
        return Map.of("entries", service.criar(requisicao));
    }
}
