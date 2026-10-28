package com.financeiro.onboarding;

import com.financeiro.seguranca.ContextoFamilia;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.financeiro.categorias.CategoriaRequisicao;
import com.financeiro.categorias.CategoriaService;
import com.financeiro.configuracoes.ConfiguracaoRequisicao.Introducao;
import com.financeiro.configuracoes.ConfiguracaoService;
import com.financeiro.contas.ContaRequisicao;
import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoService;
import com.financeiro.regras.RegraRequisicao;
import com.financeiro.regras.RegraService;
import jakarta.validation.Validator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class OnboardingService {
    private final ContextoFamilia contexto;
    private final ContaService contas;
    private final CategoriaService categorias;
    private final RegraService regras;
    private final LancamentoService lancamentos;
    private final ConfiguracaoService configuracoes;
    private final JdbcTemplate jdbc;
    private final Validator validador;

    public OnboardingService(ContaService contas, CategoriaService categorias, RegraService regras,
            LancamentoService lancamentos, ConfiguracaoService configuracoes, JdbcTemplate jdbc, Validator validador, ContextoFamilia contexto) {
        this.contexto = contexto;
        this.contas = contas;
        this.categorias = categorias;
        this.regras = regras;
        this.lancamentos = lancamentos;
        this.configuracoes = configuracoes;
        this.jdbc = jdbc;
        this.validador = validador;
    }

    public OnboardingPrevia prever(OnboardingRequisicao requisicao) {
        validar(requisicao);
        int horizonte = configuracoes.buscar().horizonMonths();
        return OnboardingPrevia.de(resumo(requisicao, horizonte), possuiDados());
    }

    @Transactional
    public OnboardingResumo importar(OnboardingRequisicao requisicao) {
        validar(requisicao);
        String familia = jdbc.queryForObject("SELECT id FROM household_settings WHERE id = ? FOR UPDATE",
                String.class, contexto.familiaId());
        if (!contexto.familiaId().equals(familia)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "As configurações locais não estão disponíveis.");
        }
        if (possuiDados()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A importação inicial está disponível apenas quando não há dados financeiros.");
        }
        int horizonte = configuracoes.buscar().horizonMonths();
        Map<String, String> contasPorNome = new HashMap<>();
        for (var conta : requisicao.accounts()) {
            var criada = contas.criar(new ContaRequisicao(conta.name(),
                    conta.owner().isEmpty() ? "Família" : conta.owner(), conta.type(), conta.limitTotal(),
                    conta.closingDay(), conta.dueDay(), true));
            contasPorNome.put(normalizar(conta.name()), criada.id());
        }
        Map<String, String> categoriasPorNome = new HashMap<>();
        for (var categoria : requisicao.categories()) {
            var criada = categorias.criar(new CategoriaRequisicao(categoria.name(), categoria.kind(), categoria.color()));
            categoriasPorNome.put(normalizar(categoria.name()), criada.id());
        }
        for (var regra : requisicao.rules()) {
            regras.criar(new RegraRequisicao(regra.title(), "Importado pelo modelo inicial",
                    buscarReferencia(regra.accountName(), contasPorNome), buscarReferencia(regra.categoryName(), categoriasPorNome),
                    regra.amount(), regra.kind(), regra.dueDay(), "monthly", null, null, true,
                    Map.of("source", "onboarding-workbook", "sourceRow", regra.sourceRow())));
        }
        regras.reconstruir(horizonte);
        for (var lancamento : requisicao.entries()) {
            lancamentos.criar(new LancamentoRequisicao(null,
                    buscarReferencia(lancamento.accountName(), contasPorNome),
                    buscarReferencia(lancamento.categoryName(), categoriasPorNome),
                    lancamento.title(), "Importado pelo modelo inicial", lancamento.amount(),
                    lancamento.kind(), lancamento.dueDate(), lancamento.dueDate(),
                    lancamento.installmentIndex(), lancamento.installmentTotal(), lancamento.status(),
                    "imported", false, Map.of("source", "onboarding-workbook", "sourceRow", lancamento.sourceRow())));
        }
        configuracoes.salvarIntroducao(new Introducao(1, "completed",
                List.of("import-workbook", "accounts", "fixed-items"), null));
        return resumo(requisicao, horizonte);
    }

    private void validar(OnboardingRequisicao requisicao) {
        if (requisicao == null || !validador.validate(requisicao).isEmpty()) {
            throw entradaInvalida("Confira os campos do arquivo de importação.");
        }
        if (requisicao.accounts().isEmpty() && requisicao.categories().isEmpty()
                && requisicao.rules().isEmpty() && requisicao.entries().isEmpty()) {
            throw entradaInvalida("Preencha pelo menos uma linha para importar.");
        }
        Set<String> nomesContas = new HashSet<>();
        for (var conta : requisicao.accounts()) {
            if (!nomesContas.add(normalizar(conta.name()))) {
                throw entradaInvalida("Há contas com nomes repetidos nas linhas importadas.");
            }
        }
        Set<String> nomesCategorias = new HashSet<>();
        for (var categoria : requisicao.categories()) {
            if (!nomesCategorias.add(normalizar(categoria.name()))) {
                throw entradaInvalida("Há categorias com nomes repetidos nas linhas importadas.");
            }
        }
        for (var regra : requisicao.rules()) {
            validarReferencia(regra.accountName(), nomesContas);
            validarReferencia(regra.categoryName(), nomesCategorias);
        }
        for (var lancamento : requisicao.entries()) {
            validarReferencia(lancamento.accountName(), nomesContas);
            validarReferencia(lancamento.categoryName(), nomesCategorias);
        }
    }

    private boolean possuiDados() {
        return !contas.listar().isEmpty() || !categorias.listar().isEmpty()
                || !regras.listar().isEmpty() || !lancamentos.listar().isEmpty();
    }

    private OnboardingResumo resumo(OnboardingRequisicao requisicao, int horizonte) {
        return new OnboardingResumo(requisicao.accounts().size(), requisicao.categories().size(),
                requisicao.rules().size(), requisicao.rules().size() * horizonte, requisicao.entries().size());
    }

    private void validarReferencia(String nome, Set<String> nomes) {
        if (nome != null && !nomes.contains(normalizar(nome))) {
            throw entradaInvalida("Confira as contas e categorias referenciadas nas linhas importadas.");
        }
    }

    private String buscarReferencia(String nome, Map<String, String> ids) {
        return nome == null ? null : ids.get(normalizar(nome));
    }

    static String normalizar(String valor) {
        return Normalizer.normalize(valor, Normalizer.Form.NFD).replaceAll("[\\u0300-\\u036f]", "")
                .toLowerCase(Locale.forLanguageTag("pt-BR")).replaceAll("(?U)\\s+", " ").trim();
    }

    private ResponseStatusException entradaInvalida(String mensagem) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
    }
}
