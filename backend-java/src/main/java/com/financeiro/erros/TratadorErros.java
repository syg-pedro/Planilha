package com.financeiro.erros;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class TratadorErros extends ResponseEntityExceptionHandler {
    private static final Logger LOG = LoggerFactory.getLogger(TratadorErros.class);

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> campos = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(erro -> campos.putIfAbsent(erro.getField(), erro.isBindingFailure()
                        ? "Confira o formato deste campo." : erro.getDefaultMessage()));
        return new ResponseEntity<>(new ErroApi("VALIDATION_ERROR", "Confira os campos informados.", campos),
                headers, status);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException exception,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return new ResponseEntity<>(new ErroApi("INVALID_REQUEST", "Confira o formato dos dados informados.",
                Map.of()), headers, status);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception, Object body,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String codigo = switch (status.value()) {
            case 400 -> "INVALID_REQUEST";
            case 401 -> "UNAUTHORIZED";
            case 403 -> "FORBIDDEN";
            case 404 -> "NOT_FOUND";
            case 405 -> "METHOD_NOT_ALLOWED";
            case 415 -> "UNSUPPORTED_MEDIA_TYPE";
            case 429 -> "RATE_LIMITED";
            default -> status.is5xxServerError() ? "SERVICE_UNAVAILABLE" : "REQUEST_ERROR";
        };
        String mensagem = switch (status.value()) {
            case 400 -> "Confira os dados informados.";
            case 401 -> "Faça login para continuar.";
            case 403 -> "Você não tem permissão para esta operação.";
            case 404 -> "Registro não encontrado.";
            case 405 -> "Esta operação não está disponível para este endereço.";
            case 415 -> "Envie os dados no formato JSON.";
            case 429 -> "Aguarde antes de tentar novamente.";
            default -> "Não foi possível concluir a solicitação.";
        };
        if (status.is5xxServerError()) LOG.error("Falha ao atender requisição.", exception);
        return new ResponseEntity<>(new ErroApi(codigo, mensagem, Map.of()), headers, status);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Object> tratarFalhaInesperada(Exception exception) {
        LOG.error("Falha inesperada ao atender requisição.", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErroApi("INTERNAL_ERROR", "Não foi possível concluir a solicitação.", Map.of()));
    }
}
