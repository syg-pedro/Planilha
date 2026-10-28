package com.financeiro.contas;

import com.financeiro.seguranca.ContextoFamilia;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ContaService {
    private final ContextoFamilia contexto;
    private final ContaRepository repository;

    public ContaService(ContaRepository repository, ContextoFamilia contexto) {
        this.contexto = contexto;
        this.repository = repository;
    }

    public List<ContaResposta> listar() {
        return repository.listarPorFamilia(contexto.familiaId()).stream().map(ContaResposta::de).toList();
    }

    public ContaResposta buscar(String id) {
        return ContaResposta.de(exigirConta(id));
    }

    @Transactional
    public ContaResposta criar(ContaRequisicao requisicao) {
        Conta conta = new Conta();
        conta.id = "account-" + UUID.randomUUID();
        conta.grupoFamiliarId = contexto.familiaId();
        aplicar(conta, requisicao);
        return ContaResposta.de(repository.save(conta));
    }

    @Transactional
    public ContaResposta atualizar(String id, ContaRequisicao requisicao) {
        Conta conta = exigirConta(id);
        aplicar(conta, requisicao);
        return ContaResposta.de(repository.save(conta));
    }

    @Transactional
    public void excluir(String id) {
        repository.delete(exigirConta(id));
    }

    private Conta exigirConta(String id) {
        return repository.buscarPorIdEFamilia(id, contexto.familiaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta nao encontrada."));
    }

    private void aplicar(Conta conta, ContaRequisicao requisicao) {
        conta.nome = requisicao.name();
        conta.responsavel = requisicao.owner();
        conta.tipo = requisicao.type();
        boolean cartao = "credit_card".equals(requisicao.type());
        conta.limiteTotal = cartao ? requisicao.limitTotal() : null;
        conta.diaFechamento = cartao ? requisicao.closingDay() : null;
        conta.diaVencimento = cartao ? requisicao.dueDay() : null;
        if (requisicao.active() != null) {
            conta.ativa = requisicao.active();
        }
    }
}
