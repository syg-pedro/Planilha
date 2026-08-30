import type { CapacitorConfig } from '@capacitor/cli'

const productionWebUrl = process.env.CAPACITOR_SERVER_URL || 'https://planilha-cyan.vercel.app'
const useBundledWebAssets = process.env.CAPACITOR_USE_BUNDLED_WEB === 'true'

const config: CapacitorConfig = {
  appId: 'com.pedro.financeirofamiliar',
  appName: 'Financeiro Familiar',
  webDir: process.env.CAPACITOR_WEB_DIR ?? '.output/public',
  server: useBundledWebAssets
    ? {
        androidScheme: 'https'
      }
    : {
        androidScheme: 'https',
        url: productionWebUrl
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
