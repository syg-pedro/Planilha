type HomologationConfig = {
  environment: string
  webUrl?: string
  projectRef?: string
  supabaseUrl?: string
  publicSupabaseUrl?: string
  serviceKey?: string
  anonKey?: string
  apiBaseUrl?: string
  allowSharedProductionDatabase?: boolean
}

export function validateHomologation(config: HomologationConfig) {
  if (config.environment !== 'homol') return
  const productionHosts = new Set(['planilha-cyan.vercel.app', 'planilha-mocha.vercel.app'])
  const origin = (value: string | undefined) => {
    const url = new URL(value || '')
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('Homologação exige origens HTTPS sem credenciais, query ou caminho.')
    }
    return url
  }
  const web = origin(config.webUrl)
  if (productionHosts.has(web.hostname)) throw new Error('A URL de homologação não pode apontar para produção.')
  if (!config.projectRef || !/^[a-z]{20}$/.test(config.projectRef)
    || (config.projectRef === 'whltzvaqakgvqfylciot' && !config.allowSharedProductionDatabase)) {
    throw new Error('Informe um Supabase exclusivo ou autorize explicitamente o banco compartilhado em homologação.')
  }
  const expected = `https://${config.projectRef}.supabase.co`
  if (origin(config.supabaseUrl).origin !== expected || origin(config.publicSupabaseUrl).origin !== expected) {
    throw new Error('Backend e autenticação de homologação devem usar o Supabase configurado.')
  }
  if (!config.serviceKey || !config.anonKey) throw new Error('Faltam as credenciais do Supabase de homologação.')
  if (config.apiBaseUrl && origin(config.apiBaseUrl).origin !== web.origin) {
    throw new Error('A API de homologação deve usar a origem web de homologação.')
  }
}
