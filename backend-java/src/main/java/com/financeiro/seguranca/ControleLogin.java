package com.financeiro.seguranca;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ControleLogin {
    private final Map<String, Deque<Instant>> tentativas = new HashMap<>();
    private final Clock clock;

    public ControleLogin(Clock clock) {
        this.clock = clock;
    }

    public synchronized void registrar(String email) {
        Instant agora = clock.instant();
        Instant limite = agora.minus(15, ChronoUnit.MINUTES);
        tentativas.entrySet().removeIf(item -> item.getValue().getLast().isBefore(limite));
        if (!tentativas.containsKey(email) && tentativas.size() >= 1000) throw bloqueado();
        Deque<Instant> recentes = tentativas.computeIfAbsent(email, chave -> new ArrayDeque<>());
        while (!recentes.isEmpty() && recentes.getFirst().isBefore(limite)) recentes.removeFirst();
        if (recentes.size() >= 10) throw bloqueado();
        recentes.addLast(agora);
    }

    public synchronized void sucesso(String email) {
        tentativas.remove(email);
    }

    private ResponseStatusException bloqueado() {
        return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Aguarde antes de tentar entrar novamente.");
    }
}
