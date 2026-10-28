package com.financeiro.desejos;

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
@RequestMapping("/api/wishlist")
public class DesejoController {
    private final DesejoService service;

    public DesejoController(DesejoService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, List<DesejoResposta>> listar() {
        return Map.of("items", service.listar());
    }

    @GetMapping("/{id}")
    public DesejoResposta buscar(@PathVariable String id) {
        return service.buscar(id);
    }

    @PostMapping
    public ResponseEntity<DesejoResposta> criar(@Valid @RequestBody DesejoRequisicao requisicao) {
        DesejoResposta desejo = service.criar(requisicao);
        return ResponseEntity.created(URI.create("/api/wishlist/" + desejo.id())).body(desejo);
    }

    @PutMapping("/{id}")
    public DesejoResposta atualizar(@PathVariable String id, @Valid @RequestBody DesejoRequisicao requisicao) {
        return service.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
