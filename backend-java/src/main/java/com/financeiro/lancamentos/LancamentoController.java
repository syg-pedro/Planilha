package com.financeiro.lancamentos;

import java.net.URI;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/entries")
public class LancamentoController {
    private final LancamentoService service;

    public LancamentoController(LancamentoService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, List<LancamentoResposta>> listar() {
        return Map.of("entries", service.listar());
    }

    @GetMapping("/{id}")
    public LancamentoResposta buscar(@PathVariable String id) {
        return service.buscar(id);
    }

    @GetMapping("/page")
    public PaginaLancamentos paginar(@Valid @ModelAttribute ConsultaLancamentos consulta) {
        return service.paginar(consulta);
    }

    @PostMapping
    public ResponseEntity<LancamentoResposta> criar(@Valid @RequestBody LancamentoRequisicao requisicao) {
        LancamentoResposta lancamento = service.criar(requisicao);
        return ResponseEntity.created(URI.create("/api/entries/" + lancamento.id())).body(lancamento);
    }

    @PutMapping("/{id}")
    public LancamentoResposta atualizar(@PathVariable String id, @Valid @RequestBody LancamentoRequisicao requisicao) {
        return service.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
