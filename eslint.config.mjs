import boundaries from 'eslint-plugin-boundaries'
import withNuxt from './.nuxt/eslint.config.mjs'

if (!Object.groupBy) {
  Object.groupBy = (items, callback) =>
    items.reduce((groups, item, index) => {
      const key = callback(item, index)
      groups[key] ||= []
      groups[key].push(item)
      return groups
    }, {})
}

export default withNuxt(
  {
    ignores: ['.claude/**', '.agents/**', '.codex/**']
  },
  {
    files: ['app/**/*.{ts,vue}', 'shared/**/*.ts', 'server/**/*.{ts,js}'],
    plugins: {
      boundaries
    },
    settings: {
      'boundaries/include': ['app/**/*.{ts,vue}', 'shared/**/*.ts', 'server/**/*.{ts,js}'],
      'boundaries/elements': [
        { type: 'app-root', pattern: 'app/app.vue', mode: 'full' },
        { type: 'layout', pattern: 'app/layouts/**/*', mode: 'full' },
        { type: 'page', pattern: 'app/pages/**/*', mode: 'full' },
        { type: 'plugin', pattern: 'app/plugins/**/*', mode: 'full' },
        { type: 'base', pattern: 'app/components/base/**/*', mode: 'full' },
        { type: 'design-system', pattern: 'app/design-system/**/*', mode: 'full' },
        { type: 'feature', pattern: 'app/features/*/**/*', mode: 'full', capture: ['featureName'] },
        { type: 'store-compat', pattern: 'app/stores/**/*', mode: 'full' },
        { type: 'composable-compat', pattern: 'app/composables/**/*', mode: 'full' },
        { type: 'shared', pattern: 'shared/**/*', mode: 'full' },
        { type: 'server', pattern: 'server/**/*', mode: 'full' }
      ]
    },
    rules: {
      'boundaries/no-unknown-files': 'off',
      'boundaries/no-unknown': 'off',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message: '{{from.type}} nao pode importar {{to.type}} diretamente.',
          rules: [
            {
              allow: { dependency: { relationship: { to: 'internal' } } }
            },
            {
              from: { type: 'app-root' },
              allow: {
                to: {
                  type: ['page', 'layout', 'plugin', 'feature', 'base', 'design-system', 'shared', 'store-compat', 'composable-compat']
                }
              }
            },
            {
              from: { type: ['page', 'layout'] },
              allow: {
                to: {
                  type: ['feature', 'base', 'design-system', 'shared', 'store-compat', 'composable-compat']
                }
              }
            },
            {
              from: { type: 'feature' },
              allow: {
                to: [
                  { type: 'base' },
                  { type: 'design-system' },
                  { type: 'shared' },
                  { type: 'feature', captured: { featureName: '{{from.featureName}}' } }
                ]
              }
            },
            {
              from: { type: 'base' },
              allow: {
                to: {
                  type: ['design-system', 'shared']
                }
              }
            },
            {
              from: { type: ['store-compat', 'composable-compat'] },
              allow: {
                to: {
                  type: ['feature', 'shared']
                }
              }
            },
            {
              from: { type: 'plugin' },
              allow: {
                to: {
                  type: ['shared', 'design-system', 'feature', 'base']
                }
              }
            },
            {
              from: { type: 'server' },
              allow: {
                to: {
                  type: ['shared', 'server']
                }
              }
            },
            {
              from: { type: 'shared' },
              allow: {
                to: {
                  type: ['shared']
                }
              }
            }
          ]
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'nuxt/prefer-import-meta': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/html-self-closing': 'off'
    }
  },
  {
    files: ['**/*.stories.@(js|jsx|mjs|ts|tsx)', '.storybook/**/*.{js,cjs,mjs,ts}'],
    rules: {
      'boundaries/no-unknown-files': 'off',
      'boundaries/no-unknown': 'off',
      'boundaries/dependencies': 'off'
    }
  }
)
