import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite')
    const vue = (await import('@vitejs/plugin-vue')).default
    const ui = (await import('@nuxt/ui/vite')).default

    return mergeConfig(config, {
      resolve: { alias: { '#shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
      plugins: [vue(), ui({ dts: false, components: { dirs: ['app/components/base'] }, ui: { colors: { primary: 'green', neutral: 'slate' } }, icon: { clientBundle: { icons: ['i-lucide-dollar-sign', 'i-lucide-grid-2x2', 'i-lucide-credit-card', 'i-lucide-chart-no-axes-combined', 'i-lucide-arrow-down', 'i-lucide-arrow-up'] } } })]
    })
  },
  docs: {
    autodocs: 'tag'
  }
}

export default config
