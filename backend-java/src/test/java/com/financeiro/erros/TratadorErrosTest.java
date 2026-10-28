package com.financeiro.erros;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.server.ResponseStatusException;

class TratadorErrosTest {
    private final TratadorErros tratador = new TratadorErros();
    private final ServletWebRequest requisicao = new ServletWebRequest(new MockHttpServletRequest());

    @Test
    void preserva404SemDivulgarMotivoInterno() throws Exception {
        var resposta = tratador.handleException(new ResponseStatusException(HttpStatus.NOT_FOUND,
                "private-sentinel jdbc:postgresql://internal/database"), requisicao);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        ErroApi erro = (ErroApi) resposta.getBody();
        assertThat(erro.code()).isEqualTo("NOT_FOUND");
        assertThat(erro.toString()).doesNotContain("private-sentinel", "jdbc:", "database");
    }

    @Test
    void preserva405ParaMetodoIncompativel() throws Exception {
        var resposta = tratador.handleException(new HttpRequestMethodNotSupportedException("PATCH"), requisicao);
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(((ErroApi) resposta.getBody()).code()).isEqualTo("METHOD_NOT_ALLOWED");
    }

    @Test
    void erroInesperadoNaoDivulgaDetalhesDoBanco() {
        var resposta = tratador.tratarFalhaInesperada(new IllegalStateException("private-sentinel SQL password"));
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        ErroApi erro = (ErroApi) resposta.getBody();
        assertThat(erro.code()).isEqualTo("INTERNAL_ERROR");
        assertThat(erro.toString()).doesNotContain("private-sentinel", "SQL", "password");
    }
}
