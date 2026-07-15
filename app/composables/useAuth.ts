import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '~/utils/supabase/client'

export const useAuth = () => {
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

  return { user, init, signIn, signUp, signOut, getAccessToken }
}
