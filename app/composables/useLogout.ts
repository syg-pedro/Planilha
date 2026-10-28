import { useAuth } from '~/composables/useAuth'
import { financeStorageKey } from '#shared/javaLab'

/**
 * Logout centralizado: encerra a sessão do Supabase (quando configurado),
 * limpa a chave de edição salva localmente e redireciona para o login.
 */
export const useLogout = () => {
  const { signOut } = useAuth()
  const javaLab = Boolean(import.meta.dev && useRuntimeConfig().public.javaLab)

  const logout = async () => {
    try {
      await signOut()
    } finally {
      if (import.meta.client) {
        const storage = javaLab ? sessionStorage : localStorage
        storage.removeItem(financeStorageKey('finance-edit-key', javaLab))
      }
      await navigateTo('/login')
    }
  }

  return { logout }
}
