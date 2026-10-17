import { mergeUiThemeRecords, resolveUiTheme, uiThemeComponents, uiThemeCss } from '#shared/uiTheme'
import { themeIcons } from '#shared/uiThemeIcons'

/** Apply a complete preset from a clean Nuxt UI baseline on every change. */
export function useFinanceUiTheme() {
  const appConfig = useAppConfig()
  const baseline = JSON.parse(JSON.stringify(appConfig.ui ?? {})) as Record<string, unknown>
  const iconSet = useState<string>('finance-ui-icon-set', () => 'lucide')
  const apply = (preferences: unknown, mode: 'light' | 'dark') => {
    const resolved = resolveUiTheme(preferences)
    const components = mergeUiThemeRecords(baseline, uiThemeComponents(preferences))
    Object.assign(components, { colors: resolved.colors, icons: themeIcons[resolved.icons] })
    appConfig.ui = components as typeof appConfig.ui
    iconSet.value = resolved.icons
    if (import.meta.client) {
      let element = document.getElementById('finance-ui-theme') as HTMLStyleElement | null
      if (!element) {
        element = document.createElement('style')
        element.id = 'finance-ui-theme'
        document.head.append(element)
      }
      element.textContent = uiThemeCss(preferences, mode)
      document.documentElement.dataset.uiPreset = resolved.preferences.preset
    }
  }
  return { apply }
}
