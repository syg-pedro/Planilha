import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pedro.financeirofamiliar',
  appName: 'Financeiro Familiar',
  webDir: process.env.CAPACITOR_WEB_DIR ?? '.output/public',
  server: {
    androidScheme: 'https'
  },
  android: {
    adjustMarginsForEdgeToEdge: 'force'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#d7ff18'
    }
  }
}

export default config
