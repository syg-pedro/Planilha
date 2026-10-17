import tailwindColors from 'tailwindcss/colors'
import { presets } from './uiThemePresets'
import { UI_COLOR_ALIASES, UI_ICON_SETS, UI_PRESET_IDS, type ThemeDoc, type UiColorAlias, type UiIconSetId, type UiThemePreferences, type UiThemePresetId, type UiShade } from './uiThemeTypes'

export * from './uiThemeTypes'
export const UI_THEME_PRESETS = presets
export const UI_THEME_FONTS = ['Public Sans', 'Geist', 'Roboto', 'Figtree', 'Nunito', 'Manrope', 'Inter', 'Plus Jakarta Sans', 'Bricolage Grotesque', 'Outfit', 'Poppins', 'DM Sans'] as const
export const UI_DEFAULT_COLORS: Record<UiColorAlias, string> = { primary: 'green', secondary: 'blue', success: 'green', info: 'blue', warning: 'yellow', error: 'red', neutral: 'slate' }
export const DEFAULT_UI_THEME: UiThemePreferences = { version: 1, preset: 'default' }
export const UI_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const standardColors = tailwindColors as unknown as Record<string, Record<string, string> | string>
// The Nuxt UI theme playground overrides Tailwind green with Nuxt's official ramp.
export const UI_NUXT_GREEN = { 50: '#EFFDF5', 100: '#D9FBE8', 200: '#B3F5D1', 300: '#75EDAE', 400: '#00DC82', 500: '#00C16A', 600: '#00A155', 700: '#007F45', 800: '#016538', 900: '#0A5331', 950: '#052E16' } as const
const presetPalettes = Object.assign({}, ...presets.map(preset => preset.doc.palettes ?? {})) as NonNullable<ThemeDoc['palettes']>
export const UI_THEME_PALETTES = [...new Set([...Object.entries(standardColors).filter(([, value]) => typeof value === 'object' && value !== null && '500' in value).map(([name]) => name), ...Object.keys(presetPalettes)])]
export const UI_NEUTRAL_PALETTES = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe', 'cobalt-gray', 'carbon', 'saturated-mauve', 'parchment'].filter(name => UI_THEME_PALETTES.includes(name))
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function normalizeUiTheme(value: unknown): UiThemePreferences {
  const source = object(value)
  const preset = UI_PRESET_IDS.includes(source.preset as UiThemePresetId) ? source.preset as UiThemePresetId : 'default'
  const result: UiThemePreferences = { version: 1, preset }
  const colors = object(source.colors)
  const normalized: Partial<Record<UiColorAlias, string>> = {}
  for (const alias of UI_COLOR_ALIASES) if (typeof colors[alias] === 'string' && UI_THEME_PALETTES.includes(colors[alias])) normalized[alias] = colors[alias]
  if (Object.keys(normalized).length) result.colors = normalized
  if (UI_THEME_FONTS.includes(source.font as typeof UI_THEME_FONTS[number])) result.font = source.font as string
  if (UI_ICON_SETS.includes(source.icons as UiIconSetId)) result.icons = source.icons as UiIconSetId
  if (typeof source.radius === 'number' && Number.isFinite(source.radius) && source.radius >= 0 && source.radius <= 4) result.radius = source.radius
  return result
}

export function resolveUiTheme(value: unknown) {
  const preferences = normalizeUiTheme(value)
  const preset = presets.find(item => item.id === preferences.preset) ?? presets[0]!
  const doc = clone(preset.doc)
  return {
    preferences,
    doc,
    colors: { ...UI_DEFAULT_COLORS, ...doc.colors, ...preferences.colors },
    radius: preferences.radius ?? doc.radius ?? 0.25,
    fontSize: doc.fontSize ?? 16,
    font: { ...doc.font, sans: preferences.font ?? doc.font?.sans ?? 'Public Sans' },
    icons: (preferences.icons ?? doc.icons ?? 'lucide') as UiIconSetId,
    blackAsPrimary: Boolean(doc.blackAsPrimary && !preferences.colors?.primary),
  }
}

const fields = ['input', 'select', 'textarea', 'selectMenu', 'inputMenu', 'inputNumber', 'inputTags', 'inputDate', 'inputTime', 'pinInput']
const variantSupport: Record<string, string[]> = { button: ['solid', 'outline', 'soft', 'subtle', 'ghost', 'link'], badge: ['solid', 'outline', 'soft', 'subtle'], alert: ['solid', 'outline', 'soft', 'subtle'], card: ['solid', 'outline', 'soft', 'subtle'], empty: ['solid', 'outline', 'soft', 'subtle'], ...Object.fromEntries(fields.map(name => [name, ['outline', 'soft', 'subtle', 'ghost', 'none']])) }
const groups = { buttons: ['button', 'badge'], panels: ['card', 'alert', 'empty'], inputs: fields }

/** Merge component slots, compounds and defaults with the official preset semantics. */
export function mergeUiThemeRecords(base: Record<string, unknown>, extra: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    const previous = result[key]
    if (key === 'compoundVariants' && Array.isArray(previous) && Array.isArray(value)) result[key] = [...previous, ...value]
    else if (key === 'defaultVariants') result[key] = { ...object(previous), ...object(value) }
    else if (typeof previous === 'string' && typeof value === 'string') result[key] = `${previous} ${value}`
    else if (previous && value && typeof previous === 'object' && typeof value === 'object' && !Array.isArray(previous) && !Array.isArray(value)) result[key] = mergeUiThemeRecords(object(previous), object(value))
    else result[key] = value
  }
  return result
}

export function uiThemeComponents(value: unknown) {
  const { doc } = resolveUiTheme(value)
  const fragments: Record<string, Record<string, unknown>> = {}
  const setDefault = (name: string, key: string, choice: string) => { const current = fragments[name] ?? {}; fragments[name] = { ...current, defaultVariants: { ...object(current.defaultVariants), [key]: choice } } }
  const defaults = doc.style?.defaults
  if (defaults?.variant && defaults.variant !== 'default') for (const [name, variants] of Object.entries(variantSupport)) if (variants.includes(defaults.variant)) setDefault(name, 'variant', defaults.variant)
  for (const [group, components] of Object.entries(groups)) {
    const variant = defaults?.variants?.[group as keyof typeof groups]
    const color = defaults?.colors?.[group as keyof typeof groups]
    for (const name of components) {
      if (variant && variant !== 'default' && variantSupport[name]?.includes(variant)) setDefault(name, 'variant', variant)
      if (color && color !== 'default' && (name === 'button' || name === 'badge' || fields.includes(name))) setDefault(name, 'color', color)
    }
  }
  if (defaults?.size && defaults.size !== 'default') for (const name of ['button', 'badge', ...fields, 'inputRating', 'tabs', 'checkbox', 'checkboxGroup', 'radioGroup', 'switch', 'slider', 'stepper', 'calendar', 'colorPicker', 'fileUpload', 'formField', 'fieldGroup', 'dropdownMenu', 'contextMenu', 'commandPalette', 'listbox']) setDefault(name, 'size', defaults.size)
  return mergeUiThemeRecords(fragments, doc.components ?? {})
}

export function uiThemePaletteShade(palette: string, shade: number = 500) {
  if (palette === 'green') return UI_NUXT_GREEN[shade as keyof typeof UI_NUXT_GREEN]
  const ramp = standardColors[palette]
  return presetPalettes[palette]?.shades[shade as UiShade] ?? (typeof ramp === 'object' ? ramp[String(shade)] : undefined) ?? '#64748b'
}

/** Complete semantic reset on every apply prevents one preset leaking into the next. */
export function uiThemeCss(value: unknown, mode: 'light' | 'dark') {
  const resolved = resolveUiTheme(value)
  const { doc, colors } = resolved
  const tokens: Record<string, string> = {}
  for (const [shade, color] of Object.entries(UI_NUXT_GREEN)) tokens[`--color-green-${shade}`] = color
  for (const [palette, ramp] of Object.entries(presetPalettes)) for (const [shade, color] of Object.entries(ramp.shades)) tokens[`--color-${palette}-${shade}`] = color
  for (const [alias, palette] of Object.entries(colors)) for (const shade of UI_SHADES) tokens[`--ui-color-${alias}-${shade}`] = uiThemePaletteShade(palette, shade)
  for (const alias of UI_COLOR_ALIASES.filter(alias => alias !== 'neutral')) tokens[`--ui-${alias}`] = `var(--ui-color-${alias}-${mode === 'dark' ? 400 : 500})`
  Object.assign(tokens, mode === 'dark' ? {
    '--ui-bg': 'var(--ui-color-neutral-900)', '--ui-bg-muted': 'var(--ui-color-neutral-800)', '--ui-bg-elevated': 'var(--ui-color-neutral-800)', '--ui-bg-accented': 'var(--ui-color-neutral-700)', '--ui-bg-inverted': 'white', '--ui-text-dimmed': 'var(--ui-color-neutral-500)', '--ui-text-muted': 'var(--ui-color-neutral-400)', '--ui-text-toned': 'var(--ui-color-neutral-300)', '--ui-text': 'var(--ui-color-neutral-200)', '--ui-text-highlighted': 'white', '--ui-text-inverted': 'var(--ui-color-neutral-900)', '--ui-border': 'var(--ui-color-neutral-800)', '--ui-border-muted': 'var(--ui-color-neutral-700)', '--ui-border-accented': 'var(--ui-color-neutral-700)', '--ui-border-inverted': 'white',
  } : {
    '--ui-bg': 'white', '--ui-bg-muted': 'var(--ui-color-neutral-50)', '--ui-bg-elevated': 'var(--ui-color-neutral-100)', '--ui-bg-accented': 'var(--ui-color-neutral-200)', '--ui-bg-inverted': 'var(--ui-color-neutral-900)', '--ui-text-dimmed': 'var(--ui-color-neutral-400)', '--ui-text-muted': 'var(--ui-color-neutral-500)', '--ui-text-toned': 'var(--ui-color-neutral-600)', '--ui-text': 'var(--ui-color-neutral-700)', '--ui-text-highlighted': 'var(--ui-color-neutral-900)', '--ui-text-inverted': 'white', '--ui-border': 'var(--ui-color-neutral-200)', '--ui-border-muted': 'var(--ui-color-neutral-200)', '--ui-border-accented': 'var(--ui-color-neutral-300)', '--ui-border-inverted': 'var(--ui-color-neutral-900)',
  })
  for (const [token, stops] of Object.entries(doc.style?.tokenShades ?? {})) {
    const stop = stops[mode]
    if (stop === undefined) continue
    const alias = token.replace('--ui-', '')
    const ramp = (UI_COLOR_ALIASES as readonly string[]).includes(alias) ? alias : 'neutral'
    tokens[token] = typeof stop === 'number' ? `var(--ui-color-${ramp}-${stop})` : stop
  }
  Object.assign(tokens, doc.tokens?.[mode] ?? {})
  if (resolved.blackAsPrimary) tokens['--ui-primary'] = mode === 'dark' ? 'white' : 'black'
  tokens['--ui-radius'] = `${resolved.radius}rem`
  const fontStack = (family: string, fallback: string) => `'${family}', ${fallback}`
  tokens['--font-sans'] = fontStack(resolved.font.sans, 'system-ui, sans-serif')
  tokens['--font-mono'] = resolved.font.mono ? fontStack(resolved.font.mono, 'monospace') : 'ui-monospace, monospace'
  tokens['--finance-font-heading'] = resolved.font.serif ? fontStack(resolved.font.serif, 'serif') : 'var(--font-sans)'
  for (const [name, weight] of Object.entries({ normal: 400, medium: 500, semibold: 600, bold: 700, ...resolved.font.weights })) tokens[`--font-weight-${name}`] = String(weight)
  const root = `:root {${Object.entries(tokens).map(([key, result]) => `${key}:${result};`).join('')}font-size:${resolved.fontSize}px;}`
  return `${root}\nbody{font-family:var(--font-sans);font-weight:var(--font-weight-normal);line-height:${resolved.font.lineHeight ?? 1.5};letter-spacing:${resolved.font.letterSpacing ?? 0}em;text-transform:${resolved.font.uppercase ? 'uppercase' : 'none'};font-style:${resolved.font.italic ? 'italic' : 'normal'};}\nh1,h2,h3,h4,h5,h6{font-family:var(--finance-font-heading);font-weight:var(--font-weight-semibold);letter-spacing:inherit;}`
}
