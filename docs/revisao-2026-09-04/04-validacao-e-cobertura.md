# Validação, evidências e limites

> Diagnóstico original, anterior às correções. Consulte [o estado implementado e a validação final](06-correcoes-aplicadas.md). Referências de linha deste diagnóstico correspondem à base `19b1c17`.

Atualização Android: emulador configurado com WHPX/RTX 3090 e testes no APK executados. Falha com teclado corrigida com tratamento de insets e validada no APK API 36: dois ciclos de teclado e gravação por toque passaram. Veja [08 — Emulador Android](08-emulador-android.md).

## Validação atual — continuação das etapas 02, 03 e 04

| Verificação | Resultado atual |
|---|---|
| Lint | Exit 0 |
| Typecheck | Exit 0 |
| Vitest | 39 testes em 9 arquivos passaram |
| Playwright completo | 13 passaram; 8 skips intencionais por viewport |
| Novos cenários UX | 6 execuções em desktop e dois perfis mobile; incluem viewport de 320 px |
| Produção | Exit 0, saída Nitro isolada em `%TEMP%/planilha-etapas234-20260904-output` |
| Storybook build | Exit 0, saída isolada em `%TEMP%/planilha-etapas234-storybook` |
| Acessibilidade automatizada | Sem violações Axe nos recortes testados: topbar, editor e card mensal |
| Auditoria npm | 25 avisos: 3 críticos, 11 altos, 6 moderados, 5 baixos; correção pendente |

`tests/entry-draft.test.ts` cobre validação, datas no fim do mês, IDs de recorrência estáveis, preservação de rascunho e erro na edição da matriz. `e2e/review-ux.spec.ts` cobre falha HTTP 500, nova tentativa sem duplicação, confirmação de descarte, foco de validação, histórico/URL e overflow interno do editor. A captura de 320 px revelou campos de data cortados; foi corrigida com empilhamento e verificação específica de largura interna.

Os logs locais estão em `evidencias/*etapas234*.log` (ignorados pelo Git); as capturas e [auditoria JSON](evidencias/audit-etapas234.json) podem ser versionadas. O build e Storybook avisam sobre chunks grandes; Storybook também informa ausência de arquivos no padrão MDX, mas compila as stories Vue. Não se mediu bundle inicial ou Web Vitals.

### Dependências: pendência identificada durante a validação

A auditoria relata falhas críticas em `@nuxt/devtools`, `shell-quote` e `tar`. Parte da árvore é ferramenta de desenvolvimento/build, mas isso não permite descartar o risco: revisar caminhos e exposição antes da publicação. `npm audit fix` e uma atualização nominal respeitando as faixas de versão falharam com o erro interno `Cannot read properties of null (reading 'edgesOut')`, no npm 10.8.2. Nenhuma correção dessas dependências foi confirmada; não foi usado `--force`. A sugestão para ExcelJS envolve mudança incompatível e exige avaliação própria. Próximo passo: resolver a árvore com Node 22/npm compatível em ambiente reproduzível, revisar o lock e repetir os gates. A versão Node 22 já está indicada em `.nvmrc` e CI; a máquina usada permanece em Node 20.19.5.

### Limites atuais

E2E usa backend local em memória. A validação autenticada e a migração remota anteriores estão em [07](07-migracao-remota.md); não foram repetidas nesta continuação. Não houve deploy. Ainda faltam Android/iOS físicos, Safari, zoom, leitores de tela, acessibilidade de todas as telas e medição percentual de cobertura. O teclado virtual foi posteriormente validado no emulador Android API 36, conforme o documento 08. Build do Storybook não equivale a inspeção interativa de todas as stories. Referência de método: [Playwright — Accessibility testing](https://playwright.dev/docs/accessibility-testing).


## Ambiente e método

- Branch: `codex/revisao-completa-web-mobile`; base `19b1c17`.
- Windows/PowerShell; Node 20.19.5; npm 10.8.2. CI E2E usa Node 22: alinhar a versão suportada para reduzir diferenças.
- Revisão de arquitetura, persistência, autenticação, principais componentes, cálculos, migrações, scripts e testes. Inventário de fontes em [inventario.json](evidencias/inventario.json).
- Interface executada com `npx nuxt dev --dotenv e2e/test.env --host 127.0.0.1 --port 3107`, sem variáveis Supabase no arquivo de teste. Dados vieram do seed em memória. Não houve escrita no Supabase remoto, envio de convite ou publicação.
- Skills usadas: Supabase, Supabase Postgres Best Practices e Playwright. Consulta a documentação oficial de Vue, W3C e Supabase. O acesso ao changelog `.md` falhou; a página HTML foi consultada. Nenhuma atualização de dependência/schema foi aplicada.

## Resultados executados

| Verificação | Resultado | Interpretação |
|---|---|---|
| `npm run test` | 5 arquivos, 12 testes passaram | Cobertura atual de funções de domínio; não valida isolamento Supabase nem UI |
| `npm run typecheck` | Exit 0 | Tipagem passa; casts/any não garantem contrato de runtime |
| `npm run lint` | 0 erros, 1 warning | Ordem dos blocos de ListaDeDesejosScreen.vue:647 |
| `npm run build` padrão | EPERM ao remover `.output/server/chunks/_` | Falha ambiental de acesso à saída; causa específica do lock não atribuída a OneDrive sem prova |
| Build com `NITRO_OUTPUT_DIR` isolado | Exit 0, Build complete | Compilação de produção válida; saída Nitro 9,52 MB / 2,49 MB gzip, não equivalente ao download inicial |
| `npm run test:e2e` final | 5 falharam, 7 skipped | Expectativas/seletores incompatíveis com UI atual; ver abaixo |
| Diagnóstico de cálculos | 3 divergências reproduzidas | Conta sem vínculo passa filtro; vencimento hoje fica fora do KPI; `1.234,56` vira `1.234` |
| Browser desktop/mobile | Dashboard, Planilha e modal abriram | Responsividade parcial exercitada; não é homologação integral |

O build isolado usou `C:/Users/pedro/AppData/Local/Temp/planilha-revisao-20260904-output`. Logs brutos estão localmente em `evidencias/build.log`, `build-isolado.log`, `e2e.log` e `e2e-final.log`; `*.log` continua ignorado pelo Git. Os resultados necessários para a revisão estão resumidos neste Markdown.

O primeiro E2E encontrou o servidor de inspeção ativo em 3107 e recusou abrir outro Nuxt para o mesmo diretório. Esse conflito do procedimento foi resolvido encerrando o servidor de inspeção antes da execução final; não foi contado como defeito do produto. O build isolado terminou antes do E2E final.

## QA-01 — P1 — E2E não protege os fluxos atuais

Falhas finais:

1. Desktop, abrir todos os módulos: timeout procurando botão “Cartões e Contas”; navegação atual apresenta “Cartões”. Outros nomes da lista também precisam ser reconciliados com o produto.
2. Desktop, alternar Matriz/Lista: não encontra “Total” dentro de `.matrix-table`; o componente atual usa `.plan-table`.
3. Desktop, reordenar colunas: não encontra `.matrix-table .col-title`; o seletor de tabela está desatualizado.
4. Mobile Chrome, dívida expandida: timeout no helper `e2e/app.ts:6`, procurando “Recolher”.
5. Mobile amplo: mesmo bloqueio antes de abrir Dívidas.

Os sete skipped são condicionais de projeto já presentes nos testes, não sete sucessos. As falhas dos helpers impedem afirmar se os comportamentos seguintes passam. Corrigir sincronização esperando `app-ready`, usar navegação visível no viewport e seletores semânticos/contratos estáveis; manter a verificação real de reordenação e persistência. Não “corrigir” apagando asserts ou aumentando timeout sem causa.

Pipeline `.github/workflows/e2e.yml` executa E2E; não contém gates de lint, typecheck, unitários e build. Recomenda-se adicionar esses gates com a mesma versão Node definida para desenvolvimento. Não foi medida cobertura percentual; a ausência de teste de um fluxo não implica uma porcentagem inventada.

## Navegador

| Cenário | Observação |
|---|---|
| Dashboard desktop | Conteúdo carregado, navegação lateral visível |
| Dashboard 390×844 | Barra inferior e cards em duas colunas; vencimentos abaixo do gráfico |
| Planilha 390×844 | Documento 390 px de largura, 25.968 px de altura; 22 meses, início em maio/2026 |
| Planilha 320×740 | Documento 320 px de largura, 26.296 px de altura; sem overflow horizontal global |
| Planilha 768×1024 | Documento 768 px de largura, 2.227 px de altura; mudança para apresentação ampla |
| Adicionar despesa 390×844 | Abriu modal; linguagem fala em “coluna” mesmo no mobile; campos identificados por placeholder |

As medidas não provam ausência de overflow dentro de tabelas ou de falhas em outras telas. O teclado virtual não foi simulado. Capturas estão linkadas no documento de usabilidade.

Console local: avisos Nuxt de NuxtPage/NuxtLayout ainda não usados, consistentes com o gate `appReady` que inicialmente renderiza só loading; erros CORS na consulta ao manifesto Android de produção a partir de localhost. Esses erros não impediram carregar Dashboard/Planilha. Registrar como ruído/integração de desenvolvimento a investigar, sem inferir indisponibilidade do host de produção. O tempo mostrado pelo DevTools não é um Core Web Vital de produção.

## Reprodução dos cálculos

Executar da raiz:

```powershell
node docs/revisao-2026-09-04/evidencias/reproduzir-calculos.cjs
```

O script transpila e executa `shared/finance.ts` e dependências locais em contexto isolado e avalia a expressão monetária da Matriz. Saída desta revisão em [calculos.json](evidencias/calculos.json). Não escreve lançamentos. As datas usam o dia da execução; para regressão definitiva, criar testes com relógio injetado/fixo e expectativas do comportamento corrigido.

## Validações pendentes para homologação

| Área | Próxima verificação | Motivo |
|---|---|---|
| Supabase | Banco descartável com duas famílias, RLS e API | Confirmar isolamento e paridade dos adapters sem tocar dados reais |
| Histórico grande | Mais de 1.000 entradas e filtros paginados | Detectar truncamento e medir consultas/agregações |
| Offline | Falha no meio do lote, reload, logout/login e conflito | Garantir durabilidade e isolamento de fila/cache |
| Safari/iOS | Teclado, zoom, safe area, PWA instalado | Chromium com viewport não reproduz essas plataformas |
| Android físico | Web shell remoto e bundled, back, notificações e widget | Nenhum APK foi compilado/instalado nesta revisão |
| Acessibilidade | Teclado, NVDA/TalkBack/VoiceOver, contraste e auditoria automatizada | Inspeção estrutural não equivale a conformidade WCAG |
| UX completa | CRUD em todas as telas e pesquisa com tarefas reais | Inspeção visual concentrou-se nos fluxos centrais |
| Desempenho | Build servido, rede móvel, CPU limitada, métricas de campo | Tamanho de chunk não determina LCP/INP/CLS |
| Supply chain | Auditoria de dependências e advisories atuais | Não houve auditoria completa de CVEs |

## Pontos positivos a preservar

Shared sem Vue, abstração de repositório, testes de parser/regras, API autenticada via getUser no modo Supabase sem fallback demo, RLS nas migrações principais, preview de importação, mapas computados da matriz, import dinâmico de ExcelJS, breakpoints/cards mobile e safe area. Corrigir os contratos e a experiência sobre essa base tem menor risco que reescrever o projeto.
