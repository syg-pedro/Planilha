import { useState } from 'react'

export function useNotificacoes() {
  const suportado = typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext
  const [permissao, definirPermissao] = useState<NotificationPermission>(suportado ? Notification.permission : 'default')
  const [pendente, definirPendente] = useState(false)
  const [falha, definirFalha] = useState(false)
  const solicitar = async () => {
    if (!suportado) return
    definirPendente(true)
    definirFalha(false)
    try { definirPermissao(await Notification.requestPermission()) }
    catch { definirFalha(true) }
    finally { definirPendente(false) }
  }
  const testar = () => {
    if (suportado && Notification.permission === 'granted') {
      try { new Notification('Planilha', { body: 'Os avisos deste navegador estão habilitados.' }) }
      catch { definirFalha(true) }
    }
  }
  return { suportado, permissao, pendente, falha, solicitar, testar }
}
