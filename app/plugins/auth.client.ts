export default defineNuxtPlugin(async () => {
  const { init, user } = useAuth()
  await init()

  // Se o session foi renovado pelo plugin e o usuário já estava autenticado,
  // mas o middleware server-side o mandou para /login, redireciona para o app
  const route = useRoute()
  const publicRoutes = ['/login', '/signup']
  if (user.value && publicRoutes.includes(route.path)) {
    await navigateTo('/')
  }
})
