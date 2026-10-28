export const textos = {
  accounts: { titulo: 'Contas e cartões', descricao: 'Onde o dinheiro entra, sai e se organiza.', singular: 'conta', adicionar: 'Adicionar conta', vazio: 'Cadastre a primeira conta da família.' },
  categories: { titulo: 'Categorias', descricao: 'Um lugar claro para cada receita e despesa.', singular: 'categoria', adicionar: 'Adicionar categoria', vazio: 'Crie categorias para entender seus gastos.' },
  rules: { titulo: 'Recorrências e assinaturas', descricao: 'Prepare os compromissos que voltam a cada mês.', singular: 'recorrência', adicionar: 'Adicionar recorrência', vazio: 'Cadastre os compromissos que se repetem.' },
  wishlist: { titulo: 'Lista de desejos', descricao: 'Dê espaço aos planos antes de decidir a compra.', singular: 'desejo', adicionar: 'Adicionar desejo', vazio: 'Guarde o primeiro plano da família.' }
}

export const tiposConta = [
  { value: 'bank', label: 'Conta bancária' }, { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'benefit', label: 'Benefício' }, { value: 'external', label: 'Conta externa' }
]
export const frequencias = [{ value: 'monthly', label: 'Mensal' }, { value: 'manual', label: 'Somente manual' }]
export const prioridades = [{ value: 'high', label: 'Alta' }, { value: 'medium', label: 'Média' }, { value: 'low', label: 'Baixa' }]
export const situacoesDesejo = [{ value: 'want', label: 'Quero comprar' }, { value: 'saving', label: 'Estou guardando' }, { value: 'bought', label: 'Já comprei' }]
export const rotulos = {
  nome: 'Nome', responsavel: 'Responsável', tipo: 'Tipo de conta', valor: 'Valor (R$)', limite: 'Limite do cartão (R$)',
  fechamento: 'Dia do fechamento', vencimento: 'Dia do vencimento', ativa: 'Conta ativa', descricao: 'Descrição',
  natureza: 'Receita ou despesa', frequencia: 'Repetição', inicio: 'Início', fim: 'Fim (opcional)',
  automatica: 'Gerar lançamentos automaticamente', conta: 'Conta', categoria: 'Categoria', cor: 'Cor da categoria',
  metadados: 'Informações adicionais (JSON, opcional)', url: 'Link do produto (opcional)', imagem: 'Link da imagem (opcional)',
  observacoes: 'Observações', prioridade: 'Prioridade', situacao: 'Situação', categoriaTexto: 'Grupo do desejo (opcional)',
  salvar: 'Salvar', cancelar: 'Cancelar', editar: 'Editar', excluir: 'Excluir', buscar: 'Buscar pelo nome',
  semConta: 'Sem conta', semCategoria: 'Sem categoria', aDefinir: 'A definir', semResultado: 'Nenhum resultado com esses filtros',
  ajustarFiltros: 'Ajuste a busca ou os filtros para ver seus registros.', gerar: 'Atualizar lançamentos recorrentes',
  gerarDescricao: 'A geração considera o mês atual e os próximos meses. Pagamentos e histórico são preservados. Lançamentos automáticos não pagos podem ser atualizados ou removidos dentro do horizonte escolhido.',
  horizonte: 'Quantidade de meses', datasInformativas: 'As datas de início e fim são informativas. A geração ainda considera o mês atual e o horizonte escolhido.',
  semDia: 'Sem dia de vencimento, esta recorrência não gera lançamentos.',
  geracaoConcluida: 'Lançamentos recorrentes atualizados.', linksGuardados: 'Os links ficam guardados para consulta. Nenhuma imagem é carregada automaticamente.'
}
