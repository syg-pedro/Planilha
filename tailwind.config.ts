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
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '5px 5px 0 #111111'
      }
    }
  }
}
