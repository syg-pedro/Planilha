import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export const isMobileNative = Capacitor.isNativePlatform()
export const mobilePlatform = Capacitor.getPlatform()

export async function hapticFeedback(tipo: 'suave' | 'sucesso' | 'erro' | 'aviso' = 'suave') {
  if (!isMobileNative) return
  try {
    if (tipo === 'suave') {
      await Haptics.impact({ style: ImpactStyle.Light })
    } else if (tipo === 'sucesso') {
      await Haptics.notification({ type: NotificationType.Success })
    } else if (tipo === 'erro') {
      await Haptics.notification({ type: NotificationType.Error })
    } else if (tipo === 'aviso') {
      await Haptics.notification({ type: NotificationType.Warning })
    }
  } catch {
    // Silencioso em dispositivos sem suporte a haptics
  }
}

export function useMobile(menuAberto?: boolean, fecharMenu?: () => void) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isMobileNative) return

    // Configuração inicial de StatusBar no mobile
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    if (mobilePlatform === 'android') {
      void StatusBar.setBackgroundColor({ color: '#07090e' }).catch(() => {})
    }

    // Tratamento de botão Voltar do Android
    const listener = App.addListener('backButton', () => {
      if (menuAberto && fecharMenu) {
        fecharMenu()
        return
      }

      if (location.pathname !== '/' && location.pathname !== '/login') {
        navigate(-1)
      } else {
        void App.minimizeApp()
      }
    })

    return () => {
      void listener.then(handle => handle.remove()).catch(() => {})
    }
  }, [navigate, location.pathname, menuAberto, fecharMenu])

  return {
    isNative: isMobileNative,
    platform: mobilePlatform,
    haptic: hapticFeedback
  }
}

