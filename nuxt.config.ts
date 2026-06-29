// https://nuxt.com/docs/api/configuration/nuxt-config
const envSupabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NUXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''

const envSupabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET ||
  ''

const envSupabasePublishableKey =
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const envNitroOutputDir = process.env.NITRO_OUTPUT_DIR || ''

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    'ag-grid-community/styles/ag-grid.css',
    'ag-grid-community/styles/ag-theme-quartz.css'
  ],
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt', '@nuxt/eslint'],
  nitro: envNitroOutputDir
    ? {
        output: {
          dir: envNitroOutputDir
        }
      }
    : {},
  vite: {
    optimizeDeps: {
      include: [
        'ag-grid-community',
        'ag-grid-vue3',
        '@fullcalendar/core',
        '@fullcalendar/daygrid',
        '@fullcalendar/interaction',
        '@fullcalendar/multimonth',
        '@fullcalendar/vue3',
        '@fullcalendar/core/locales/pt-br'
      ]
    }
  },
  runtimeConfig: {
    editKey: process.env.EDIT_KEY || 'demo-finance-key',
    supabaseUrl: envSupabaseUrl,
    supabaseServiceKey: envSupabaseServiceKey,
    dataFilePath: process.env.DATA_FILE_PATH || '',
    public: {
      appName: 'Financeiro Familiar',
      defaultEditKey: process.env.EDIT_KEY || 'demo-finance-key',
      supabaseUrl: envSupabaseUrl,
      supabaseAnonKey: envSupabasePublishableKey
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    strategies: 'generateSW',
    devOptions: {
      enabled: true,
    },
    manifest: {
      name: 'Financeiro Familiar',
      short_name: 'Financeiro',
      description: 'Planejamento financeiro familiar com dashboard, planilha e calendario.',
      theme_color: '#5b5bf7',
      background_color: '#f3efe6',
      display: 'standalone',
      start_url: '/',
      id: '/',
      scope: '/',
      lang: 'pt-BR',
      orientation: 'portrait-primary',
      prefer_related_applications: false,
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      // navigateFallback null = não intercepta navegação SSR (Vercel/Nitro serve o HTML)
      navigateFallback: null,
      skipWaiting: true,
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,png,svg,ico,webmanifest}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/planilha-cyan\.vercel\.app\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60
            }
          }
        }
      ]
    }
  },
  app: {
    head: {
      title: 'Financeiro Familiar',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#5b5bf7' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Financeiro' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ]
    }
  }
})
