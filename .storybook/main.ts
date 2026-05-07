import type { StorybookConfig } from '@storybook/vue3-vite'

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

    return mergeConfig(config, {
      plugins: [vue()]
    })
  },
  docs: {
    autodocs: 'tag'
  }
}

export default config
