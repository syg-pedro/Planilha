export default defineNuxtPlugin(async (nuxtApp) => {
  const { init, user } = useAuth()
  const dispose = await init()
  nuxtApp.vueApp.onUnmount(() => dispose?.())

  // Se o session foi renovado pelo plugin e o usuário já estava autenticado,
  // mas o middleware server-side o mandou para /login, redireciona para o app
  const route = useRoute()
  const publicRoutes = ['/login', '/signup']
  if (user.value && publicRoutes.includes(route.path)) {
    await navigateTo('/')
  }
})
