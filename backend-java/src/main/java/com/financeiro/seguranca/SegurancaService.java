package com.financeiro.seguranca;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

import com.financeiro.familias.FamiliaRepository;
import com.financeiro.familias.FamiliaResposta;
import com.financeiro.familias.FamiliaService;
import com.financeiro.seguranca.SegurancaRepository.Sessao;
import com.financeiro.seguranca.SegurancaRepository.Usuario;
import com.financeiro.seguranca.SessaoResposta.UsuarioResposta;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SegurancaService {
    public static final String EMISSOR = "http://127.0.0.1:8080/financeiro-lab";
    public static final String AUDIENCIA = "financeiro-lab";
    public record Resultado(SessaoResposta resposta, String refreshToken, Instant sessaoExpiraEm) {
    }

    private final SegurancaRepository repository;
    private final FamiliaRepository familias;
    private final FamiliaService familiaService;
    private final ContextoFamilia contexto;
    private final PasswordEncoder senhas;
    private final AuthenticationManager autenticacao;
    private final JwtEncoder tokens;
    private final Clock clock;
    private final ControleLogin tentativas;

    public SegurancaService(SegurancaRepository repository, FamiliaRepository familias, FamiliaService familiaService,
            ContextoFamilia contexto, PasswordEncoder senhas, AuthenticationManager autenticacao, JwtEncoder tokens,
            Clock clock, ControleLogin tentativas) {
        this.repository = repository;
        this.familias = familias;
        this.familiaService = familiaService;
        this.contexto = contexto;
        this.senhas = senhas;
        this.autenticacao = autenticacao;
        this.tokens = tokens;
        this.clock = clock;
        this.tentativas = tentativas;
    }

    @Transactional
    public Resultado cadastrar(AutenticacaoRequisicao.Cadastro requisicao) {
        validarSenha(requisicao.password());
        String email = requisicao.email().trim().toLowerCase(Locale.ROOT);
        if (repository.buscarPorEmail(email).isPresent()) throw cadastroInvalido();
        Usuario usuario = new Usuario("user-" + UUID.randomUUID(), requisicao.name(), email,
                senhas.encode(requisicao.password()), true);
        try {
            repository.criarUsuario(usuario, agora());
        } catch (DuplicateKeyException exception) {
            throw cadastroInvalido();
        }
        FamiliaResposta familia = familiaService.criarParaUsuario(usuario.id(), requisicao.familyName());
        return iniciar(usuario, familia);
    }

    @Transactional
    public Resultado entrar(AutenticacaoRequisicao.Login requisicao) {
        validarSenha(requisicao.password());
        String email = requisicao.email().trim().toLowerCase(Locale.ROOT);
        tentativas.registrar(email);
        try {
            autenticacao.authenticate(new UsernamePasswordAuthenticationToken(email, requisicao.password()));
        } catch (AuthenticationException exception) {
            throw semSessao();
        }
        Usuario usuario = repository.buscarPorEmail(email).orElseThrow(this::semSessao);
        tentativas.sucesso(email);
        FamiliaResposta familia = familiaDisponivel(usuario);
        return iniciar(usuario, familia);
    }

    @Transactional
    public Resultado renovar(String token) {
        if (token == null || token.length() > 128) throw semSessao();
        Sessao sessao = repository.bloquearRefresh(TokensLocais.hash(token)).orElseThrow(this::semSessao);
        Usuario usuario = repository.buscarUsuario(sessao.usuarioId()).orElseThrow(this::semSessao);
        if (!usuario.ativo() || !sessao.ativa(agora())) throw semSessao();
        FamiliaResposta familia = familias.buscarVinculo(usuario.id(), sessao.familiaId())
                .orElseGet(() -> familiaDisponivel(usuario));
        String novoToken = TokensLocais.gerar();
        repository.renovarRefresh(sessao.id(), TokensLocais.hash(novoToken));
        if (!familia.id().equals(sessao.familiaId())) repository.selecionarFamilia(sessao.id(), familia.id());
        return resultado(usuario, sessao, familia, novoToken);
    }

    @Transactional(readOnly = true)
    public SessaoResposta.Atual atual() {
        Usuario usuario = repository.buscarUsuario(contexto.usuarioId()).orElseThrow(this::semSessao);
        FamiliaResposta familia = familias.buscarVinculo(usuario.id(), contexto.familiaId()).orElseThrow(this::semSessao);
        return new SessaoResposta.Atual(respostaUsuario(usuario), familia);
    }

    @Transactional
    public Resultado selecionar(String familiaId) {
        Usuario usuario = repository.buscarUsuario(contexto.usuarioId()).orElseThrow(this::semSessao);
        Sessao sessao = repository.bloquearSessao(contexto.sessaoId()).orElseThrow(this::semSessao);
        FamiliaResposta familia = familias.buscarVinculo(usuario.id(), familiaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não tem acesso a esta família."));
        repository.selecionarFamilia(sessao.id(), familiaId);
        return resultado(usuario, sessao, familia, null);
    }

    @Transactional
    public void sair() {
        repository.revogarSessao(contexto.sessaoId(), agora());
    }

    private Resultado iniciar(Usuario usuario, FamiliaResposta familia) {
        String refresh = TokensLocais.gerar();
        Sessao sessao = new Sessao("session-" + UUID.randomUUID(), usuario.id(), familia.id(),
                TokensLocais.hash(refresh), agora().plus(7, ChronoUnit.DAYS), null);
        repository.criarSessao(sessao, agora());
        return resultado(usuario, sessao, familia, refresh);
    }

    private FamiliaResposta familiaDisponivel(Usuario usuario) {
        return familias.listar(usuario.id()).stream().findFirst().orElseGet(() -> {
            Usuario atual = repository.bloquearUsuario(usuario.id()).orElseThrow(this::semSessao);
            if (!atual.ativo()) throw semSessao();
            return familias.listar(usuario.id()).stream().findFirst()
                    .orElseGet(() -> familiaService.criarParaUsuario(usuario.id(), "Minha família"));
        });
    }

    private Resultado resultado(Usuario usuario, Sessao sessao, FamiliaResposta familia, String refresh) {
        Instant expira = agora().plus(15, ChronoUnit.MINUTES);
        if (sessao.expiraEm().isBefore(expira)) expira = sessao.expiraEm();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(EMISSOR).subject(usuario.id())
                .audience(java.util.List.of(AUDIENCIA)).issuedAt(agora()).expiresAt(expira)
                .claim("sid", sessao.id()).claim("hid", familia.id()).build();
        String token = tokens.encode(JwtEncoderParameters.from(JwsHeader.with(SignatureAlgorithm.RS256).build(), claims))
                .getTokenValue();
        return new Resultado(new SessaoResposta(token, expira, respostaUsuario(usuario), familia),
                refresh, sessao.expiraEm());
    }

    private UsuarioResposta respostaUsuario(Usuario usuario) {
        return new UsuarioResposta(usuario.id(), usuario.nome(), usuario.email());
    }

    private void validarSenha(String senha) {
        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use uma senha com até 72 bytes.");
        }
    }

    private Instant agora() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }

    private ResponseStatusException cadastroInvalido() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Não foi possível cadastrar estes dados.");
    }

    private ResponseStatusException semSessao() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
    }
}
