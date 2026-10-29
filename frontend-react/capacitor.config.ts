import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pedro.planilha',
  appName: 'Planilha',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    adjustMarginsForEdgeToEdge: 'force'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#00f59b'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07090e'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK'
    }
  }
}

export default config

