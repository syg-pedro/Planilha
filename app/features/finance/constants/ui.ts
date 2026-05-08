export const NAV_GROUPS = [
  {
    id: 'overview',
    label: 'Visão Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'reports', label: 'Relatórios', icon: 'reports' },
      { id: 'planning', label: 'Planejamento Anual', icon: 'planning' },
    ],
  },
  {
    id: 'finance',
    label: 'Finanças',
    items: [
      { id: 'planilha', label: 'Planilha', icon: 'grid' },
      { id: 'reconcile', label: 'Conciliação', icon: 'reconcile' },
    ],
  },
  {
    id: 'control',
    label: 'Controle',
    items: [
      { id: 'budget', label: 'Orçamentos', icon: 'budget' },
      { id: 'goals', label: 'Metas', icon: 'goal' },
      { id: 'subscriptions', label: 'Assinaturas', icon: 'subscription' },
    ],
  },
  {
    id: 'commitments',
    label: 'Compromissos',
    items: [
      { id: 'debts', label: 'Dívidas e Parcelas', icon: 'debt' },
      { id: 'patrimony', label: 'Patrimônio', icon: 'patrimony' },
    ],
  },
  {
    id: 'analysis',
    label: 'Análise',
    items: [
      { id: 'scenarios', label: 'Cenários', icon: 'scenario' },
      { id: 'alerts', label: 'Alertas Inteligentes', icon: 'alerts' },
    ],
  },
] as const

export const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'budget', label: 'Orçamentos', icon: 'budget' },
  { id: 'goals', label: 'Metas', icon: 'goal' },
  { id: 'alerts', label: 'Alertas', icon: 'alerts' },
] as const

export const SETTINGS_ITEM = { id: 'config', label: 'Configurações', icon: 'settings' } as const
export const DS_ITEM = { id: 'design-system', label: 'Design System', icon: 'sparkle' } as const

export const ALL_NAV_ITEMS = [
  ...NAV_GROUPS.flatMap(g => g.items),
  SETTINGS_ITEM,
  DS_ITEM,
  { id: 'planilha', label: 'Planilha', icon: 'grid' },
] as const

// Legacy — kept for any existing usages
export const FINANCE_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planilha', label: 'Planilha' },
  { id: 'calendario', label: 'Calendario' },
  { id: 'config', label: 'Configuracoes' },
] as const

export const RANGE_OPTIONS = [
  { value: 'month', label: 'Mensal' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: 'Anual' },
] as const
