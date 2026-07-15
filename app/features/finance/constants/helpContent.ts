// Conteúdo da Central de Ajuda.
// Fonte da verdade única: tanto a AjudaScreen quanto o botão "?" contextual
// leem deste arquivo. Para adicionar/alterar um tutorial, edite apenas aqui.
//
// `screenId` casa com o id usado na navegação (NAV_GROUPS em ui.ts) para que
// o atalho contextual saiba quais tópicos mostrar em cada tela.

export interface HelpStep {
  /** Nome de um ícone do BaseIcon (opcional) exibido ao lado do passo. */
  icon?: string
  /** Texto do passo. */
  text: string
}

export interface HelpTopic {
  id: string
  title: string
  steps: HelpStep[]
  /** Dica opcional exibida ao final do tópico. */
  tip?: string
}

export interface HelpGroup {
  /** Casa com o id da tela na navegação. */
  screenId: string
  label: string
  icon: string
  intro?: string
  topics: HelpTopic[]
}

export const HELP_CONTENT: HelpGroup[] = [
  {
    screenId: 'onboarding',
    label: 'Primeiros passos',
    icon: 'sparkle',
    intro: 'Escolha como deseja começar: importar o modelo Excel ou cadastrar as informações essenciais pelo aplicativo.',
    topics: [
      {
        id: 'modelo-excel',
        title: 'Importar o modelo Excel',
        steps: [
          { icon: 'export', text: 'Baixe o modelo e preencha as abas de contas, categorias, itens fixos e lançamentos.' },
          { icon: 'grid', text: 'Mantenha os títulos das colunas e use os nomes de contas e categorias exatamente como foram cadastrados nas abas correspondentes.' },
          { icon: 'check', text: 'Envie o arquivo preenchido, revise o resumo e confirme. Nada é salvo antes da confirmação.' },
        ],
        tip: 'A importação inicial protege contra duplicação: ela só fica disponível enquanto seu espaço ainda não tiver dados.',
      },
      {
        id: 'começar-manual',
        title: 'Começar pelo aplicativo',
        steps: [
          { icon: 'card', text: 'Cadastre primeiro os cartões, contas bancárias e benefícios que sua família utiliza.' },
          { icon: 'subscription', text: 'Inclua receitas e despesas fixas em Assinaturas para que os próximos meses sejam criados automaticamente.' },
          { icon: 'grid', text: 'Use a Planilha ou a Lista para registrar movimentações avulsas e acompanhar os pagamentos.' },
        ],
      },
    ],
  },
  {
    screenId: 'planilha',
    label: 'Planilha',
    icon: 'grid',
    intro: 'A Planilha é o coração do app: aqui você lança e acompanha despesas e receitas mês a mês, na visão Matriz (grade) ou Lista.',
    topics: [
      {
        id: 'alternar-matriz-lista',
        title: 'Alternar entre Matriz e Lista',
        steps: [
          { icon: 'grid', text: 'No topo da tela há dois botões: "Matriz" e "Lista".' },
          { icon: 'grid', text: 'A Matriz mostra todos os meses em grade (colunas = categorias).' },
          { icon: 'reports', text: 'A Lista mostra os lançamentos de um único mês, em forma de tabela.' },
        ],
      },
      {
        id: 'editar-valor',
        title: 'Editar um valor',
        steps: [
          { icon: 'grid', text: 'Na Matriz, clique na célula que deseja alterar.' },
          { icon: 'edit', text: 'Digite o novo valor e pressione Enter para salvar.' },
          { icon: 'close', text: 'Pressione Esc se quiser cancelar sem salvar.' },
        ],
        tip: 'Deixar o valor em branco (ou zero) remove aquele lançamento da célula.',
      },
      {
        id: 'status-despesa',
        title: 'Marcar uma despesa como paga ou não paga',
        steps: [
          { icon: 'grid', text: 'Localize a célula de despesa com valor.' },
          { icon: 'check', text: 'Clique na bolinha de status (●) ao lado do valor.' },
          { icon: 'expense', text: 'Verde = pago. Vermelho = não pago.' },
        ],
        tip: 'Clique novamente na bolinha para voltar ao estado anterior.',
      },
      {
        id: 'status-receita',
        title: 'Marcar uma receita como recebida ou pendente',
        steps: [
          { icon: 'income', text: 'Localize a célula de receita com valor (tabela de baixo).' },
          { icon: 'check', text: 'Clique na bolinha de status (●) ao lado do valor.' },
          { icon: 'balance', text: 'Verde = recebido. Amarelo = pendente.' },
        ],
        tip: 'Receitas novas começam sempre como pendentes (amarelo) até você confirmar o recebimento.',
      },
      {
        id: 'adicionar-coluna',
        title: 'Adicionar uma coluna (despesa ou receita)',
        steps: [
          { icon: 'plus', text: 'Clique em "+ Coluna" no canto direito do cabeçalho de Despesas ou Receitas.' },
          { icon: 'edit', text: 'Informe o nome (ex.: Aluguel, Salário) e, se quiser, um valor inicial.' },
          { icon: 'check', text: 'Clique em Adicionar.' },
        ],
      },
      {
        id: 'renomear-coluna',
        title: 'Renomear uma coluna',
        steps: [
          { icon: 'grid', text: 'Passe o mouse sobre o cabeçalho da coluna.' },
          { icon: 'menu', text: 'Clique no ícone de três pontinhos (⋮) que aparece.' },
          { icon: 'edit', text: 'Escolha "Renomear", digite o novo nome e confirme.' },
        ],
        tip: 'Todos os lançamentos com aquele título são renomeados de uma vez.',
      },
      {
        id: 'excluir-coluna',
        title: 'Excluir uma coluna',
        steps: [
          { icon: 'menu', text: 'No cabeçalho da coluna, clique nos três pontinhos (⋮).' },
          { icon: 'trash', text: 'Escolha "Excluir coluna".' },
          { icon: 'warning', text: 'Confirme — isso remove todos os lançamentos daquela coluna.' },
        ],
      },
      {
        id: 'excluir-mes',
        title: 'Excluir um mês inteiro (linha)',
        steps: [
          { icon: 'grid', text: 'Passe o mouse sobre a linha do mês que deseja excluir.' },
          { icon: 'trash', text: 'Clique no ícone de lixeira que aparece na primeira coluna (do mês).' },
          { icon: 'warning', text: 'Confirme — todos os lançamentos daquele mês serão removidos.' },
        ],
      },
      {
        id: 'escolher-mes-lista',
        title: 'Escolher o mês na visão Lista',
        steps: [
          { icon: 'reports', text: 'Entre na aba "Lista".' },
          { icon: 'chevron_left', text: 'Use as setas ‹ › para ir ao mês anterior ou seguinte.' },
          { icon: 'calendar', text: 'Ou clique no seletor central para escolher o mês direto.' },
        ],
      },
      {
        id: 'novo-lancamento',
        title: 'Criar um novo lançamento avulso',
        steps: [
          { icon: 'reports', text: 'Na aba "Lista", clique em "+ Novo lançamento".' },
          { icon: 'edit', text: 'Preencha descrição, valor, tipo (receita/despesa), conta e categoria.' },
          { icon: 'check', text: 'Salve. Ele aparecerá tanto na Lista quanto na Matriz.' },
        ],
      },
    ],
  },
  {
    screenId: 'subscriptions',
    label: 'Assinaturas',
    icon: 'subscription',
    intro: 'Cadastre serviços recorrentes (streaming, mensalidades) e o app gera os lançamentos automaticamente todo mês.',
    topics: [
      {
        id: 'criar-assinatura',
        title: 'Criar uma assinatura',
        steps: [
          { icon: 'plus', text: 'Clique no botão de nova assinatura no topo da tela.' },
          { icon: 'edit', text: 'Informe o nome (ex.: Netflix), o valor e o dia de vencimento.' },
          { icon: 'check', text: 'Salve — o lançamento mensal passa a ser gerado automaticamente.' },
        ],
        tip: 'O status que você marcar (pago/recebido) é preservado quando o app regenera os meses.',
      },
      {
        id: 'editar-assinatura',
        title: 'Editar uma assinatura',
        steps: [
          { icon: 'subscription', text: 'Clique na assinatura que deseja alterar.' },
          { icon: 'edit', text: 'Mude o nome, valor ou dia de vencimento.' },
          { icon: 'check', text: 'Salve para aplicar a mudança nos próximos meses.' },
        ],
      },
      {
        id: 'excluir-assinatura',
        title: 'Excluir uma assinatura',
        steps: [
          { icon: 'subscription', text: 'Abra a assinatura desejada.' },
          { icon: 'trash', text: 'Clique em excluir e confirme.' },
        ],
        tip: 'Excluir a assinatura interrompe a geração automática nos meses futuros.',
      },
    ],
  },
  {
    screenId: 'cartoes',
    label: 'Cartões e Contas',
    icon: 'card',
    intro: 'Cadastre seus cartões de crédito e contas bancárias para organizar de onde sai cada lançamento.',
    topics: [
      {
        id: 'adicionar-conta',
        title: 'Adicionar um cartão ou conta',
        steps: [
          { icon: 'plus', text: 'Clique em "Nova conta" no topo da tela.' },
          { icon: 'edit', text: 'Informe o nome, o responsável e o tipo (banco, cartão ou benefício).' },
          { icon: 'check', text: 'Para cartões, preencha limite, dia de fechamento e de vencimento.' },
        ],
      },
      {
        id: 'editar-conta',
        title: 'Editar um cartão ou conta',
        steps: [
          { icon: 'card', text: 'Clique no cartão/conta que deseja alterar.' },
          { icon: 'edit', text: 'Atualize os dados e salve.' },
        ],
      },
      {
        id: 'excluir-conta',
        title: 'Excluir um cartão ou conta',
        steps: [
          { icon: 'card', text: 'Abra o cartão/conta.' },
          { icon: 'trash', text: 'Clique em excluir e confirme.' },
        ],
      },
    ],
  },
  {
    screenId: 'wishlist',
    label: 'Lista de Desejos',
    icon: 'wishlist',
    intro: 'Anote o que você quer comprar, defina prioridades e acompanhe quanto precisa guardar.',
    topics: [
      {
        id: 'adicionar-desejo',
        title: 'Adicionar um item',
        steps: [
          { icon: 'plus', text: 'Clique em "Adicionar item".' },
          { icon: 'edit', text: 'Informe o nome, o valor estimado e a prioridade.' },
          { icon: 'check', text: 'Salve para acompanhar na lista.' },
        ],
      },
      {
        id: 'priorizar-desejo',
        title: 'Definir prioridade e status',
        steps: [
          { icon: 'wishlist', text: 'Abra o item desejado.' },
          { icon: 'tag', text: 'Escolha a prioridade (alta, média, baixa) e o status (quero / guardando).' },
          { icon: 'check', text: 'Salve.' },
        ],
      },
      {
        id: 'comprar-excluir-desejo',
        title: 'Marcar como comprado ou excluir',
        steps: [
          { icon: 'check', text: 'Marque o item como "Comprado" quando adquiri-lo.' },
          { icon: 'trash', text: 'Ou clique em excluir para removê-lo da lista.' },
        ],
      },
    ],
  },
  {
    screenId: 'debts',
    label: 'Dívidas e Parcelas',
    icon: 'debt',
    intro: 'Lançamentos com mais de uma parcela aparecem aqui automaticamente, agrupados por dívida.',
    topics: [
      {
        id: 'acompanhar-dividas',
        title: 'Acompanhar suas dívidas',
        steps: [
          { icon: 'debt', text: 'A tela lista cada dívida e quantas parcelas já foram pagas.' },
          { icon: 'reports', text: 'Os indicadores no topo mostram o total parcelado e o que já foi quitado.' },
        ],
        tip: 'Para criar uma dívida, lance uma despesa com 2 ou mais parcelas na Planilha ou na Lista.',
      },
      {
        id: 'pagar-parcela',
        title: 'Marcar uma parcela como paga',
        steps: [
          { icon: 'debt', text: 'Abra o grupo da dívida desejada.' },
          { icon: 'check', text: 'Clique em "Pagar" (ou "Receber") na parcela correspondente.' },
        ],
      },
    ],
  },
  {
    screenId: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    intro: 'Visão geral rápida da sua situação financeira no mês atual.',
    topics: [
      {
        id: 'entender-indicadores',
        title: 'Entender os indicadores',
        steps: [
          { icon: 'income', text: 'Receitas e despesas do mês aparecem em destaque no topo.' },
          { icon: 'balance', text: 'O saldo líquido mostra quanto sobra (verde) ou falta (vermelho).' },
          { icon: 'reports', text: 'Os gráficos resumem a evolução e a distribuição por categoria.' },
        ],
      },
      {
        id: 'navegar-dashboard',
        title: 'Ir para outras áreas',
        steps: [
          { icon: 'dashboard', text: 'Use os cartões e atalhos para pular direto para a Planilha, Alertas, etc.' },
          { icon: 'menu', text: 'O menu lateral dá acesso a todas as telas a qualquer momento.' },
        ],
      },
    ],
  },
  {
    screenId: 'reports',
    label: 'Relatórios',
    icon: 'reports',
    intro: 'Gráficos detalhados de fluxo de caixa, categorias e projeções.',
    topics: [
      {
        id: 'ler-graficos',
        title: 'Ler os gráficos',
        steps: [
          { icon: 'reports', text: 'Cada gráfico mostra um recorte: fluxo de caixa, gastos por categoria, uso dos cartões.' },
          { icon: 'info', text: 'Passe o mouse sobre as barras/fatias para ver os valores exatos.' },
        ],
      },
      {
        id: 'filtrar-periodo',
        title: 'Filtrar o período',
        steps: [
          { icon: 'calendar', text: 'Use os seletores de período (mês, trimestre, ano) para mudar o recorte.' },
          { icon: 'refresh', text: 'Os gráficos se atualizam automaticamente.' },
        ],
      },
    ],
  },
  {
    screenId: 'planning',
    label: 'Planejamento Anual',
    icon: 'planning',
    intro: 'Veja o ano inteiro de uma vez para planejar metas e antecipar meses apertados.',
    topics: [
      {
        id: 'visao-anual',
        title: 'Usar a visão anual',
        steps: [
          { icon: 'planning', text: 'A tela projeta receitas, despesas e sobra para os próximos meses.' },
          { icon: 'warning', text: 'Meses com saldo negativo ficam destacados para você se planejar.' },
        ],
      },
    ],
  },
  {
    screenId: 'alerts',
    label: 'Alertas Inteligentes',
    icon: 'alerts',
    intro: 'O app analisa seus lançamentos e avisa sobre vencimentos próximos e situações de atenção.',
    topics: [
      {
        id: 'entender-alertas',
        title: 'Entender os alertas',
        steps: [
          { icon: 'alerts', text: 'Cada alerta descreve uma situação: conta a vencer, gasto fora do padrão, etc.' },
          { icon: 'info', text: 'O número vermelho no menu indica quantos alertas estão ativos.' },
        ],
      },
      {
        id: 'agir-alerta',
        title: 'Agir sobre um alerta',
        steps: [
          { icon: 'alerts', text: 'Clique no alerta para ver os detalhes do lançamento relacionado.' },
          { icon: 'check', text: 'Marque como pago/recebido direto dali, se for o caso.' },
        ],
      },
    ],
  },
  {
    screenId: 'config',
    label: 'Configurações',
    icon: 'settings',
    intro: 'Ajuste a aparência e as preferências do aplicativo.',
    topics: [
      {
        id: 'trocar-tema',
        title: 'Trocar o tema (claro/escuro)',
        steps: [
          { icon: 'settings', text: 'Abra Configurações no menu lateral.' },
          { icon: 'sparkle', text: 'Escolha o tema desejado (claro, escuro ou automático).' },
          { icon: 'check', text: 'A mudança é aplicada na hora.' },
        ],
      },
      {
        id: 'preferencias',
        title: 'Outras preferências',
        steps: [
          { icon: 'settings', text: 'Ajuste densidade, modo de período e demais opções disponíveis.' },
        ],
      },
    ],
  },
]

/** Retorna o grupo de ajuda de uma tela específica (ou undefined). */
export const helpForScreen = (screenId: string): HelpGroup | undefined =>
  HELP_CONTENT.find((group) => group.screenId === screenId)
