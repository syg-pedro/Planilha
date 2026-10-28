import type { User } from '@supabase/supabase-js'
import { computed } from 'vue'
import { assertJavaLabBrowserOrigin, javaLabActive } from '#shared/javaLab'
import { createSupabaseBrowserClient } from '~/utils/supabase/client'

export const useAuth = () => {
  if (javaLabActive(useRuntimeConfig().public.javaLab, import.meta.dev)) return useJavaLabAuth()
  const user = useState<User | null>('supabase-user', () => null)

  const getBrowserClient = () => {
    try {
      return createSupabaseBrowserClient()
    } catch {
      return null
    }
  }

  const init = async () => {
    const client = getBrowserClient()
    if (!client) return

    const { data: { session } } = await client.auth.getSession()
    user.value = session?.user ?? null

    client.auth.onAuthStateChange((_, session) => {
      user.value = session?.user ?? null
    })
  }

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const client = getBrowserClient()
    if (!client) return { error: 'Supabase não configurado' }
    try {
      const { error } = await client.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    } catch (err) {
      return { error: String(err) }
    }
  }

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    const client = getBrowserClient()
    if (!client) return { error: 'Supabase não configurado' }
    try {
      const { error } = await client.auth.signUp({ email, password })
      return { error: error?.message ?? null }
    } catch (err) {
      return { error: String(err) }
    }
  }

  const signOut = async () => {
    try {
      const client = getBrowserClient()
      if (client) await client.auth.signOut()
    } finally {
      user.value = null
    }
  }

  const getAccessToken = async (): Promise<string | null> => {
    const client = getBrowserClient()
    if (!client) return null
    const { data } = await client.auth.getSession()
    return data.session?.access_token ?? null
  }

  const getSessionKey = () => user.value?.id ?? ''
  return { user, init, signIn, signUp, signOut, getAccessToken, getSessionKey }
}

type JavaLabSession = {
  accessToken: string
  expiresAt: string
  user: { id: string; name: string; email: string }
  family: { id: string; name: string; role: string }
}

let refreshing: Promise<JavaLabSession | null> | undefined

const useJavaLabAuth = () => {
  const session = useState<JavaLabSession | null>('finance-java-lab:auth', () => null)
  const user = computed(() => session.value?.user ?? null)

  const accept = (value: JavaLabSession) => {
    if (!value?.accessToken || !value.user?.id || !value.family?.id || !Number.isFinite(Date.parse(value.expiresAt))) {
      throw new Error('Não foi possível confirmar a sessão local.')
    }
    session.value = value
    return value
  }

  const refresh = async () => {
    if (!import.meta.client) return null
    assertJavaLabBrowserOrigin(window.location.origin)
    if (!refreshing) refreshing = $fetch<JavaLabSession>('/api/auth/refresh', {
      method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'FinanceiroLab' }
    }).then(accept).catch(() => {
      session.value = null
      return null
    }).finally(() => { refreshing = undefined })
    return refreshing
  }

  const getAccessToken = async (): Promise<string | null> => {
    if (!import.meta.client) return null
    assertJavaLabBrowserOrigin(window.location.origin)
    if (session.value && Date.parse(session.value.expiresAt) > Date.now() + 30_000) return session.value.accessToken
    return (await refresh())?.accessToken ?? null
  }

  const authenticate = async (route: 'login' | 'register', body: Record<string, string>): Promise<{ error: string | null }> => {
    if (!import.meta.client) return { error: 'Entre pelo navegador do laboratório.' }
    try {
      assertJavaLabBrowserOrigin(window.location.origin)
      if (refreshing) await refreshing
      accept(await $fetch<JavaLabSession>(`/api/auth/${route}`, { method: 'POST', body, credentials: 'same-origin' }))
      return { error: null }
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status
      console.error('Falha de autenticação no laboratório Java.', { status })
      return { error: status === 401 ? 'E-mail ou senha incorretos.' : status === 409
        ? 'Este e-mail já está cadastrado no laboratório.' : 'Não foi possível entrar no laboratório. Confira os dados e tente novamente.' }
    }
  }

  const signIn = (email: string, password: string) => authenticate('login', { email, password })
  const signUp = (email: string, password: string) => authenticate('register', {
    name: email.split('@')[0] || 'Pessoa do laboratório', email, password, familyName: 'Família do laboratório'
  })
  const signOut = async () => {
    try {
      if (import.meta.client) {
        assertJavaLabBrowserOrigin(window.location.origin)
        if (refreshing) await refreshing
        const token = await getAccessToken()
        await $fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin',
          headers: { 'X-Requested-With': 'FinanceiroLab', ...(token ? { authorization: `Bearer ${token}` } : {}) } })
      }
    } finally {
      session.value = null
    }
  }
  const init = async () => { await getAccessToken() }
  const getSessionKey = () => session.value ? `${session.value.user.id}:${session.value.family.id}` : ''
  return { user, init, signIn, signUp, signOut, getAccessToken, getSessionKey }
}
