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
    ],
  },
  {
    id: 'control',
    label: 'Controle',
    items: [
      { id: 'subscriptions', label: 'Assinaturas', icon: 'subscription' },
      { id: 'cartoes', label: 'Cartões e Contas', icon: 'card' },
      { id: 'wishlist', label: 'Lista de Desejos', icon: 'wishlist' },
    ],
  },
  {
    id: 'commitments',
    label: 'Compromissos',
    items: [
      { id: 'debts', label: 'Dívidas e Parcelas', icon: 'debt' },
    ],
  },
  {
    id: 'analysis',
    label: 'Análise',
    items: [
      { id: 'alerts', label: 'Alertas Inteligentes', icon: 'alerts' },
    ],
  },
]

export const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'planilha', label: 'Planilha', icon: 'grid' },
  { id: 'alerts', label: 'Alertas', icon: 'alerts' },
] as const

export const SETTINGS_ITEM = { id: 'config', label: 'Configurações', icon: 'settings' } as const
export const DS_ITEM = { id: 'design-system', label: 'Design System', icon: 'sparkle' } as const
export const ONBOARDING_ITEM = { id: 'onboarding', label: 'Primeiros passos', icon: 'sparkle' } as const
export const HELP_ITEM = { id: 'help', label: 'Ajuda', icon: 'help' } as const
export const CHANGELOG_ITEM = { id: 'changelog', label: 'Novidades', icon: 'refresh' } as const

export const ALL_NAV_ITEMS = [
  ...NAV_GROUPS.flatMap(g => g.items),
  ONBOARDING_ITEM,
  HELP_ITEM,
  CHANGELOG_ITEM,
  SETTINGS_ITEM,
  DS_ITEM,
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
