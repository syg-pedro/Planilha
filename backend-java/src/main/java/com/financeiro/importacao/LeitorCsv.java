package com.financeiro.importacao;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class LeitorCsv {
    private LeitorCsv() {
    }

    public record Linha(int numero, Map<String, String> valores) {
    }

    public static List<Linha> ler(String texto) {
        String conteudo = texto.startsWith("\uFEFF") ? texto.substring(1) : texto;
        String primeira = conteudo.lines().filter(linha -> !linha.isBlank()).findFirst().orElse("");
        char separador = separador(primeira);
        List<List<String>> linhas = new ArrayList<>();
        List<Integer> numeros = new ArrayList<>();
        List<String> campos = new ArrayList<>();
        StringBuilder campo = new StringBuilder();
        boolean entreAspas = false;
        boolean aspasFechadas = false;
        int numero = 1;
        int inicio = 1;
        for (int i = 0; i <= conteudo.length(); i++) {
            char atual = i == conteudo.length() ? '\n' : conteudo.charAt(i);
            if (entreAspas) {
                if (atual == '"') {
                    if (i + 1 < conteudo.length() && conteudo.charAt(i + 1) == '"') {
                        campo.append('"');
                        i++;
                    } else {
                        entreAspas = false;
                        aspasFechadas = true;
                    }
                } else {
                    campo.append(atual);
                    if (atual == '\n') numero++;
                }
                continue;
            }
            if (atual == '"') {
                if (!campo.toString().isBlank() || aspasFechadas) throw formatoInvalido();
                campo.setLength(0);
                entreAspas = true;
            } else if (atual == separador || atual == '\r' || atual == '\n') {
                campos.add(campo.toString().trim());
                campo.setLength(0);
                aspasFechadas = false;
                if (atual != separador) {
                    if (campos.stream().anyMatch(valor -> !valor.isBlank())) {
                        linhas.add(List.copyOf(campos));
                        numeros.add(inicio);
                        if (linhas.size() > 1001) throw new IllegalArgumentException("Importe no máximo 1000 linhas por arquivo.");
                    }
                    campos.clear();
                    if (atual == '\r' && i + 1 < conteudo.length() && conteudo.charAt(i + 1) == '\n') i++;
                    numero++;
                    inicio = numero;
                }
            } else {
                if (aspasFechadas && !Character.isWhitespace(atual)) throw formatoInvalido();
                campo.append(atual);
            }
        }
        if (entreAspas) throw formatoInvalido();
        if (linhas.isEmpty()) return List.of();
        List<String> cabecalho = linhas.get(0).stream().map(LeitorCsv::normalizar).toList();
        if (cabecalho.stream().anyMatch(String::isBlank) || cabecalho.stream().distinct().count() != cabecalho.size()) {
            throw new IllegalArgumentException("Confira os nomes das colunas do CSV.");
        }
        List<Linha> resultado = new ArrayList<>();
        for (int i = 1; i < linhas.size(); i++) {
            List<String> valores = linhas.get(i);
            if (valores.size() != cabecalho.size()) throw formatoInvalido();
            Map<String, String> registro = new LinkedHashMap<>();
            for (int coluna = 0; coluna < cabecalho.size(); coluna++) registro.put(cabecalho.get(coluna), valores.get(coluna));
            resultado.add(new Linha(numeros.get(i), Map.copyOf(registro)));
        }
        return List.copyOf(resultado);
    }

    private static String normalizar(String texto) {
        return Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .trim().toLowerCase(Locale.ROOT);
    }

    private static char separador(String cabecalho) {
        int virgulas = 0;
        int pontos = 0;
        boolean aspas = false;
        for (int i = 0; i < cabecalho.length(); i++) {
            char caractere = cabecalho.charAt(i);
            if (caractere == '"') aspas = !aspas;
            if (!aspas && caractere == ',') virgulas++;
            if (!aspas && caractere == ';') pontos++;
        }
        return pontos > virgulas ? ';' : ',';
    }

    private static IllegalArgumentException formatoInvalido() {
        return new IllegalArgumentException("Confira as colunas e as aspas do CSV.");
    }
}
