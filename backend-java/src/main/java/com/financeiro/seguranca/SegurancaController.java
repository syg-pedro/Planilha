package com.financeiro.seguranca;

import java.time.Clock;
import java.time.Duration;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class SegurancaController {
    public static final String COOKIE = "finance-java-lab-refresh";
    private final SegurancaService service;
    private final Clock clock;

    public SegurancaController(SegurancaService service, Clock clock) {
        this.service = service;
        this.clock = clock;
    }

    @PostMapping("/register")
    public ResponseEntity<SessaoResposta> cadastrar(@Valid @RequestBody AutenticacaoRequisicao.Cadastro requisicao,
            HttpServletRequest request) {
        validarOrigem(request);
        return responder(service.cadastrar(requisicao), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<SessaoResposta> entrar(@Valid @RequestBody AutenticacaoRequisicao.Login requisicao,
            HttpServletRequest request) {
        validarOrigem(request);
        return responder(service.entrar(requisicao), HttpStatus.OK);
    }

    @GetMapping("/me")
    public SessaoResposta.Atual atual() {
        return service.atual();
    }

    @PostMapping("/refresh")
    public ResponseEntity<SessaoResposta> renovar(@CookieValue(name = COOKIE, required = false) String token,
            HttpServletRequest request) {
        validarOrigem(request);
        if (!"FinanceiroLab".equals(request.getHeader("X-Requested-With"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não foi possível validar esta solicitação.");
        }
        return responder(service.renovar(token), HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> sair(HttpServletRequest request) {
        validarOrigem(request);
        service.sair();
        return ResponseEntity.noContent().header("Set-Cookie", cookie("", Duration.ZERO)).build();
    }

    private ResponseEntity<SessaoResposta> responder(SegurancaService.Resultado resultado, HttpStatus status) {
        var resposta = ResponseEntity.status(status);
        if (resultado.refreshToken() != null) {
            resposta.header("Set-Cookie", cookie(resultado.refreshToken(),
                    Duration.between(clock.instant(), resultado.sessaoExpiraEm())));
        }
        return resposta.body(resultado.resposta());
    }

    private String cookie(String token, Duration duracao) {
        return ResponseCookie.from(COOKIE, token).httpOnly(true).secure(false).sameSite("Strict")
                .path("/api/auth").maxAge(duracao).build().toString();
    }

    private void validarOrigem(HttpServletRequest request) {
        String origem = request.getHeader("Origin");
        if (origem != null && !ConfiguracaoSeguranca.ORIGENS.contains(origem)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta origem não tem acesso à sessão.");
        }
    }
}
