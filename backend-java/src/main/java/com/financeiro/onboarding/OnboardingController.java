package com.financeiro.onboarding;

import java.util.Map;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding/import")
public class OnboardingController {
    private final OnboardingService service;

    public OnboardingController(OnboardingService service) {
        this.service = service;
    }

    @PostMapping("/preview")
    public OnboardingPrevia prever(@Valid @RequestBody OnboardingRequisicao requisicao) {
        return service.prever(requisicao);
    }

    @PostMapping
    public Map<String, OnboardingResumo> importar(@Valid @RequestBody OnboardingRequisicao requisicao) {
        return Map.of("summary", service.importar(requisicao));
    }
}
