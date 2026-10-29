import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export function useNotificacoes() {
  const isNative = Capacitor.isNativePlatform()
  const suportadoWeb = typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext
  const suportado = isNative || suportadoWeb

  const [permissao, definirPermissao] = useState<NotificationPermission>('default')
  const [pendente, definirPendente] = useState(false)
  const [falha, definirFalha] = useState(false)

  useEffect(() => {
    if (isNative) {
      void LocalNotifications.checkPermissions()
        .then(status => {
          definirPermissao(status.display === 'granted' ? 'granted' : status.display === 'denied' ? 'denied' : 'default')
        })
        .catch(() => {})
    } else if (suportadoWeb) {
      definirPermissao(Notification.permission)
    }
  }, [isNative, suportadoWeb])

  const solicitar = async () => {
    if (!suportado) return
    definirPendente(true)
    definirFalha(false)
    try {
      if (isNative) {
        const resultado = await LocalNotifications.requestPermissions()
        definirPermissao(resultado.display === 'granted' ? 'granted' : resultado.display === 'denied' ? 'denied' : 'default')
      } else if (suportadoWeb) {
        definirPermissao(await Notification.requestPermission())
      }
    } catch {
      definirFalha(true)
    } finally {
      definirPendente(false)
    }
  }

  const testar = async () => {
    if (!suportado) return
    if (isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() % 100000),
              title: 'Planilha',
              body: 'Os avisos do aplicativo estão habilitados e funcionando.',
              schedule: { at: new Date(Date.now() + 500) }
            }
          ]
        })
      } catch {
        definirFalha(true)
      }
    } else if (suportadoWeb && Notification.permission === 'granted') {
      try {
        new Notification('Planilha', { body: 'Os avisos deste navegador estão habilitados.' })
      } catch {
        definirFalha(true)
      }
    }
  }

  return { suportado, permissao, pendente, falha, solicitar, testar }
}
