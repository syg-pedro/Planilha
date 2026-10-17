export const PRIMARY_NAV_ITEMS = [
  { id: 'planilha', label: 'Planilha', icon: 'grid' },
  { id: 'dashboard', label: 'Resumo', icon: 'dashboard' },
  { id: 'cartoes', label: 'Contas e cartões', icon: 'card' },
  { id: 'reports', label: 'Relatórios', icon: 'reports' },
] as const

export const SECONDARY_NAV_ITEMS = [
  { id: 'planning', label: 'Planejamento anual', icon: 'planning' },
  { id: 'debts', label: 'Dívidas e parcelas', icon: 'debt' },
  { id: 'subscriptions', label: 'Assinaturas', icon: 'subscription' },
  { id: 'wishlist', label: 'Lista de desejos', icon: 'wishlist' },
  { id: 'alerts', label: 'Alertas', icon: 'alerts' },
] as const

export const NAV_GROUPS = [
  { id: 'daily', label: '', items: PRIMARY_NAV_ITEMS },
  { id: 'more', label: 'Mais ferramentas', items: SECONDARY_NAV_ITEMS },
] as const

export const BOTTOM_NAV_ITEMS = [
  PRIMARY_NAV_ITEMS[0],
  PRIMARY_NAV_ITEMS[1],
  { ...PRIMARY_NAV_ITEMS[2], label: 'Contas' },
] as const

export const SETTINGS_ITEM = { id: 'config', label: 'Configurações', icon: 'settings' } as const
export const DS_ITEM = { id: 'design-system', label: 'Design System', icon: 'sparkle' } as const
export const ONBOARDING_ITEM = { id: 'onboarding', label: 'Primeiros passos', icon: 'sparkle' } as const
export const HELP_ITEM = { id: 'help', label: 'Ajuda', icon: 'help' } as const
export const CHANGELOG_ITEM = { id: 'changelog', label: 'Novidades', icon: 'refresh' } as const
export const SETTINGS_SHORTCUT_ITEMS = [ONBOARDING_ITEM, HELP_ITEM, CHANGELOG_ITEM] as const
export const SETTINGS_SECTION_ITEMS = [SETTINGS_ITEM, ...SETTINGS_SHORTCUT_ITEMS] as const

export const ALL_NAV_ITEMS = [
  ...PRIMARY_NAV_ITEMS,
  ...SECONDARY_NAV_ITEMS,
  SETTINGS_ITEM,
  ...SETTINGS_SHORTCUT_ITEMS,
  DS_ITEM,
] as const

export const FINANCE_SCREEN_PATHS = {
  planilha: '/planilha', dashboard: '/resumo', cartoes: '/contas', reports: '/relatorios',
  planning: '/planejamento', debts: '/dividas', subscriptions: '/assinaturas', wishlist: '/desejos',
  alerts: '/alertas', onboarding: '/primeiros-passos', help: '/ajuda', changelog: '/novidades',
  config: '/configuracoes', 'design-system': '/design-system',
} as const

export type FinanceScreenId = keyof typeof FINANCE_SCREEN_PATHS

export const financeScreenForPath = (path: string): FinanceScreenId | undefined =>
  (Object.keys(FINANCE_SCREEN_PATHS) as FinanceScreenId[])
    .find(id => FINANCE_SCREEN_PATHS[id] === path.replace(/\/$/, ''))

// Compatibility for older consumers.
export const FINANCE_TABS = PRIMARY_NAV_ITEMS

export const RANGE_OPTIONS = [
  { value: 'month', label: 'Mensal' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: 'Anual' },
] as const
