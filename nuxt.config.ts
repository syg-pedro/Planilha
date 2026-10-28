// https://nuxt.com/docs/api/configuration/nuxt-config
import { execFileSync } from 'node:child_process'
import { DEFAULT_MOBILE_ALLOWED_ORIGINS, PRODUCTION_WEB_URL } from './shared/deployment'
import { assertJavaLabDevelopment, assertJavaLabTarget, javaLabConfigured, JAVA_LAB_ORIGIN, JAVA_LAB_PORT } from './shared/javaLab'

const javaLab = javaLabConfigured(process.env.NUXT_JAVA_LAB, process.env.NUXT_PUBLIC_JAVA_LAB)
if (javaLab && process.env.NODE_ENV === 'production') assertJavaLabDevelopment(false)
if (javaLab && process.env.NUXT_DEV_API_PROXY_TARGET) assertJavaLabTarget(process.env.NUXT_DEV_API_PROXY_TARGET)
if (javaLab && process.env.NUXT_PUBLIC_API_BASE_URL) assertJavaLabTarget(process.env.NUXT_PUBLIC_API_BASE_URL)

const envSupabaseUrl = javaLab ? '' : (
  process.env.SUPABASE_URL ||
  process.env.NUXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '')

const envSupabaseServiceKey = javaLab ? '' : (
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET ||
  '')

const envSupabasePublishableKey = javaLab ? '' : (
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '')

const envNitroOutputDir = process.env.NITRO_OUTPUT_DIR || ''
const envDevApiProxyTarget = javaLab ? JAVA_LAB_ORIGIN : process.env.NUXT_DEV_API_PROXY_TARGET || ''
const resolveWebBuildVersion = () => {
  const versionFromEnvironment = process.env.NUXT_PUBLIC_WEB_BUILD_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA
  if (versionFromEnvironment) return versionFromEnvironment.slice(0, 7)

  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

const webBuildVersion = resolveWebBuildVersion()

export default defineNuxtConfig({
  ...(javaLab ? { devServer: { host: '127.0.0.1', port: JAVA_LAB_PORT } } : {}),
  hooks: {
    ready(nuxt) {
      if (javaLab) assertJavaLabDevelopment(nuxt.options.dev)
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt', '@nuxt/ui', '@vite-pwa/nuxt', '@nuxt/eslint'],
  ui: { fonts: false, colorMode: false },
  icon: { serverBundle: { collections: ['lucide', 'bi', 'iconoir', 'ri', 'material-symbols', 'ph', 'tabler', 'heroicons'] } },
  nitro: {
    ...(envNitroOutputDir ? { output: { dir: envNitroOutputDir } } : {}),
    // Encaminha a API no desenvolvimento sem exigir CORS no backend remoto.
    ...(envDevApiProxyTarget
      ? { devProxy: { '/api': { target: `${envDevApiProxyTarget.replace(/\/$/, '')}/api`, changeOrigin: true } } }
      : {})
  },
  runtimeConfig: {
    editKey: process.env.EDIT_KEY || 'demo-finance-key',
    mobileAllowedOrigins: process.env.MOBILE_ALLOWED_ORIGINS || DEFAULT_MOBILE_ALLOWED_ORIGINS.join(','),
    supabaseUrl: envSupabaseUrl,
    supabaseServiceKey: envSupabaseServiceKey,
    dataFilePath: process.env.DATA_FILE_PATH || '',
    public: {
      javaLab,
      appName: 'Planilha',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '1.1.1',
      webBuildVersion,
      webVersionUrl: javaLab ? '' : '/api/web-version',
      updateManifestUrl: javaLab ? '' : process.env.NUXT_PUBLIC_UPDATE_MANIFEST_URL || `${PRODUCTION_WEB_URL}/api/android-release`,
      defaultEditKey: javaLab ? 'finance-java-lab' : process.env.EDIT_KEY || 'demo-finance-key',
      apiBaseUrl: javaLab ? '' : process.env.NUXT_PUBLIC_API_BASE_URL || '',
      supabaseUrl: envSupabaseUrl,
      supabaseAnonKey: envSupabasePublishableKey
    }
  },
  pwa: {
    disable: javaLab,
    registerType: 'autoUpdate',
    injectRegister: javaLab ? false : 'auto',
    strategies: 'generateSW',
    devOptions: {
      enabled: !javaLab,
    },
    manifest: {
      name: 'Planilha',
      short_name: 'Planilha',
      description: 'Organize despesas, receitas e cartões em uma planilha financeira.',
      theme_color: '#0F172A',
      background_color: '#0F172A',
      display: 'standalone',
      start_url: '/',
      id: '/',
      scope: '/',
      lang: 'pt-BR',
      orientation: 'portrait-primary',
      prefer_related_applications: false,
      icons: [
        {
          src: '/icon-192-v2.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512-v2.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-maskable-512-v2.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      // navigateFallback null = não intercepta navegação SSR (Vercel/Nitro serve o HTML)
      navigateFallback: null,
      skipWaiting: true,
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,png,svg,ico,webmanifest,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/planilha-mocha\.vercel\.app\/api\/.*/i,
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
      title: 'Planilha',
      htmlAttrs: {
        'data-theme': 'light'
      },
      link: [
        ...(javaLab ? [] : [
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' as const },
          { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' }
        ]),
        { rel: 'icon', type: 'image/x-icon', sizes: '16x16 32x32 48x48', href: '/favicon.ico?v=2' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png?v=2' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=2' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=2' }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0F172A' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Planilha' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ]
    }
  }
})
