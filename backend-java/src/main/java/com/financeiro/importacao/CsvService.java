package com.financeiro.importacao;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.DateTimeException;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.financeiro.contas.ContaService;
import com.financeiro.lancamentos.LancamentoRequisicao;
import com.financeiro.lancamentos.LancamentoService;
import jakarta.validation.Validator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CsvService {
    private final ContaService contas;
    private final LancamentoService lancamentos;
    private final Validator validador;

    public CsvService(ContaService contas, LancamentoService lancamentos, Validator validador) {
        this.contas = contas;
        this.lancamentos = lancamentos;
        this.validador = validador;
    }

    public record Previa(List<LancamentoRequisicao> rows, List<String> warnings, boolean canImport) {
    }

    public record Resultado(int inserted, List<String> warnings) {
    }

    public Previa prever(CsvRequisicao requisicao) {
        if (requisicao.accountId() != null) {
            try {
                contas.buscar(requisicao.accountId());
            } catch (ResponseStatusException exception) {
                if (exception.getStatusCode().value() != 404) throw exception;
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha uma conta válida.");
            }
        }
        List<LeitorCsv.Linha> linhas;
        try {
            linhas = LeitorCsv.ler(requisicao.csvText());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
        List<LancamentoRequisicao> aceitos = new ArrayList<>();
        List<String> avisos = new ArrayList<>();
        for (var linha : linhas) {
            try {
                var valores = linha.valores();
                String textoValor = primeiro(valores, "amount", "valor", "value");
                String textoData = primeiro(valores, "date", "data", "duedate", "due_date");
                BigDecimal valor = valor(textoValor);
                LocalDate data = data(textoData);
                String titulo = primeiro(valores, "title", "descricao", "description");
                var entrada = new LancamentoRequisicao(null, requisicao.accountId(), null,
                        titulo == null || titulo.isBlank() ? "Importado CSV" : titulo,
                        "Importado via CSV", valor.abs(), valor.signum() < 0 ? "income" : "expense",
                        data, data, null, null, "pending", "imported", false, Map.of("csv", valores));
                if (!validador.validate(entrada).isEmpty()) throw new IllegalArgumentException();
                aceitos.add(entrada);
            } catch (IllegalArgumentException | DateTimeException exception) {
                avisos.add("Linha " + linha.numero() + ": confira a data, o valor e a descrição.");
            }
        }
        return new Previa(List.copyOf(aceitos), List.copyOf(avisos), !aceitos.isEmpty());
    }

    @Transactional
    public Resultado importar(CsvRequisicao requisicao) {
        Previa previa = prever(requisicao);
        previa.rows().forEach(lancamentos::criar);
        return new Resultado(previa.rows().size(), previa.warnings());
    }

    static BigDecimal valor(String texto) {
        if (texto == null) throw new IllegalArgumentException();
        String numero = texto.replace('\u00A0', ' ').strip();
        if (numero.startsWith("R$")) numero = numero.substring(2).strip();
        if (numero.contains(",")) {
            if (!numero.matches("[-+]?(?:[0-9]{1,3}(?:\\.[0-9]{3})*|[0-9]+),[0-9]{1,2}")) {
                throw new IllegalArgumentException();
            }
            numero = numero.replace(".", "").replace(',', '.');
        } else if (!numero.matches("[-+]?[0-9]+(?:\\.[0-9]{1,2})?")) {
            throw new IllegalArgumentException();
        }
        return new BigDecimal(numero).setScale(2, RoundingMode.UNNECESSARY);
    }

    static LocalDate data(String texto) {
        if (texto == null) throw new IllegalArgumentException();
        if (texto.matches("[0-9]{2}/[0-9]{2}/[0-9]{4}")) {
            return LocalDate.parse(texto, DateTimeFormatter.ofPattern("dd/MM/uuuu").withResolverStyle(ResolverStyle.STRICT));
        }
        if (texto.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) return LocalDate.parse(texto);
        return LocalDate.from(DateTimeFormatter.ISO_DATE_TIME.parse(texto));
    }

    private static String primeiro(Map<String, String> valores, String... nomes) {
        for (String nome : nomes) if (valores.containsKey(nome)) return valores.get(nome);
        return null;
    }
}
