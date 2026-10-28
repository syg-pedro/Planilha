import { z } from 'zod'
import type { HouseholdSettings } from '../../types'

export const textosPreferencias = {
  titulo: 'Configurações', detalhe: 'Preferências da família atual.', salvar: 'Salvar preferências', salvo: 'Preferências salvas.',
  somenteLeitura: 'Somente responsáveis podem alterar as preferências da família.',
  notificacoes: 'A permissão é voluntária. Os avisos dependem do navegador e da página aberta.',
  widgets: [{ value: 'kpis', label: 'Indicadores' }, { value: 'cashflow', label: 'Fluxo de caixa' },
    { value: 'projection', label: 'Projeção' }, { value: 'category', label: 'Categorias' },
    { value: 'cards', label: 'Cartões' }, { value: 'limits', label: 'Limites' },
    { value: 'heatmap', label: 'Mapa de gastos' }, { value: 'upcoming', label: 'Próximos vencimentos' }],
  cores: [{ value: 'primary', label: 'Principal' }, { value: 'accent', label: 'Destaque' },
    { value: 'positive', label: 'Receitas' }, { value: 'negative', label: 'Despesas' },
    { value: 'neutral', label: 'Neutra' }, { value: 'background', label: 'Fundo' }, { value: 'card', label: 'Painéis' }] as const
}

export const esquemaPreferencias = z.object({
  tema: z.enum(['light', 'dark', 'system', 'custom']), densidade: z.enum(['compact', 'comfortable']),
  periodo: z.enum(['due_date', 'competence']), horizonte: z.string().regex(/^\d+$/, 'Informe meses inteiros.').refine(valor => +valor >= 1 && +valor <= 120, 'Use de 1 a 120 meses.'),
  dias: z.string().refine(valor => valor.trim() === '' || /^(?:\d+\s*,\s*)*\d+$/.test(valor.trim()), 'Separe dias inteiros por vírgulas.')
    .refine(valor => valor.trim() === '' || valor.split(',').length <= 30 && valor.split(',').every(dia => +dia >= 0 && +dia <= 365), 'Use até 30 dias, entre 0 e 365.'),
  horario: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Informe um horário válido.'),
  widgets: z.array(z.string()), ordem: z.enum(['date_asc', 'date_desc', 'amount_desc']), intervalo: z.enum(['month', 'quarter', 'year']),
  cores: z.object({ primary: z.string(), accent: z.string(), positive: z.string(), negative: z.string(), neutral: z.string(), background: z.string(), card: z.string() })
    .refine(cores => Object.values(cores).every(cor => /^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(cor)), 'Use cores hexadecimais com 3 ou 6 caracteres.')
})
export type Preferencias = z.infer<typeof esquemaPreferencias>
export const lerPreferencias = (settings: HouseholdSettings): Preferencias => ({
  tema: settings.themeMode, densidade: settings.densityMode, periodo: settings.periodMode,
  horizonte: String(settings.horizonMonths), dias: settings.notificationDays.join(', '), horario: settings.notificationTime,
  widgets: [...settings.dashboardConfig.visibleWidgets], ordem: settings.dashboardConfig.sortMode,
  intervalo: settings.dashboardConfig.defaultRange, cores: { ...settings.colorTokens }
})
export const gravarPreferencias = (settings: HouseholdSettings, preferencias: Preferencias) => {
  const valores = esquemaPreferencias.parse(preferencias)
  return { currency: settings.currency, timezone: settings.timezone, themeMode: valores.tema, densityMode: valores.densidade,
    periodMode: valores.periodo, horizonMonths: +valores.horizonte,
    notificationDays: valores.dias.trim() === '' ? [] : [...new Set(valores.dias.split(',').map(Number))], notificationTime: valores.horario,
    colorTokens: { ...settings.colorTokens, ...valores.cores },
    dashboardConfig: { ...settings.dashboardConfig, visibleWidgets: valores.widgets, sortMode: valores.ordem, defaultRange: valores.intervalo },
    onboarding: settings.onboarding }
}
