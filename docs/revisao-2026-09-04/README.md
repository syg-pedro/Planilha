# Revisão do Financeiro Familiar — 04/09/2026

Branch: `codex/revisao-completa-web-mobile`, criada a partir de `19b1c17`.

**Recomendação principal:** proteger gravações e corrigir consistência financeira; em seguida, simplificar a jornada mobile para mês atual → vencimentos → novo lançamento. A arquitetura existente permite evolução incremental.

Atualização Android: emulador configurado com WHPX/RTX 3090 e testes no APK executados. Falha com teclado corrigida com tratamento de insets e validada no APK API 36: dois ciclos de teclado e gravação por toque passaram. Veja [08 — Emulador Android](08-emulador-android.md).

**Relatório consolidado:** [ajustes resumidos, prints web/mobile e validações](09-relatorio-consolidado-com-prints.md).

**Homologação publicada:** [web](https://planilha-homol.vercel.app) · [APK Homol](https://planilha-homol.vercel.app/downloads/Financeiro-Homol.apk). Banco compartilhado com produção por decisão do usuário. [Relatório de entrega](11-homologacao-publicada.md).

## Estado após autorização das correções

As correções foram implementadas nesta mesma branch. Veja [06 — Correções aplicadas, testes e pendências de publicação](06-correcoes-aplicadas.md). Os documentos 02, 03 e 04 agora começam com o estado implementado nesta continuação. As seções seguintes preservam o diagnóstico inicial; suas falhas e referências de linha não representam automaticamente o estado atual.

A migração também foi aplicada no Supabase, com testes autenticados: [07 — Resultado remoto e limitações](07-migracao-remota.md). O código da branch ainda não foi publicado.

Continuação 02–04: melhorias no editor e na navegação mobile, extração de composables e componentes, 39 testes unitários e 13 E2E aprovados. Builds de produção e Storybook passaram. Permanecem pendências de dependências e homologação em dispositivos reais, detalhadas no documento 04.

## Documentos

1. [Achados técnicos e funcionais](01-achados-tecnicos.md): 21 achados com evidência, prioridade, impacto e validação recomendada.
2. [Usabilidade web/mobile](02-usabilidade-web-mobile.md): seis grupos de problemas, recomendações por tela e capturas.
3. [Arquitetura, arquivos grandes e composables](03-arquitetura-composables.md): inventário, contratos e divisão proposta.
4. [Validação e cobertura](04-validacao-e-cobertura.md): resultados reais, reprodução, limites e homologação pendente.
5. [Plano de melhoria](05-plano-de-melhoria.md): ordem de implementação, PRs sugeridos e critérios de sucesso.

6. [Correções aplicadas](06-correcoes-aplicadas.md): alterações efetivas, redução de arquivos, testes e limitações.

## Achados prioritários do diagnóstico inicial

- **P0:** delete/upsert com credencial de serviço sem isolamento suficiente de IDs por família.
- **P1:** edição parcial pode apagar vínculo/origem/metadados no Supabase; fila offline é apagada antes do ACK e não é particionada por usuário.
- **P1:** relatórios incluem futuro, telas divergem sobre exclusões/benefícios e valor `1.234,56` é interpretado como `1.234` na Matriz.
- **P1 de experiência:** planilha mobile renderiza 22 meses e cerca de 26 mil pixels de altura, começando antes do mês atual; edição agregada pode apagar registros individuais.
- **Acessibilidade:** diálogos, labels e navegação por teclado precisam de contrato comum.

## Verificações do diagnóstico inicial

12 testes unitários passaram; typecheck passou; lint sem erros e com um warning. Build passou em saída isolada após EPERM na saída padrão. E2E: cinco falhas e sete skips, detalhados no documento de validação. Browser exercitado em desktop e larguras 320, 390 e 768 px.

Esta é uma revisão ampla do código disponível com validação local parcial. Os documentos distinguem execução, inspeção de código, riscos e recomendações. Não houve homologação em dispositivo físico, auditoria do banco remoto, medição de Web Vitals ou certificação de acessibilidade.

Após este diagnóstico, o usuário autorizou as correções. O documento 06 registra o que foi implementado e o que permanece pendente. O `.gitignore` recebeu exceção apenas para esta pasta de revisão, pois `docs/` inteiro estava ignorado; demais documentos locais continuam ignorados.

## Homologação separada

[10 — Preparação do ambiente e APK homol](10-ambiente-homologacao.md): coexistência validada, projeto Vercel criado; banco, URL e APK funcional pendentes.
