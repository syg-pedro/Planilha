import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,ts}',
    './app/components/**/*.{vue,ts}',
    './app/pages/**/*.vue',
    './app/layouts/**/*.vue',
    './app/plugins/**/*.{ts,js}',
    './app/composables/**/*.{ts,js}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      boxShadow: {
        panel: '0 12px 30px rgba(15, 23, 42, 0.12)'
      }
    }
  }
}
