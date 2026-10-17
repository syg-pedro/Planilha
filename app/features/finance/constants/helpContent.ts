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
    intro: 'Comece com um lançamento na Planilha. Você pode cadastrar contas ou importar dados quando precisar.',
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
          { icon: 'plus', text: 'Abra a Planilha e escolha Novo lançamento. Informe descrição, valor e vencimento.' },
          { icon: 'card', text: 'Escolha uma conta existente ou cadastre suas contas em Contas e cartões. A conta pode ser preenchida depois.' },
          { icon: 'grid', text: 'Acompanhe o mês na Planilha e confirme os pagamentos. Use Assinaturas, em Mais ferramentas, para configurar recorrências.' },
        ],
      },
    ],
  },
  {
    screenId: 'planilha',
    label: 'Planilha',
    icon: 'grid',
    intro: 'Registre e acompanhe receitas, despesas e pagamentos. Escolha um mês para trabalhar ou compare o período na Planilha.',
    topics: [
      {
        id: 'alternar-matriz-lista',
        title: 'Escolher a visualização da planilha',
        steps: [
          { icon: 'grid', text: 'Escolha Planilha para organizar valores por mês ou Lista para consultar cada lançamento.' },
          { icon: 'calendar', text: 'No período, escolha Um mês, Comparar 3 meses ou Visão anual. Use o seletor de mês, as setas ou Hoje para navegar.' },
          { icon: 'reports', text: 'No celular, a Planilha começa com um mês para facilitar a leitura. Toque em um valor para consultar ou editar seus lançamentos.' },
        ],
      },
      {
        id: 'filtrar-lancamentos',
        title: 'Encontrar e filtrar lançamentos',
        steps: [
          { icon: 'search', text: 'Digite uma descrição na busca para localizar os lançamentos.' },
          { icon: 'settings', text: 'Abra Filtros para escolher a data de referência, o tipo, o status ou uma conta.' },
          { icon: 'calendar', text: 'Vencimento/recebimento organiza pela data de pagamento esperada. Competência usa o mês ao qual a movimentação pertence.' },
        ],
        tip: 'Confira os filtros ativos e o período indicado antes de comparar valores.',
      },
      {
        id: 'editar-valor',
        title: 'Consultar e editar uma célula',
        steps: [
          { icon: 'grid', text: 'Clique na célula para abrir sua composição. O número pequeno ao lado do valor indica quantos lançamentos foram somados.' },
          { icon: 'edit', text: 'Use Editar no lançamento desejado. No desktop, duplo clique ou F2 abre diretamente a edição quando a célula contém um único lançamento.' },
          { icon: 'check', text: 'Revise os campos e clique em Salvar. Para uma célula vazia, duplo clique ou F2 abre um novo lançamento naquele mês.' },
        ],
        tip: 'Editar um item da fatura preserva os demais. O traço significa ausência de lançamento; 0,00 significa um registro com valor zero.',
      },
      {
        id: 'status-despesa',
        title: 'Marcar uma despesa como paga ou não paga',
        steps: [
          { icon: 'grid', text: 'Clique na célula de despesa para abrir seus lançamentos.' },
          { icon: 'check', text: 'No item desejado, clique em Marcar pago ou Marcar pendente.' },
          { icon: 'expense', text: 'Na grade: ✓ = pago; ○ = pendente; ◐ = parcialmente quitado; ! = revisar.' },
        ],
        tip: 'Uma célula com vários itens mostra pagamento parcial quando apenas parte dos lançamentos está paga.',
      },
      {
        id: 'status-receita',
        title: 'Marcar uma receita como recebida ou pendente',
        steps: [
          { icon: 'income', text: 'Localize a receita na mesma grade e clique no mês desejado.' },
          { icon: 'check', text: 'No painel de composição, clique em Marcar recebido ou Marcar pendente.' },
          { icon: 'balance', text: 'O resumo Ainda a receber acompanha as receitas que continuam pendentes.' },
        ],
        tip: 'Novos lançamentos começam pendentes. A sobra prevista considera receitas cadastradas, mesmo antes do recebimento.',
      },
      {
        id: 'adicionar-coluna',
        title: 'Adicionar uma despesa ou receita',
        steps: [
          { icon: 'plus', text: 'Clique em + Novo lançamento ou no + do grupo de despesas ou receitas.' },
          { icon: 'edit', text: 'Informe descrição, valor, conta, categoria e datas. Escolha o tipo correto.' },
          { icon: 'check', text: 'Salve. Despesas de cartão entram na fatura da conta; os demais itens aparecem nas suas linhas.' },
        ],
      },
      {
        id: 'renomear-coluna',
        title: 'Renomear e organizar linhas',
        steps: [
          { icon: 'menu', text: 'Na visualização Planilha, abra os três pontinhos ao lado da descrição da linha.' },
          { icon: 'edit', text: 'Use Renomear para alterar a descrição do grupo. Em cartões, use Editar cartão.' },
          { icon: 'grid', text: 'Use Mover para cima ou Mover para baixo para organizar a leitura dentro de cada grupo.' },
        ],
        tip: 'Renomear afeta todos os lançamentos daquele grupo, inclusive fora do período visível. Itens de outras contas ou recorrências continuam separados.',
      },
      {
        id: 'excluir-coluna',
        title: 'Excluir lançamentos de uma linha',
        steps: [
          { icon: 'menu', text: 'Na visualização Planilha, abra os três pontinhos ao lado da linha.' },
          { icon: 'trash', text: 'Escolha Excluir lançamentos e leia a quantidade de itens abrangidos.' },
          { icon: 'warning', text: 'A confirmação remove os lançamentos do grupo, inclusive os que estão fora do período. Para remover apenas um item, abra sua edição.' },
        ],
      },
      {
        id: 'excluir-mes',
        title: 'Ocultar meses ou zerar seus valores',
        steps: [
          { icon: 'menu', text: 'Na visualização Planilha, abra os três pontinhos no cabeçalho do mês para ver suas ações.' },
          { icon: 'grid', text: 'Ocultar meses muda apenas sua visualização. Use Mostrar meses ocultos para restaurar as colunas.' },
          { icon: 'warning', text: 'Zerar valores exige confirmação e mantém os registros com valor zero, pela data escolhida na matriz.' },
        ],
      },
      {
        id: 'periodo-resumo-matriz',
        title: 'Entender o período e o resumo mensal',
        steps: [
          { icon: 'calendar', text: 'Escolha Um mês, Comparar 3 meses ou Visão anual. Use o seletor de mês e as setas; Hoje retorna ao mês atual.' },
          { icon: 'balance', text: 'O rodapé da Planilha mostra despesas, receitas e sobra prevista. Confira também o resumo do mês e os detalhes de valores pagos e pendentes.' },
          { icon: 'grid', text: 'Confira o período indicado junto aos totais. Benefícios e itens excluídos ficam no grupo Fora do saldo.' },
        ],
        tip: 'Sobra prevista não é saldo bancário. Meses sem receitas ou despesas recebem um aviso para ajudar a identificar cadastros incompletos.',
      },
      {
        id: 'limites-matriz',
        title: 'Consultar vencimentos e limites dos cartões',
        steps: [
          { icon: 'card', text: 'Toque na fatura para consultar limite, fechamento e disponível estimado. Em Filtros, ative Mostrar limites e totais por linha quando precisar dessas informações na grade.' },
          { icon: 'grid', text: 'Clique na célula de uma fatura para consultar os itens, fechamento, vencimento, limite e comprometimento registrado.' },
          { icon: 'balance', text: 'O disponível estimado desconta todas as despesas pendentes do cartão, inclusive parcelas futuras fora do período.' },
        ],
        tip: 'O limite disponível é uma estimativa dos registros do aplicativo; ele não consulta o banco.',
      },
      {
        id: 'leitura-selecao-matriz',
        title: 'Ajustar a leitura e somar células',
        steps: [
          { icon: 'grid', text: 'A Planilha usa densidade compacta. Ampliar ocupa a tela; Reduzir ou Esc retorna.' },
          { icon: 'search', text: 'A busca filtra descrições e contas. Quando houver filtros, os totais indicam os lançamentos filtrados. Recolha grupos pelo título para concentrar a leitura.' },
          { icon: 'balance', text: 'Ative Selecionar células e toque nos valores desejados para somá-los. Concluir encerra a seleção; no desktop, Shift e arrastar também selecionam intervalos.' },
        ],
        tip: 'No celular, escolha Comparar 3 meses ou Visão anual quando precisar comparar períodos. Na grade, as descrições ficam fixas; no desktop, as setas do teclado navegam entre células.',
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
          { icon: 'check', text: 'Salve. Ele aparecerá nas visualizações Lista e Planilha.' },
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
    label: 'Contas e cartões',
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
    label: 'Resumo',
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
          { icon: 'menu', text: 'No computador, use o menu lateral. No celular, Planilha, Resumo e Contas estão na barra inferior; as demais ferramentas ficam em Mais.' },
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
          { icon: 'settings', text: 'Abra Configurações no rodapé do menu lateral ou em Mais, no celular.' },
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
