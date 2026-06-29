import '../app/assets/css/main.css'

import type { Preview } from '@storybook/vue3-vite'

const preview: Preview = {
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
        { name: 'Neo light', value: '#f3efe6' },
        { name: 'Neo dark', value: '#090b10' }
      ]
    }
  }
}

export default preview
