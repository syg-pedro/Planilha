package com.financeiro.categorias;

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
@RequestMapping("/api/categories")
public class CategoriaController {
    private final CategoriaService service;

    public CategoriaController(CategoriaService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, List<CategoriaResposta>> listar() {
        return Map.of("categories", service.listar());
    }

    @GetMapping("/{id}")
    public CategoriaResposta buscar(@PathVariable String id) {
        return service.buscar(id);
    }

    @PostMapping
    public ResponseEntity<CategoriaResposta> criar(@Valid @RequestBody CategoriaRequisicao requisicao) {
        CategoriaResposta categoria = service.criar(requisicao);
        return ResponseEntity.created(URI.create("/api/categories/" + categoria.id())).body(categoria);
    }

    @PutMapping("/{id}")
    public CategoriaResposta atualizar(@PathVariable String id, @Valid @RequestBody CategoriaRequisicao requisicao) {
        return service.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
