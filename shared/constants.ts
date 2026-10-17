import type { ColorTokens, DashboardConfig, ThemeMode } from './types'

export const DEFAULT_HOUSEHOLD_ID = 'household-main'

export const DEFAULT_COLORS: ColorTokens = {
  primary: '#00C16A',
  accent: '#3b82f6',
  positive: '#00C16A',
  negative: '#ef4444',
  neutral: '#64748b',
  background: '#ffffff',
  card: '#ffffff'
}

export const DARK_COLORS: ColorTokens = {
  primary: '#00DC82',
  accent: '#60a5fa',
  positive: '#00DC82',
  negative: '#f87171',
  neutral: '#94a3b8',
  background: '#0f172a',
  card: '#1e293b'
}

export const THEME_PRESETS: Record<ThemeMode, ColorTokens> = {
  light: DEFAULT_COLORS,
  dark: DARK_COLORS,
  custom: DARK_COLORS,
  system: DEFAULT_COLORS
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
  defaultRange: 'month',
  uiTheme: { version: 1, preset: 'default' }
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
