const PUBLIC_ROUTES = ['/login', '/signup']

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) return

  // Skip on SSR: o access token pode estar expirado no servidor sem poder ser renovado.
  // O cliente usa getSession() que renova o token via refresh token automaticamente.
  if (import.meta.server) return

  const client = useSupabaseClient()
  if (!client) return

  // getSession() renova o access token expirado via refresh token — getUser() não faz isso
  const { data: { session } } = await client.auth.getSession()
  const user = session?.user ?? null

  if (!user && !PUBLIC_ROUTES.includes(to.path)) {
    return navigateTo('/login')
  }
  if (user && PUBLIC_ROUTES.includes(to.path)) {
    return navigateTo('/')
  }
})
