import { createError, getRequestURL } from 'h3'
import { assertJavaLabBrowserOrigin } from '../../shared/javaLab'

export default defineEventHandler((event) => {
  if (!import.meta.dev || process.env.NUXT_JAVA_LAB !== '1') return
  try {
    assertJavaLabBrowserOrigin(getRequestURL(event).origin)
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Use o endereço local exclusivo do laboratório na porta 3100.' })
  }
  const config = useRuntimeConfig(event)
  config.supabaseUrl = ''
  config.supabaseServiceKey = ''
  config.public.javaLab = true
  config.public.supabaseUrl = ''
  config.public.supabaseAnonKey = ''
  config.public.apiBaseUrl = ''
  config.public.webVersionUrl = ''
  config.public.updateManifestUrl = ''
  config.public.defaultEditKey = 'finance-java-lab'
})
