import type { ColorTokens, DashboardConfig, ThemeMode } from './types'

export const DEFAULT_HOUSEHOLD_ID = 'household-main'

export const DEFAULT_COLORS: ColorTokens = {
  primary: '#5b5bf7',
  accent: '#ffd43b',
  positive: '#13a86b',
  negative: '#e84545',
  neutral: '#5f6472',
  background: '#f3efe6',
  card: '#fffdf6'
}

export const DARK_COLORS: ColorTokens = {
  primary: '#00ff33',
  accent: '#bb00ff',
  positive: '#13a86b',
  negative: '#e84545',
  neutral: '#9aa2b2',
  background: '#090b10',
  card: '#171c25'
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

export const CYBERPUNK_COLORS: ColorTokens = {
  primary: '#2f7bff',
  accent: '#f5e000',
  positive: '#19e3c2',
  negative: '#ff3b6b',
  neutral: '#7c8aa6',
  background: '#070b16',
  card: '#0e1626'
}

export const ARASAKA_COLORS: ColorTokens = {
  primary: '#e6112b',
  accent: '#ff4d4d',
  positive: '#37c25a',
  negative: '#ff2233',
  neutral: '#8a8f99',
  background: '#09090b',
  card: '#141417'
}

export const THEME_PRESETS: Record<ThemeMode, ColorTokens> = {
  light: DEFAULT_COLORS,
  dark: DARK_COLORS,
  eva: EVA_COLORS,
  cyberpunk: CYBERPUNK_COLORS,
  arasaka: ARASAKA_COLORS,
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
