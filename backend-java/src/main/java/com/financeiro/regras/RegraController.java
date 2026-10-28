package com.financeiro.regras;

import java.net.URI;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rules")
public class RegraController {
    private final RegraService service;

    public RegraController(RegraService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, List<RegraResposta>> listar() {
        return Map.of("rules", service.listar());
    }

    @GetMapping("/{id}")
    public RegraResposta buscar(@PathVariable String id) {
        return service.buscar(id);
    }

    @PostMapping
    public ResponseEntity<RegraResposta> criar(@Valid @RequestBody RegraRequisicao requisicao) {
        RegraResposta regra = service.criar(requisicao);
        return ResponseEntity.created(URI.create("/api/rules/" + regra.id())).body(regra);
    }

    @PutMapping("/{id}")
    public RegraResposta atualizar(@PathVariable String id, @Valid @RequestBody RegraRequisicao requisicao) {
        return service.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rebuild")
    public ReconstrucaoResposta reconstruir(@Valid @RequestBody(required = false) ReconstrucaoRequisicao requisicao) {
        return service.reconstruir(requisicao == null ? null : requisicao.months());
    }
}
