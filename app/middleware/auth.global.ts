export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) return

  const client = useSupabaseClient()
  if (!client) return

  const { data: { user } } = await client.auth.getUser()

  const publicRoutes = ['/login', '/signup']
  if (!user && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
  if (user && publicRoutes.includes(to.path)) {
    return navigateTo('/')
  }
})
