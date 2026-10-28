package com.financeiro.compatibilidade;

import java.util.HashSet;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;

import com.financeiro.contas.ContaRequisicao;
import com.financeiro.contas.ContaResposta;
import com.financeiro.contas.ContaService;
import com.financeiro.desejos.DesejoRequisicao;
import com.financeiro.desejos.DesejoResposta;
import com.financeiro.desejos.DesejoService;
import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.lancamentos.LancamentoService;
import com.financeiro.regras.RegraRequisicao;
import com.financeiro.regras.RegraResposta;
import com.financeiro.regras.RegraService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class LoteService {
    private final ContaService contas;
    private final LancamentoService lancamentos;
    private final RegraService regras;
    private final DesejoService desejos;

    public LoteService(ContaService contas, LancamentoService lancamentos,
            RegraService regras, DesejoService desejos) {
        this.contas = contas;
        this.lancamentos = lancamentos;
        this.regras = regras;
        this.desejos = desejos;
    }

    public List<ContaResposta> salvarContas(LoteRequisicao<ContaRequisicao> lote) {
        return aplicar(lote, contas::criar, contas::atualizar, contas::excluir, contas::listar);
    }

    public List<LancamentoResposta> salvarLancamentos(LoteRequisicao<LancamentoRequisicao> lote) {
        return aplicar(lote, lancamentos::criar, lancamentos::atualizar, lancamentos::excluir, lancamentos::listar);
    }

    public List<RegraResposta> salvarRegras(LoteRequisicao<RegraRequisicao> lote) {
        return aplicar(lote, regras::criar, regras::atualizar, regras::excluir, regras::listar);
    }

    public List<DesejoResposta> salvarDesejos(LoteRequisicao<DesejoRequisicao> lote) {
        return aplicar(lote, desejos::criar, desejos::atualizar, desejos::excluir, desejos::listar);
    }

    private <T, R> List<R> aplicar(LoteRequisicao<T> lote, Function<T, R> criar,
            BiFunction<String, T, R> atualizar, Consumer<String> excluir, Supplier<List<R>> listar) {
        var identidades = new HashSet<String>();
        for (var alteracao : lote.upserts()) {
            if (alteracao.id() != null && !identidades.add(alteracao.id())) throw repeticao();
        }
        for (String id : lote.deletes()) if (!identidades.add(id)) throw repeticao();
        for (var alteracao : lote.upserts()) {
            if (alteracao.id() == null) criar.apply(alteracao.data());
            else atualizar.apply(alteracao.id(), alteracao.data());
        }
        lote.deletes().forEach(excluir);
        return listar.get();
    }

    private ResponseStatusException repeticao() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie apenas uma operação por registro.");
    }
}
