import { useAuth } from '~/composables/useAuth'

/**
 * Logout centralizado: encerra a sessão do Supabase (quando configurado),
 * limpa a chave de edição salva localmente e redireciona para o login.
 */
export const useLogout = () => {
  const { signOut } = useAuth()

  const logout = async () => {
    try {
      await signOut()
    } finally {
      if (import.meta.client) {
        localStorage.removeItem('finance-edit-key')
      }
      await navigateTo('/login')
    }
  }

  return { logout }
}
