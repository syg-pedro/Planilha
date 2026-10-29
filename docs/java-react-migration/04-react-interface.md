# Contrato de interface React

Direção: ferramenta financeira de uso diário, com leitura de valores como em um livro-caixa. Nome Planilha. Componentes de interação HeroUI v3; React19, Tailwind4 e estilos oficiais conforme [instalação](https://heroui.com/en/docs/react/getting-started/quick-start). Referências funcionais são as telas originais do projeto; não copiar branding externo. O layout proposto será verificado no navegador antes de considerar a interface pronta.

## Hierarquia e aparência

Navegação lateral persistente no desktop, agrupada por rotina financeira, organização e preferências. Cabeçalho identifica família, período e ação principal. Fundo suave, superfícies limpas, bordas discretas, verde do produto como destaque e valores tabulares. Títulos têm maior contraste, sem competir com os números. Nenhuma imagem remota é necessária. Espaçamento em escala de4px e tokens semânticos centralizados; nada de cores hexadecimais espalhadas em componentes.

Dashboard começa com saldo, receitas, despesas e pendências em uma faixa de indicadores. Fluxo de caixa recebe mais espaço que os resumos auxiliares. Próximos vencimentos possuem ação acessível para abrir o lançamento. Cada gráfico mantém seu próprio filtro; alterar conta/período em um gráfico não altera outro. Valores do servidor são a fonte de verdade.

Listagens priorizam busca, filtros legíveis, resultado e ações por linha. Planilha mensal preserva a exploração por conta/regra/parcela. Formulários usam labels visíveis, validação junto ao campo e resumo amigável de falha. Modal HeroUI cuida de foco, Escape e teclado. Exclusão pede confirmação com nome/impacto concreto. A ação de salvar permanece indisponível enquanto a requisição estiver pendente.

## Telas e responsabilidades

| Grupo | Fluxos |
| --- | --- |
| Rotina | Dashboard, lançamentos, planilha mensal, pagar/desfazer, repetição e parcelamento |
| Organização | Contas/cartões, categorias, recorrências/assinaturas e reconstrução |
| Planejamento | Dívidas parceladas, visão anual/projeções, relatórios e desejos |
| Preparação | CSV e modelo Excel, prévia, avisos e onboarding |
| Preferências | Tema claro/escuro/sistema/customizado, densidade, período, horizonte, notificações web e widgets |
| Acesso | Cadastro, login, sessão, membros e convites familiares locais |

React Router define páginas; TanStack Query gerencia dados/cache/invalidação; React Hook Form e Zod gerenciam formulários. Contexto pequeno para identidade/tema, sem Zustand enquanto não existir uma necessidade real. Não copiar o estado completo do servidor para um segundo store global. Tipos compartilhados puros podem ser reutilizados; cálculos financeiros pertencem ao Java.

## Estados e responsividade

Carregamento preserva estrutura com skeleton; vazio explica a ação inicial; erro mostra mensagem amigável e tentativa novamente; permissão insuficiente não expõe IDs ou detalhes técnicos. Login expirado limpa cache da família antes de pedir nova sessão. Troca de família também limpa o cache, evitando dados residuais.

Em320px, navegação recolhe, filtros quebram em linhas e formulários viram uma coluna. Tabelas largas têm rolagem limitada à própria região, com indicação acessível. Controles principais permanecem utilizáveis por toque e teclado. Validar320/768/1024/1440px nos temas claro/escuro; preferência reduced-motion elimina animação não essencial. Não depender apenas de cor para receita/despesa/status.

## Prova de conclusão

Build/typecheck e testes de lógica; E2E com PostgreSQL e dados fictícios cobrindo operações reais; inspeção visual desktop/mobile e claro/escuro; console sem falhas inesperadas. Instalar HeroUI ou obter HTTP200 não comprova conclusão de tela. Android nativo React continua apenas avaliação futura da especificação.
