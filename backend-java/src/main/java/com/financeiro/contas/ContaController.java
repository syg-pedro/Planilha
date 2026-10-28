package com.financeiro.contas;

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
@RequestMapping("/api/accounts")
public class ContaController {
    private final ContaService service;

    public ContaController(ContaService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, List<ContaResposta>> listar() {
        return Map.of("accounts", service.listar());
    }

    @GetMapping("/{id}")
    public ContaResposta buscar(@PathVariable String id) {
        return service.buscar(id);
    }

    @PostMapping
    public ResponseEntity<ContaResposta> criar(@Valid @RequestBody ContaRequisicao requisicao) {
        ContaResposta conta = service.criar(requisicao);
        return ResponseEntity.created(URI.create("/api/accounts/" + conta.id())).body(conta);
    }

    @PutMapping("/{id}")
    public ContaResposta atualizar(@PathVariable String id, @Valid @RequestBody ContaRequisicao requisicao) {
        return service.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
