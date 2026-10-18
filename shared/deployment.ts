export const PRODUCTION_WEB_URL = 'https://planilha-cyan.vercel.app'
export const LEGACY_ANDROID_WEB_URL = 'https://planilha-mocha.vercel.app'

export const DEFAULT_MOBILE_ALLOWED_ORIGINS = [
  'https://localhost',
  PRODUCTION_WEB_URL,
  LEGACY_ANDROID_WEB_URL
] as const

export const mobileAllowedOrigins = (additionalOrigins = '') => [...new Set([
  ...DEFAULT_MOBILE_ALLOWED_ORIGINS,
  ...additionalOrigins.split(',').map(origin => origin.trim()).filter(Boolean)
])]
