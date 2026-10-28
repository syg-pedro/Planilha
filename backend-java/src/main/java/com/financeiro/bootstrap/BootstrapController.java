package com.financeiro.bootstrap;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BootstrapController {
    private final BootstrapService service;

    public BootstrapController(BootstrapService service) {
        this.service = service;
    }

    @GetMapping("/api/bootstrap")
    public BootstrapResposta carregar() {
        return service.carregar();
    }
}
