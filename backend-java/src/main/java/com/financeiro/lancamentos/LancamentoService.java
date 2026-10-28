package com.financeiro.lancamentos;

import com.financeiro.seguranca.ContextoFamilia;

import java.time.Clock;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import com.financeiro.categorias.CategoriaService;
import com.financeiro.contas.ContaService;
import com.financeiro.regras.RegraRepository;

import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class LancamentoService {
    private final ContextoFamilia contexto;
    private final LancamentoRepository repository;
    private final ContaService contas;
    private final CategoriaService categorias;
    private final RegraRepository regras;
    private final Clock clock;

    public LancamentoService(LancamentoRepository repository, ContaService contas, CategoriaService categorias,
            RegraRepository regras, Clock clock, ContextoFamilia contexto) {
        this.contexto = contexto;
        this.repository = repository;
        this.contas = contas;
        this.categorias = categorias;
        this.regras = regras;
        this.clock = clock;
    }

    public List<LancamentoResposta> listar() {
        return repository.listarPorFamilia(contexto.familiaId()).stream().map(LancamentoResposta::de).toList();
    }

    public PaginaLancamentos paginar(ConsultaLancamentos consulta) {
        Sort ordem = switch (consulta.sort()) {
            case "amount_desc" -> Sort.by(Sort.Direction.DESC, "valor");
            case "date_desc" -> Sort.by(Sort.Direction.DESC,
                    consulta.periodMode().equals("competence") ? "competencia" : "vencimento");
            default -> Sort.by(consulta.periodMode().equals("competence") ? "competencia" : "vencimento");
        };
        var pagina = repository.findAll(FiltroLancamentos.de(contexto.familiaId(), consulta),
                PageRequest.of(consulta.page(), consulta.size(), ordem.and(Sort.by("id"))));
        return new PaginaLancamentos(pagina.getContent().stream().map(LancamentoResposta::de).toList(),
                pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    public LancamentoResposta buscar(String id) {
        return LancamentoResposta.de(exigirLancamento(id));
    }

    @Transactional
    public LancamentoResposta criar(LancamentoRequisicao requisicao) {
        Lancamento lancamento = new Lancamento();
        lancamento.id = "entry-" + UUID.randomUUID();
        lancamento.grupoFamiliarId = contexto.familiaId();
        lancamento.criadoEm = clock.instant().truncatedTo(ChronoUnit.MICROS);
        aplicar(lancamento, requisicao);
        return LancamentoResposta.de(repository.save(lancamento));
    }

    @Transactional
    public LancamentoResposta atualizar(String id, LancamentoRequisicao requisicao) {
        Lancamento lancamento = exigirLancamento(id);
        aplicar(lancamento, requisicao);
        return LancamentoResposta.de(repository.save(lancamento));
    }

    @Transactional
    public void excluir(String id) {
        repository.delete(exigirLancamento(id));
    }

    private Lancamento exigirLancamento(String id) {
        return repository.buscarPorIdEFamilia(id, contexto.familiaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lancamento nao encontrado."));
    }

    private void aplicar(Lancamento lancamento, LancamentoRequisicao requisicao) {
        validarReferencias(requisicao);
        lancamento.regraId = requisicao.ruleId();
        lancamento.contaId = requisicao.accountId();
        lancamento.categoriaId = requisicao.categoryId();
        lancamento.titulo = requisicao.title();
        lancamento.descricao = requisicao.description();
        lancamento.valor = requisicao.amount().setScale(2, RoundingMode.UNNECESSARY);
        lancamento.tipo = requisicao.kind();
        lancamento.vencimento = requisicao.dueDate();
        lancamento.competencia = requisicao.competenceDate();
        lancamento.numeroParcela = requisicao.installmentIndex();
        lancamento.totalParcelas = requisicao.installmentTotal();
        lancamento.metadados = requisicao.metadata();
        if (requisicao.status() != null) lancamento.estado = requisicao.status();
        if (requisicao.origin() != null) lancamento.origem = requisicao.origin();
        if (requisicao.excludeFromCalc() != null) lancamento.excluirDosTotais = requisicao.excludeFromCalc();
        lancamento.atualizadoEm = clock.instant().truncatedTo(ChronoUnit.MICROS);
    }

    private void validarReferencias(LancamentoRequisicao requisicao) {
        try {
            if (requisicao.accountId() != null) contas.buscar(requisicao.accountId());
            if (requisicao.categoryId() != null) categorias.buscar(requisicao.categoryId());
            if (requisicao.ruleId() != null
                    && regras.buscarPorIdEFamilia(requisicao.ruleId(), contexto.familiaId()).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode().value() != 404) throw exception;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conta, categoria ou regra inválida.");
        }
    }
}
