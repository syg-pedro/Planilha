# Migração para UI neo-brutalista

Branch de implementação: `feat/neo-brutalism-ui`

## Objetivo

Aplicar uma linguagem neo-brutalista funcional a todas as superfícies do Financeiro Familiar sem alterar regras financeiras, contratos de API ou dados persistidos. Os temas existentes continuam disponíveis como paletas; a estrutura visual é compartilhada por todos eles.

## Diagnóstico inicial

- 13 telas financeiras, 16 componentes base e fluxos separados de autenticação.
- 824 ocorrências de estilos inline em 35 componentes.
- 116 botões, 40 inputs e 7 tabelas implementados diretamente nas telas.
- `BaseButton`, `BaseInput` e `BaseBadge` não eram usados pelas telas.
- Somente seis componentes possuíam stories.
- O sistema já centralizava cores, mas bordas, raios, sombras, tipografia e estados interativos ainda estavam distribuídos.

## Direção visual

- Fonte principal: Space Grotesk.
- Valores e dados tabulares: IBM Plex Mono.
- Bordas: 2 px; 3 px em shells, modais e superfícies de alta hierarquia.
- Sombras: sólidas e sem blur, com offsets de 3, 5 e 8 px.
- Raios: 2–12 px; pills reservadas para dados compactos que realmente exigem essa forma.
- Ações pressionadas: deslocamento físico e redução da sombra.
- Foco: contorno amarelo de 3 px, independente da paleta.
- Cores de estado continuam semânticas: receita, despesa, atenção e informação.
- Gradientes decorativos foram substituídos por blocos de cor sólida.

## Estratégia

1. Centralizar tokens estruturais e semânticos em `tokens.css`.
2. Criar uma ponte visual para telas legadas enquanto os estilos inline são reduzidos.
3. Refatorar componentes base antes das telas consumidoras.
4. Migrar shell, autenticação, dashboard e alertas como referências de composição.
5. Normalizar tabelas, gráficos, modais, sheets, cards e configurações.
6. Atualizar a tela de Design System e o Storybook.
7. Validar typecheck, regras financeiras, build e lint.

## Compatibilidade

- `ThemeMode` e os valores persistidos não mudam.
- Light, dark, EVA, Cyberpunk, Arasaka, custom e system continuam válidos.
- O tema customizado mantém as mesmas chaves de cor.
- Nenhum endpoint, migration, tipo de domínio ou regra financeira faz parte desta mudança.
- Layout mobile, safe areas e tamanhos mínimos de toque permanecem suportados.

## Critérios de aceite

- Todos os temas exibem bordas e texto com contraste legível.
- Botões, campos, menus, modais e sheets têm foco visível e estado pressionado.
- Dashboard, planilha, relatórios, cartões, assinaturas, dívidas, desejos, alertas, ajuda e configurações usam a mesma estrutura visual.
- Valores financeiros usam numerais tabulares onde são componentes centrais.
- Nenhum gradiente decorativo permanece nos cartões financeiros.
- Typecheck, testes unitários e build de produção passam.
- O Storybook cobre ações, painéis, campos, badges, KPIs, alertas, progresso e estados vazios.

## Rollout recomendado

Publicar a branch em preview, validar primeiro em 390 px, 768 px e 1440 px e revisar light/dark. Depois, conferir EVA, Cyberpunk, Arasaka e custom. A integração em `main` deve ocorrer somente após uma rodada de uso real nos fluxos de lançamento, edição, pagamento e configuração de tema.
