import '../app/assets/css/main.css'

import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3'
import ui from '@nuxt/ui/vue-plugin'
import UApp from '@nuxt/ui/components/App.vue'
import { pt_br } from '@nuxt/ui/locale'
import { uiThemeCss } from '../shared/uiTheme'

setup((app) => {
  app.use(ui)
  let theme = document.getElementById('storybook-ui-theme')
  if (!theme) {
    theme = document.createElement('style')
    theme.id = 'storybook-ui-theme'
    document.head.append(theme)
  }
  theme.textContent = uiThemeCss({ version: 1, preset: 'default' }, 'light')
})

const preview: Preview = {
  decorators: [() => ({ components: { UApp }, setup: () => ({ pt_br }), template: '<UApp :locale="pt_br"><story /></UApp>' })],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'Nuxt UI light', value: '#ffffff' },
        { name: 'Nuxt UI dark', value: '#020617' }
      ]
    }
  }
}

export default preview
