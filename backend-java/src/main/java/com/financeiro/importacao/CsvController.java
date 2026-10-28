package com.financeiro.importacao;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import/csv")
public class CsvController {
    private final CsvService service;

    public CsvController(CsvService service) {
        this.service = service;
    }

    @PostMapping("/preview")
    public CsvService.Previa prever(@Valid @RequestBody CsvRequisicao requisicao) {
        return service.prever(requisicao);
    }

    @PostMapping
    public CsvService.Resultado importar(@Valid @RequestBody CsvRequisicao requisicao) {
        return service.importar(requisicao);
    }
}
