package com.financeiro.familias;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.financeiro.seguranca.ContextoFamilia;
import com.financeiro.seguranca.SegurancaRepository;
import com.financeiro.seguranca.TokensLocais;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class FamiliaService {
    public record NovoConvite(String token, Instant expiresAt) {
    }

    public record ConviteResposta(String id, String email, String role, Instant expiresAt, Instant createdAt) {
    }

    private final FamiliaRepository repository;
    private final SegurancaRepository seguranca;
    private final ContextoFamilia contexto;
    private final Clock clock;

    public FamiliaService(FamiliaRepository repository, SegurancaRepository seguranca, ContextoFamilia contexto, Clock clock) {
        this.repository = repository;
        this.seguranca = seguranca;
        this.contexto = contexto;
        this.clock = clock;
    }

    public List<FamiliaResposta> listar() {
        return repository.listar(contexto.usuarioId());
    }

    @Transactional
    public FamiliaResposta criarParaUsuario(String usuarioId, String nome) {
        String id = "hh-" + UUID.randomUUID();
        Instant agora = agora();
        repository.criar(id, nome, agora);
        repository.adicionarMembro(usuarioId, id, "owner", agora);
        return new FamiliaResposta(id, nome, "owner");
    }

    public List<FamiliaRepository.Membro> membros() {
        return repository.membros(contexto.familiaId());
    }

    public List<ConviteResposta> convites() {
        if (!contexto.proprietario()) throw proibido();
        return convites(contexto.familiaId());
    }

    public Map<String, Object> familiaAtual() {
        return Map.of("householdId", contexto.familiaId(), "members", membros(),
                "invitations", contexto.proprietario() ? convites() : List.of());
    }

    @Transactional
    public NovoConvite convidar(FamiliaRequisicao.Convite requisicao) {
        String familiaId = exigirProprietario();
        String email = requisicao.email().toLowerCase(Locale.ROOT);
        seguranca.buscarPorEmail(email).ifPresent(usuario -> {
            if (repository.buscarVinculo(usuario.id(), familiaId).isPresent()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta pessoa já participa da família.");
            }
        });
        String token = TokensLocais.gerar();
        Instant agora = agora();
        Instant expira = agora.plus(7, ChronoUnit.DAYS);
        repository.criarConvite("inv-" + UUID.randomUUID(), familiaId, email, requisicao.role(),
                TokensLocais.hash(token), expira, agora);
        return new NovoConvite(token, expira);
    }

    @Transactional
    public FamiliaResposta aceitar(String token) {
        String usuarioId = contexto.usuarioId();
        var usuario = seguranca.buscarUsuario(usuarioId).orElseThrow(this::proibido);
        String hash = TokensLocais.hash(token);
        var referencia = repository.buscarPorToken(hash).orElseThrow(this::conviteInvalido);
        repository.bloquearFamilia(referencia.familiaId());
        var convite = repository.bloquearConvite(hash).orElseThrow(this::conviteInvalido);
        if (!convite.disponivel(agora())) throw conviteInvalido();
        if (!usuario.email().equals(convite.email())) throw proibido();
        var vinculo = repository.buscarVinculo(usuarioId, convite.familiaId());
        if (vinculo.isEmpty()) {
            repository.adicionarMembro(usuarioId, convite.familiaId(), convite.role(), agora());
        }
        repository.aceitar(convite.id(), agora());
        return repository.buscarVinculo(usuarioId, convite.familiaId()).orElseThrow(this::proibido);
    }

    @Transactional
    public void revogar(String id) {
        String familiaId = exigirProprietario();
        var convite = repository.buscarConvite(id, familiaId).orElseThrow(this::conviteInvalido);
        repository.revogar(convite.id(), agora());
    }

    @Transactional
    public void removerMembro(String usuarioId) {
        String familiaId = exigirProprietario();
        var membro = repository.buscarVinculo(usuarioId, familiaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado."));
        if ("owner".equals(membro.role())
                && repository.membros(familiaId).stream().filter(item -> "owner".equals(item.role())).count() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mantenha pelo menos um proprietário na família.");
        }
        repository.removerMembro(usuarioId, familiaId);
    }

    private String exigirProprietario() {
        String familiaId = contexto.familiaId();
        repository.bloquearFamilia(familiaId);
        var vinculo = repository.buscarVinculo(contexto.usuarioId(), familiaId).orElseThrow(this::proibido);
        if (!"owner".equals(vinculo.role())) throw proibido();
        return familiaId;
    }

    private List<ConviteResposta> convites(String familiaId) {
        return repository.convites(familiaId, agora()).stream()
                .map(convite -> new ConviteResposta(convite.id(), convite.email(), convite.role(),
                        convite.expiresAt(), convite.createdAt())).toList();
    }

    private Instant agora() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }

    private ResponseStatusException proibido() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não tem permissão para esta operação.");
    }

    private ResponseStatusException conviteInvalido() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Convite inválido ou expirado.");
    }
}
