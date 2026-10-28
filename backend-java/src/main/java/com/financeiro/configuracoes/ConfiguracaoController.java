package com.financeiro.configuracoes;

import java.util.Map;

import com.financeiro.configuracoes.ConfiguracaoRequisicao.EstadoIntroducao;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.PreferenciasPainel;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Tema;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfiguracaoController {
    private final ConfiguracaoService service;

    public ConfiguracaoController(ConfiguracaoService service) {
        this.service = service;
    }

    @GetMapping("/api/settings")
    public Map<String, ConfiguracaoResposta> buscar() {
        return Map.of("settings", service.buscar());
    }

    @PutMapping("/api/settings")
    public Map<String, ConfiguracaoResposta> atualizar(@Valid @RequestBody ConfiguracaoRequisicao requisicao) {
        return Map.of("settings", service.atualizar(requisicao));
    }

    @PostMapping("/api/settings/theme")
    public Map<String, ConfiguracaoResposta> salvarTema(@Valid @RequestBody Tema requisicao) {
        return Map.of("settings", service.salvarTema(requisicao));
    }

    @PostMapping("/api/settings/dashboard")
    public Map<String, ConfiguracaoResposta> salvarPainel(@Valid @RequestBody PreferenciasPainel requisicao) {
        return Map.of("settings", service.salvarPainel(requisicao));
    }

    @PostMapping("/api/onboarding/state")
    public Map<String, ConfiguracaoResposta> salvarIntroducao(@Valid @RequestBody EstadoIntroducao requisicao) {
        return Map.of("settings", service.salvarIntroducao(requisicao.onboarding()));
    }
}
