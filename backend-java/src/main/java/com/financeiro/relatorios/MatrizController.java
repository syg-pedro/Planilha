package com.financeiro.relatorios;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MatrizController {
    private final MatrizService service;

    public MatrizController(MatrizService service) {
        this.service = service;
    }

    @GetMapping("/api/reports/matrix")
    public MatrizResposta consultar(@Valid @ModelAttribute ConsultaMatriz consulta) {
        return service.consultar(consulta);
    }
}
