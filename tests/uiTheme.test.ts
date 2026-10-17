import { describe, expect, it } from 'vitest'
import { normalizeUiTheme, resolveUiTheme, uiThemeComponents, uiThemeCss, UI_DEFAULT_COLORS, UI_THEME_PRESETS } from '../shared/uiTheme'
import { resolveFinanceIcon, themeIcons } from '../shared/uiThemeIcons'
import { UI_ICON_SETS, UI_PRESET_IDS } from '../shared/uiThemeTypes'

describe('official Nuxt UI theme preferences', () => {
  it('keeps existing households on the official Default without inventing overrides', () => {
    expect(normalizeUiTheme(undefined)).toEqual({ version: 1, preset: 'default' })
    const result = resolveUiTheme(undefined)
    expect(result.colors).toEqual(UI_DEFAULT_COLORS)
    expect(result.font.sans).toBe('Public Sans')
    expect(result.radius).toBe(0.25)
    expect(result.fontSize).toBe(16)
    expect(result.icons).toBe('lucide')
    const css = uiThemeCss(undefined, 'light')
    expect(css).toContain('--ui-color-primary-500:#00C16A;')
    expect(css).toContain('--color-green-400:#00DC82;')
    expect(css).toContain('--ui-primary:var(--ui-color-primary-500)')
    expect(uiThemeCss(undefined, 'dark')).toContain('--ui-primary:var(--ui-color-primary-400)')
  })

  it('supports all twelve official presets and their fonts, palettes and icon sets', () => {
    expect(UI_THEME_PRESETS.map(preset => preset.id)).toEqual([...UI_PRESET_IDS])
    for (const preset of UI_THEME_PRESETS) {
      const resolved = resolveUiTheme({ preset: preset.id })
      const css = uiThemeCss({ preset: preset.id }, 'dark')
      expect(css).not.toContain('undefined')
      expect(css).not.toContain('NaN')
      expect(css).toContain(`'${resolved.font.sans}'`)
      expect(UI_ICON_SETS).toContain(resolved.icons)
    }
    expect(resolveUiTheme({ preset: 'parchment' }).font.serif).toBe('Source Serif 4')
    expect(resolveUiTheme({ preset: 'mono' }).font.mono).toBe('Geist Mono')
  })

  it('rejects malformed stored preferences while retaining valid individual overrides', () => {
    expect(normalizeUiTheme({ preset: 'not-real', colors: { primary: 'blue', neutral: 'script', unknown: 'red' }, font: 'url(unsafe)', icons: 'arbitrary', radius: -1 })).toEqual({ version: 1, preset: 'default', colors: { primary: 'blue' } })
    expect(normalizeUiTheme({ preset: 'mint', radius: 0, font: 'Inter', icons: 'tabler' })).toEqual({ version: 1, preset: 'mint', radius: 0, font: 'Inter', icons: 'tabler' })
  })

  it('uses preset styling without leaking a previous preset into Default', () => {
    const snapshot = JSON.stringify(UI_THEME_PRESETS)
    const mono = uiThemeCss({ preset: 'mono' }, 'dark')
    expect(mono).toContain('--ui-primary:white;')
    expect(uiThemeComponents({ preset: 'mint' })).toHaveProperty('input.defaultVariants.size', 'lg')
    expect(uiThemeComponents({ preset: 'mint' })).toHaveProperty('input.defaultVariants.variant', 'soft')
    expect(uiThemeComponents({ preset: 'iris' })).toHaveProperty('button.defaultVariants.variant', 'outline')
    expect(uiThemeComponents({ preset: 'default' })).toEqual({})
    const defaults = uiThemeCss({ preset: 'default' }, 'dark')
    expect(defaults).toContain('--ui-radius:0.25rem;')
    expect(defaults).toContain('--ui-bg:var(--ui-color-neutral-900);')
    expect(defaults).not.toContain('Geist')
    expect(JSON.stringify(UI_THEME_PRESETS)).toBe(snapshot)
  })

  it('overrides all semantic roles independently and lets Mono use a color primary', () => {
    const colors = { primary: 'rose', secondary: 'indigo', success: 'teal', info: 'cyan', warning: 'amber', error: 'orange', neutral: 'stone' }
    expect(resolveUiTheme({ preset: 'default', colors }).colors).toEqual(colors)
    expect(resolveUiTheme({ preset: 'mono', colors: { primary: 'rose' } }).blackAsPrimary).toBe(false)
    expect(uiThemeCss({ preset: 'cobalt' }, 'light')).toContain('--color-cobalt-500:oklch(')
  })

  it('resolves finance aliases and all Nuxt UI glyphs for every installed icon family', () => {
    for (const family of UI_ICON_SETS) {
      expect(Object.keys(themeIcons[family]).sort()).toEqual(Object.keys(themeIcons.lucide).sort())
      for (const name of ['grid', 'calendar', 'settings', 'plus', 'warning', 'card', 'edit', 'export', 'close']) expect(resolveFinanceIcon(name, family)).toMatch(/^i-/)
    }
    expect(resolveFinanceIcon('plus', 'bootstrap')).toBe('i-bi-plus')
    expect(resolveFinanceIcon('i-lucide-credit-card', 'bootstrap')).toBe('i-lucide-credit-card')
  })
})
