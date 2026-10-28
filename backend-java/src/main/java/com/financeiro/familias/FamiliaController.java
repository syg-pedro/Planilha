package com.financeiro.familias;

import java.util.List;
import java.util.Map;

import com.financeiro.seguranca.AutenticacaoRequisicao;
import com.financeiro.seguranca.SegurancaService;
import com.financeiro.seguranca.SessaoResposta;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FamiliaController {
    private final FamiliaService service;
    private final SegurancaService seguranca;

    public FamiliaController(FamiliaService service, SegurancaService seguranca) {
        this.service = service;
        this.seguranca = seguranca;
    }

    @GetMapping("/api/families")
    public Map<String, List<FamiliaResposta>> listar() {
        return Map.of("families", service.listar());
    }

    @PostMapping("/api/families/select")
    public SessaoResposta selecionar(@Valid @RequestBody AutenticacaoRequisicao.Selecao requisicao) {
        return seguranca.selecionar(requisicao.id()).resposta();
    }

    @GetMapping("/api/families/members")
    public Map<String, List<FamiliaRepository.Membro>> membros() {
        return Map.of("members", service.membros());
    }

    @DeleteMapping("/api/families/members/{userId}")
    public ResponseEntity<Void> removerMembro(@PathVariable String userId) {
        service.removerMembro(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/families/invitations")
    public Map<String, List<FamiliaService.ConviteResposta>> convites() {
        return Map.of("invitations", service.convites());
    }

    @PostMapping("/api/families/invitations")
    public FamiliaService.NovoConvite convidar(@Valid @RequestBody FamiliaRequisicao.Convite requisicao) {
        return service.convidar(requisicao);
    }

    @PostMapping("/api/families/invitations/accept")
    public Map<String, FamiliaResposta> aceitar(@Valid @RequestBody FamiliaRequisicao.Aceite requisicao) {
        return Map.of("family", service.aceitar(requisicao.token()));
    }

    @DeleteMapping("/api/families/invitations/{id}")
    public ResponseEntity<Void> revogar(@PathVariable String id) {
        service.revogar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/me/household")
    public Map<String, Object> familiaAtual() {
        return service.familiaAtual();
    }
}
