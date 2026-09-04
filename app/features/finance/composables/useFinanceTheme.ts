import type { Ref } from 'vue'
import { THEME_PRESETS } from '#shared/constants'
import type { HouseholdSettings, ThemeMode } from '#shared/types'
export const useFinanceTheme = (settings: Ref<HouseholdSettings>) => {
  const LEGACY_THEME_MODES = new Set(['eva', 'eva_01', 'cyberpunk', 'arasaka'])
  const DARK_THEMES = new Set(['dark'])

  const normalizeThemeMode = (mode: string): ThemeMode => {
    if (LEGACY_THEME_MODES.has(mode)) return 'dark'
    if (mode === 'light' || mode === 'dark' || mode === 'custom' || mode === 'system') return mode
    return 'dark'
  }

  const normalizeSettings = (nextSettings: HouseholdSettings): HouseholdSettings => ({
    ...nextSettings,
    themeMode: normalizeThemeMode(nextSettings.themeMode)
  })

  const resolveEffectiveTheme = (): Exclude<ThemeMode, 'system'> => {
    const mode = normalizeThemeMode(settings.value.themeMode)
    if (mode !== settings.value.themeMode) {
      settings.value.themeMode = mode
    }
    if (mode !== 'system') {
      return mode
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  // Variáveis sobrescritas inline quando o tema é 'custom'.
  const CUSTOM_VARS = [
    '--ds-color-brand-primary', '--ds-color-brand-primary-dim', '--ds-color-brand-primary-light',
    '--ds-color-brand-accent', '--ds-color-state-success', '--ds-color-state-success-light',
    '--ds-color-state-danger', '--ds-color-state-danger-light', '--ds-color-state-warning',
    '--ds-color-state-warning-light', '--accent-light'
  ]

  const isLightHex = (hex: string): boolean => {
    const h = hex.replace('#', '')
    if (h.length < 6) return true
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140
  }

  const applyTheme = () => {
    if (!process.client) {
      return
    }

    const root = document.documentElement

    // Limpa quaisquer overrides inline de execuções anteriores
    for (const v of CUSTOM_VARS) root.style.removeProperty(v)

    settings.value.themeMode = normalizeThemeMode(settings.value.themeMode)

    if (settings.value.themeMode === 'custom') {
      const c = settings.value.colorTokens
      const light = isLightHex(c.background)
      root.dataset.theme = light ? 'light' : 'dark'
      root.classList.toggle('dark', !light)

      const mix = (hex: string, pct: number, base: string) => `color-mix(in srgb, ${hex} ${pct}%, ${base})`
      root.style.setProperty('--ds-color-brand-primary', c.primary)
      root.style.setProperty('--ds-color-brand-primary-dim', mix(c.primary, 16, 'transparent'))
      root.style.setProperty('--ds-color-brand-primary-light', mix(c.primary, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--ds-color-brand-accent', c.accent)
      root.style.setProperty('--ds-color-state-success', c.positive)
      root.style.setProperty('--ds-color-state-success-light', mix(c.positive, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--ds-color-state-danger', c.negative)
      root.style.setProperty('--ds-color-state-danger-light', mix(c.negative, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--ds-color-state-warning', c.accent)
      root.style.setProperty('--ds-color-state-warning-light', mix(c.accent, 16, 'var(--ds-color-surface-card)'))
      root.style.setProperty('--accent-light', mix(c.accent, 16, 'var(--ds-color-surface-card)'))
      return
    }

    const effective = resolveEffectiveTheme()
    root.dataset.theme = effective
    root.classList.toggle('dark', DARK_THEMES.has(effective))
  }

  const setThemeMode = (mode: ThemeMode) => {
    settings.value.themeMode = mode
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      settings.value.colorTokens = { ...THEME_PRESETS[prefersDark ? 'dark' : 'light'] }
    } else {
      settings.value.colorTokens = { ...THEME_PRESETS[mode] }
    }
    applyTheme()
  }

  return { normalizeSettings, applyTheme, setThemeMode }
}
