package com.financeiro.seguranca;

import java.time.Clock;

import com.financeiro.familias.FamiliaRepository;
import com.financeiro.familias.FamiliaResposta;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequestScope
public class ContextoFamiliaAutenticado implements ContextoFamilia {
    private final SegurancaRepository seguranca;
    private final FamiliaRepository familias;
    private final Clock clock;
    private SegurancaRepository.Sessao sessao;
    private FamiliaResposta vinculo;

    public ContextoFamiliaAutenticado(SegurancaRepository seguranca, FamiliaRepository familias, Clock clock) {
        this.seguranca = seguranca;
        this.familias = familias;
        this.clock = clock;
    }

    @Override
    public String familiaId() {
        return vinculo().id();
    }

    @Override
    public String usuarioId() {
        return sessao().usuarioId();
    }

    @Override
    public String sessaoId() {
        return sessao().id();
    }

    @Override
    public boolean proprietario() {
        return "owner".equals(vinculo().role());
    }

    private FamiliaResposta vinculo() {
        if (vinculo == null) {
            var atual = sessao();
            vinculo = familias.buscarVinculo(atual.usuarioId(), atual.familiaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Você não tem acesso a esta família."));
        }
        return vinculo;
    }

    private SegurancaRepository.Sessao sessao() {
        if (sessao != null) return sessao;
        var autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || !(autenticacao.getPrincipal() instanceof Jwt jwt)) throw semSessao();
        var atual = seguranca.buscarSessao(jwt.getClaimAsString("sid")).orElseThrow(this::semSessao);
        var usuario = seguranca.buscarUsuario(jwt.getSubject()).orElseThrow(this::semSessao);
        if (!usuario.ativo() || !atual.ativa(clock.instant()) || !usuario.id().equals(atual.usuarioId())
                || !atual.familiaId().equals(jwt.getClaimAsString("hid"))) throw semSessao();
        sessao = atual;
        return sessao;
    }

    private ResponseStatusException semSessao() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para continuar.");
    }
}
