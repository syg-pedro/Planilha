package com.financeiro.erros;

import java.util.Map;

public record ErroApi(String code, String message, Map<String, String> fields) {
}
