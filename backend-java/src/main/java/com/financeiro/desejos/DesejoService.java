package com.financeiro.desejos;

import com.financeiro.seguranca.ContextoFamilia;

import java.math.RoundingMode;
import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class DesejoService {
    private final ContextoFamilia contexto;
    private final DesejoRepository repository;
    private final Clock clock;

    public DesejoService(DesejoRepository repository, Clock clock, ContextoFamilia contexto) {
        this.contexto = contexto;
        this.repository = repository;
        this.clock = clock;
    }

    public List<DesejoResposta> listar() {
        return repository.listarPorFamilia(contexto.familiaId()).stream().map(DesejoResposta::de).toList();
    }

    public DesejoResposta buscar(String id) {
        return DesejoResposta.de(exigirDesejo(id));
    }

    @Transactional
    public DesejoResposta criar(DesejoRequisicao requisicao) {
        Desejo desejo = new Desejo();
        desejo.id = "wish-" + UUID.randomUUID();
        desejo.grupoFamiliarId = contexto.familiaId();
        desejo.criadoEm = clock.instant().truncatedTo(ChronoUnit.MICROS);
        aplicar(desejo, requisicao);
        return DesejoResposta.de(repository.save(desejo));
    }

    @Transactional
    public DesejoResposta atualizar(String id, DesejoRequisicao requisicao) {
        Desejo desejo = exigirDesejo(id);
        aplicar(desejo, requisicao);
        return DesejoResposta.de(repository.save(desejo));
    }

    @Transactional
    public void excluir(String id) {
        repository.delete(exigirDesejo(id));
    }

    private Desejo exigirDesejo(String id) {
        return repository.buscarPorIdEFamilia(id, contexto.familiaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Desejo não encontrado."));
    }

    private void aplicar(Desejo desejo, DesejoRequisicao requisicao) {
        desejo.nome = requisicao.name();
        desejo.preco = requisicao.price() == null ? null : requisicao.price().setScale(2, RoundingMode.UNNECESSARY);
        desejo.url = requisicao.url();
        desejo.imagemUrl = requisicao.imageUrl();
        desejo.observacoes = requisicao.notes();
        desejo.categoria = requisicao.category();
        if (requisicao.priority() != null) desejo.prioridade = requisicao.priority();
        if (requisicao.status() != null) desejo.estado = requisicao.status();
        desejo.atualizadoEm = clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
