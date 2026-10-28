package com.financeiro.onboarding;

import java.util.List;

public record OnboardingPrevia(int accounts, int categories, int rules, int generatedEntries, int entries,
        List<String> warnings, boolean canImport) {
    static OnboardingPrevia de(OnboardingResumo resumo, boolean possuiDados) {
        return new OnboardingPrevia(resumo.accounts(), resumo.categories(), resumo.rules(),
                resumo.generatedEntries(), resumo.entries(),
                possuiDados ? List.of("A importação inicial está disponível apenas quando não há dados financeiros.")
                        : List.of(),
                !possuiDados);
    }
}
