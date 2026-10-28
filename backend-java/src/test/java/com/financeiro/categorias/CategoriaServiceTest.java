package com.financeiro.categorias;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class CategoriaServiceTest {
    private final CategoriaRepository repository = mock(CategoriaRepository.class);
    private final CategoriaService service = new CategoriaService(repository, com.financeiro.seguranca.ContextoLocalTestConfig.local());

    @Test
    void criaCategoriaComIdentidadeLocal() {
        when(repository.save(any(Categoria.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        CategoriaResposta resposta = service.criar(new CategoriaRequisicao("  Despesa ficticia  ", "expense", "#12aBef"));

        assertThat(resposta.id()).matches("category-[0-9a-f-]{36}");
        assertThat(resposta.householdId()).isEqualTo("local-demo");
        assertThat(resposta.name()).isEqualTo("Despesa ficticia");
        assertThat(resposta.kind()).isEqualTo("expense");
        assertThat(resposta.color()).isEqualTo("#12aBef");
    }

    @Test
    void atualizaCategoriaExistentePreservandoIdentidade() {
        Categoria categoria = categoriaExistente();
        when(repository.buscarPorIdEFamilia("category-ficticia", "local-demo")).thenReturn(Optional.of(categoria));
        when(repository.save(any(Categoria.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        CategoriaResposta resposta = service.atualizar("category-ficticia",
                new CategoriaRequisicao("Receita ficticia", "income", "#123456"));

        assertThat(resposta.id()).isEqualTo("category-ficticia");
        assertThat(resposta.householdId()).isEqualTo("local-demo");
        assertThat(resposta.name()).isEqualTo("Receita ficticia");
        assertThat(resposta.kind()).isEqualTo("income");
    }

    @Test
    void consultaSomenteContextoLocal() {
        Categoria categoria = categoriaExistente();
        when(repository.listarPorFamilia("local-demo")).thenReturn(List.of(categoria));
        when(repository.buscarPorIdEFamilia("category-ficticia", "local-demo")).thenReturn(Optional.of(categoria));

        assertThat(service.listar()).containsExactly(CategoriaResposta.de(categoria));
        assertThat(service.buscar("category-ficticia")).isEqualTo(CategoriaResposta.de(categoria));
        verify(repository).listarPorFamilia("local-demo");
        verify(repository).buscarPorIdEFamilia("category-ficticia", "local-demo");
    }

    @Test
    void atualizacaoInexistenteNaoFazUpsert() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizar("ausente",
                new CategoriaRequisicao("Despesa ficticia", "expense", "#123456")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repository, never()).save(any(Categoria.class));
    }

    @Test
    void excluiSomenteRegistroEncontradoNoContexto() {
        Categoria categoria = categoriaExistente();
        when(repository.buscarPorIdEFamilia("category-ficticia", "local-demo")).thenReturn(Optional.of(categoria));

        service.excluir("category-ficticia");

        verify(repository).delete(categoria);
    }

    @Test
    void exclusaoInexistenteNaoAlteraDados() {
        when(repository.buscarPorIdEFamilia("ausente", "local-demo")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.excluir("ausente"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        erro -> assertThat(erro.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repository, never()).delete(any(Categoria.class));
    }

    private Categoria categoriaExistente() {
        Categoria categoria = new Categoria();
        categoria.id = "category-ficticia";
        categoria.grupoFamiliarId = "local-demo";
        categoria.nome = "Despesa ficticia";
        categoria.tipo = "expense";
        categoria.cor = "#123456";
        return categoria;
    }
}
