# E2E do laboratório React

Os testes acessam somente `http://127.0.0.1:5173`. O Vite encaminha `/api` ao Spring Boot em `127.0.0.1:8080`. O backend deve estar ativo com PostgreSQL local e migrations aplicadas. O comando de testes inicia ou reutiliza somente o Vite.

Cada cenário cadastra uma pessoa e família fictícias pela interface, com e-mail único `@example.test`. Não utiliza seeds, `.env` do Nuxt, serviços remotos ou dados reais. Esses cadastros ficam no banco local; não há limpeza destrutiva automática. Requests autenticados servem para fixtures e confirmação de persistência; as operações principais acontecem na interface.

Na raiz do repositório:

```bash
npm --prefix frontend-react run test:e2e
```

Para executar somente o fluxo principal:

```bash
npm --prefix frontend-react run test:e2e -- --grep "conta, categoria e lançamento"
```

Para listar os cenários sem abrir navegador ou alterar dados:

```bash
npm --prefix frontend-react run test:e2e -- --list
```

Cobertura: conta/cartão → categoria → lançamento → pagar/desfazer → editar/excluir; recorrência e reconstrução; desejos; isolamento de duas sessões/famílias; filtros independentes de gráficos; visual em 320/768/1440px e temas claro/escuro. Um worker evita sobrecarregar o ambiente local.

Capturas ficam em `frontend-react/test-results/`, anexadas ao relatório `frontend-react/playwright-report/`. Trace e vídeo são mantidos quando há falha. Erros inesperados de página, console, rede e respostas API 5xx são coletados em `falhas-browser`. O 401 inicial de `/api/auth/refresh`, antes do cadastro, é esperado.

Escrever ou listar estes testes não comprova aprovação visual. Após executar, conferir resultados e abrir as capturas de desktop/mobile nos dois temas.
