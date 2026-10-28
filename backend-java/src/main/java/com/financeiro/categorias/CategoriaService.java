package com.financeiro.categorias;

import com.financeiro.seguranca.ContextoFamilia;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CategoriaService {
    private final ContextoFamilia contexto;
    private final CategoriaRepository repository;

    public CategoriaService(CategoriaRepository repository, ContextoFamilia contexto) {
        this.contexto = contexto;
        this.repository = repository;
    }

    public List<CategoriaResposta> listar() {
        return repository.listarPorFamilia(contexto.familiaId()).stream().map(CategoriaResposta::de).toList();
    }

    public CategoriaResposta buscar(String id) {
        return CategoriaResposta.de(exigirCategoria(id));
    }

    @Transactional
    public CategoriaResposta criar(CategoriaRequisicao requisicao) {
        Categoria categoria = new Categoria();
        categoria.id = "category-" + UUID.randomUUID();
        categoria.grupoFamiliarId = contexto.familiaId();
        aplicar(categoria, requisicao);
        return CategoriaResposta.de(repository.save(categoria));
    }

    @Transactional
    public CategoriaResposta atualizar(String id, CategoriaRequisicao requisicao) {
        Categoria categoria = exigirCategoria(id);
        aplicar(categoria, requisicao);
        return CategoriaResposta.de(repository.save(categoria));
    }

    @Transactional
    public void excluir(String id) {
        repository.delete(exigirCategoria(id));
    }

    private Categoria exigirCategoria(String id) {
        return repository.buscarPorIdEFamilia(id, contexto.familiaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria nao encontrada."));
    }

    private void aplicar(Categoria categoria, CategoriaRequisicao requisicao) {
        categoria.nome = requisicao.name();
        categoria.tipo = requisicao.kind();
        categoria.cor = requisicao.color();
    }
}
