package com.financeiro.relatorios;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class RelatorioController {
    private final RelatorioService service;

    public RelatorioController(RelatorioService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public RelatorioResposta resumir(@Valid @ModelAttribute ConsultaRelatorio consulta,
            @RequestParam(required = false) String period) {
        return service.resumir(consulta, period);
    }

    @GetMapping("/annual-plan")
    public PlanejamentoResposta planejar(@RequestParam(required = false) Integer year,
            @Valid @ModelAttribute ConsultaRelatorio consulta) {
        return service.planejar(year, consulta);
    }

    @GetMapping("/debts")
    public DividasResposta dividas(@Valid @ModelAttribute ConsultaRelatorio consulta) {
        return service.dividas(consulta);
    }
}
