export const FINANCE_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planilha', label: 'Planilha' },
  { id: 'calendario', label: 'Calendario' },
  { id: 'config', label: 'Configuracoes' }
] as const

export const RANGE_OPTIONS = [
  { value: 'month', label: 'Mensal' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: 'Anual' }
] as const
