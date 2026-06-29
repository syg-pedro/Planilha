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
        sans: ['Space Grotesk', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Consolas', 'monospace']
      },
      boxShadow: {
        panel: '5px 5px 0 #111111'
      }
    }
  }
}
