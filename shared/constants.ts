import type { ColorTokens, DashboardConfig, ThemeMode } from './types'

export const DEFAULT_HOUSEHOLD_ID = 'household-main'

export const DEFAULT_COLORS: ColorTokens = {
  primary: '#0f766e',
  accent: '#f59e0b',
  positive: '#16a34a',
  negative: '#dc2626',
  neutral: '#64748b',
  background: '#f8fafc',
  card: '#ffffff'
}

export const DARK_COLORS: ColorTokens = {
  primary: '#14b8a6',
  accent: '#f59e0b',
  positive: '#22c55e',
  negative: '#f43f5e',
  neutral: '#94a3b8',
  background: '#0b1020',
  card: '#111827'
}

export const EVA_COLORS: ColorTokens = {
  primary: '#6f3cc3',
  accent: '#7cff2b',
  positive: '#44d62c',
  negative: '#ff5a5f',
  neutral: '#8a84a8',
  background: '#0c0b14',
  card: '#1b1430'
}

export const THEME_PRESETS: Record<ThemeMode, ColorTokens> = {
  light: DEFAULT_COLORS,
  dark: DARK_COLORS,
  eva: EVA_COLORS
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  visibleWidgets: [
    'kpis',
    'cashflow',
    'projection',
    'category',
    'cards',
    'limits',
    'heatmap',
    'upcoming'
  ],
  sortMode: 'date_asc',
  defaultRange: 'month'
}

export const MONTH_ALIASES: Record<string, number> = {
  jan: 0,
  janeiro: 0,
  fev: 1,
  fevereiro: 1,
  mar: 2,
  marco: 2,
  abr: 3,
  abril: 3,
  mai: 4,
  maio: 4,
  jun: 5,
  junho: 5,
  jul: 6,
  julho: 6,
  ago: 7,
  agosto: 7,
  set: 8,
  setembro: 8,
  out: 9,
  outubro: 9,
  nov: 10,
  novembro: 10,
  dez: 11,
  dezembro: 11
}

export const WIDGET_OPTIONS = [
  { id: 'kpis', label: 'KPIs' },
  { id: 'cashflow', label: 'Fluxo de caixa' },
  { id: 'projection', label: 'Projecao 18 meses' },
  { id: 'category', label: 'Categorias' },
  { id: 'cards', label: 'Cartoes' },
  { id: 'limits', label: 'Limites' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'upcoming', label: 'Proximos vencimentos' }
]
