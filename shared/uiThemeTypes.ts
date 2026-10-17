export const UI_COLOR_ALIASES = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export type UiColorAlias = typeof UI_COLOR_ALIASES[number]
export const UI_ICON_SETS = ['lucide', 'bootstrap', 'heroicons', 'iconoir', 'material', 'phosphor', 'remix', 'tabler'] as const
export type UiIconSetId = typeof UI_ICON_SETS[number]
export const UI_PRESET_IDS = ['default', 'mono', 'cobalt', 'sky', 'mint', 'iris', 'crimson', 'coral', 'sunset', 'carbon', 'bubblegum', 'parchment'] as const
export type UiThemePresetId = typeof UI_PRESET_IDS[number]
export type UiShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950
export type UiShadeStop = UiShade | 'white' | 'black'
export interface StyleOptions {
  defaults?: {
    variant?: string
    size?: string
    variants?: Partial<Record<'buttons' | 'panels' | 'inputs', string>>
    colors?: Partial<Record<'buttons' | 'panels' | 'inputs', string>>
  }
  tokenShades?: Record<string, { light?: UiShadeStop; dark?: UiShadeStop }>
}
export interface ThemeDoc {
  version: 1
  palettes?: Record<string, { shades: Partial<Record<UiShade, string>> }>
  colors?: Partial<Record<UiColorAlias, string>>
  blackAsPrimary?: boolean
  tokens?: { light?: Record<string, string>; dark?: Record<string, string> }
  radius?: number
  fontSize?: number
  font?: {
    sans?: string
    serif?: string
    mono?: string
    weights?: { normal?: number; medium?: number; semibold?: number; bold?: number }
    uppercase?: boolean
    italic?: boolean
    letterSpacing?: number
    lineHeight?: number
  }
  icons?: string
  style?: StyleOptions
  components?: Record<string, Record<string, unknown>>
}
/** Stored inside the existing dashboard_config JSON; old households need no migration. */
export interface UiThemePreferences {
  version: 1
  preset: UiThemePresetId
  colors?: Partial<Record<UiColorAlias, string>>
  font?: string
  icons?: UiIconSetId
  radius?: number
}
