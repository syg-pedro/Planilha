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

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    'ag-grid-community/styles/ag-grid.css',
    'ag-grid-community/styles/ag-theme-quartz.css'
  ],
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt', '@nuxt/eslint'],
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
    manifest: {
      name: 'Financeiro Familiar',
      short_name: 'Financeiro',
      description: 'Planejamento financeiro familiar com dashboard, planilha e calendario.',
      theme_color: '#0f766e',
      background_color: '#f8fafc',
      display: 'standalone',
      start_url: '/',
      lang: 'pt-BR',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      runtimeCaching: [
        {
          urlPattern: '/api/.*',
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
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f766e' }
      ]
    }
  }
})
