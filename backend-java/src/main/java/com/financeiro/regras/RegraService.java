package com.financeiro.regras;

import com.financeiro.seguranca.ContextoFamilia;

import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import com.financeiro.categorias.CategoriaService;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoResposta;
import com.financeiro.lancamentos.LancamentoService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class RegraService {
    private final ContextoFamilia contexto;
    private final RegraRepository repository;
    private final ContaService contas;
    private final CategoriaService categorias;
    private final LancamentoService lancamentos;
    private final Clock clock;

    public RegraService(RegraRepository repository, ContaService contas, CategoriaService categorias,
            LancamentoService lancamentos, Clock clock, ContextoFamilia contexto) {
        this.contexto = contexto;
        this.repository = repository;
        this.contas = contas;
        this.categorias = categorias;
        this.lancamentos = lancamentos;
        this.clock = clock;
    }

    public List<RegraResposta> listar() {
        return repository.listarPorFamilia(contexto.familiaId()).stream().map(RegraResposta::de).toList();
    }

    public RegraResposta buscar(String id) {
        return RegraResposta.de(exigirRegra(id));
    }

    @Transactional
    public RegraResposta criar(RegraRequisicao requisicao) {
        Regra regra = new Regra();
        regra.id = "rule-" + UUID.randomUUID();
        regra.grupoFamiliarId = contexto.familiaId();
        regra.inicio = hoje();
        aplicar(regra, requisicao);
        return RegraResposta.de(repository.save(regra));
    }

    @Transactional
    public RegraResposta atualizar(String id, RegraRequisicao requisicao) {
        Regra regra = exigirRegra(id);
        aplicar(regra, requisicao);
        return RegraResposta.de(repository.save(regra));
    }

    @Transactional
    public void excluir(String id) {
        repository.listarComBloqueio(contexto.familiaId());
        Regra regra = exigirRegra(id);
        LocalDate inicio = hoje().withDayOfMonth(1);
        lancamentos.listar().stream()
                .filter(lancamento -> id.equals(lancamento.ruleId()) && "auto".equals(lancamento.origin())
                        && !"paid".equals(lancamento.status()) && !lancamento.dueDate().isBefore(inicio))
                .forEach(lancamento -> lancamentos.excluir(lancamento.id()));
        repository.delete(regra);
    }

    @Transactional
    public ReconstrucaoResposta reconstruir(Integer mesesInformados) {
        int meses = mesesInformados == null ? 18 : mesesInformados;
        if (meses < 1 || meses > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use um horizonte entre 1 e 120 meses.");
        }
        List<Regra> regras = repository.listarComBloqueio(contexto.familiaId());
        LocalDate inicio = hoje().withDayOfMonth(1);
        LocalDate fim = inicio.plusMonths(meses);
        Map<String, LancamentoRequisicao> desejados = gerar(regras, inicio, meses);
        Map<String, LancamentoResposta> existentes = new HashMap<>();
        int removidos = 0;
        int preservados = 0;
        for (LancamentoResposta lancamento : lancamentos.listar()) {
            if (!"auto".equals(lancamento.origin()) || lancamento.ruleId() == null) continue;
            String chave = chave(lancamento.ruleId(), lancamento.dueDate());
            existentes.put(chave, lancamento);
            if ("paid".equals(lancamento.status()) || lancamento.dueDate().isBefore(inicio)
                    || !lancamento.dueDate().isBefore(fim)) {
                preservados++;
            } else if (!desejados.containsKey(chave)) {
                lancamentos.excluir(lancamento.id());
                removidos++;
            }
        }
        int criados = 0;
        int atualizados = 0;
        for (Map.Entry<String, LancamentoRequisicao> item : desejados.entrySet()) {
            LancamentoResposta existente = existentes.get(item.getKey());
            if (existente == null) {
                lancamentos.criar(item.getValue());
                criados++;
            } else if (!"paid".equals(existente.status())) {
                if (corresponde(existente, item.getValue())) {
                    preservados++;
                } else {
                    lancamentos.atualizar(existente.id(), item.getValue());
                    atualizados++;
                }
            }
        }
        return new ReconstrucaoResposta(desejados.size(), criados, atualizados, removidos, preservados);
    }

    private Map<String, LancamentoRequisicao> gerar(List<Regra> regras, LocalDate inicio, int meses) {
        Map<String, LancamentoRequisicao> desejados = new LinkedHashMap<>();
        for (Regra regra : regras) {
            if (!regra.gerarAutomaticamente || !"monthly".equals(regra.frequencia) || regra.diaVencimento == null) continue;
            for (int indice = 0; indice < meses; indice++) {
                YearMonth mes = YearMonth.from(inicio).plusMonths(indice);
                LocalDate vencimento = mes.atDay(Math.min(regra.diaVencimento, mes.lengthOfMonth()));
                LancamentoRequisicao requisicao = new LancamentoRequisicao(regra.id, regra.contaId,
                        regra.categoriaId, regra.titulo, regra.descricao, regra.valor, regra.tipo, vencimento,
                        vencimento, null, null, null, "auto", false, metadadosGerados(regra));
                desejados.put(chave(regra.id, vencimento), requisicao);
            }
        }
        return desejados;
    }

    private Map<String, Object> metadadosGerados(Regra regra) {
        Map<String, Object> metadados = new LinkedHashMap<>();
        metadados.put("generatedFromRule", true);
        if (regra.metadados != null && regra.metadados.get("source") instanceof String origem) {
            metadados.put("source", origem);
        }
        return metadados;
    }

    private boolean corresponde(LancamentoResposta existente, LancamentoRequisicao desejado) {
        return Objects.equals(existente.accountId(), desejado.accountId())
                && Objects.equals(existente.categoryId(), desejado.categoryId())
                && existente.title().equals(desejado.title())
                && existente.description().equals(desejado.description())
                && existente.amount().compareTo(desejado.amount()) == 0
                && existente.kind().equals(desejado.kind())
                && existente.competenceDate().equals(desejado.competenceDate())
                && existente.installmentIndex() == null && existente.installmentTotal() == null
                && !existente.excludeFromCalc() && Objects.equals(existente.metadata(), desejado.metadata());
    }

    private Regra exigirRegra(String id) {
        return repository.buscarPorIdEFamilia(id, contexto.familiaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Regra não encontrada."));
    }

    private void aplicar(Regra regra, RegraRequisicao requisicao) {
        validarReferencias(requisicao);
        regra.titulo = requisicao.title();
        regra.descricao = requisicao.description();
        regra.contaId = requisicao.accountId();
        regra.categoriaId = requisicao.categoryId();
        regra.valor = requisicao.amount().setScale(2, RoundingMode.UNNECESSARY);
        regra.tipo = requisicao.kind();
        regra.diaVencimento = requisicao.dueDay();
        regra.frequencia = requisicao.frequency();
        if (requisicao.startsAt() != null) regra.inicio = requisicao.startsAt();
        regra.fim = requisicao.endsAt();
        if (requisicao.autoGenerate() != null) regra.gerarAutomaticamente = requisicao.autoGenerate();
        regra.metadados = requisicao.metadata();
    }

    private void validarReferencias(RegraRequisicao requisicao) {
        try {
            if (requisicao.accountId() != null) contas.buscar(requisicao.accountId());
            if (requisicao.categoryId() != null) categorias.buscar(requisicao.categoryId());
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode().value() != 404) throw exception;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conta ou categoria inválida.");
        }
    }

    private LocalDate hoje() {
        return LocalDate.now(clock.withZone(ZoneOffset.UTC));
    }

    private String chave(String regraId, LocalDate vencimento) {
        return regraId + "__" + vencimento;
    }
}
