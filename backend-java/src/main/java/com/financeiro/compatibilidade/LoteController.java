package com.financeiro.compatibilidade;

import java.util.List;
import java.util.Map;

import com.financeiro.contas.ContaRequisicao;
import com.financeiro.contas.ContaResposta;
import com.financeiro.desejos.DesejoRequisicao;
import com.financeiro.desejos.DesejoResposta;
import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.regras.RegraRequisicao;
import com.financeiro.regras.RegraResposta;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/legacy")
public class LoteController {
    private final LoteService service;

    public LoteController(LoteService service) {
        this.service = service;
    }

    @PostMapping("/accounts/batch")
    public Map<String, List<ContaResposta>> contas(@Valid @RequestBody LoteRequisicao<ContaRequisicao> lote) {
        return Map.of("accounts", service.salvarContas(lote));
    }

    @PostMapping("/entries/batch")
    public Map<String, List<LancamentoResposta>> lancamentos(@Valid @RequestBody LoteRequisicao<LancamentoRequisicao> lote) {
        return Map.of("entries", service.salvarLancamentos(lote));
    }

    @PostMapping("/rules/batch")
    public Map<String, List<RegraResposta>> regras(@Valid @RequestBody LoteRequisicao<RegraRequisicao> lote) {
        return Map.of("rules", service.salvarRegras(lote));
    }

    @PostMapping("/wishlist/batch")
    public Map<String, List<DesejoResposta>> desejos(@Valid @RequestBody LoteRequisicao<DesejoRequisicao> lote) {
        return Map.of("items", service.salvarDesejos(lote));
    }
}
