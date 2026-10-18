import type { CapacitorConfig } from '@capacitor/cli'
import { PRODUCTION_WEB_URL } from './shared/deployment'

const productionWebUrl = process.env.CAPACITOR_SERVER_URL || PRODUCTION_WEB_URL
const useBundledWebAssets = process.env.CAPACITOR_USE_BUNDLED_WEB === 'true'

const config: CapacitorConfig = {
  appId: 'com.pedro.financeirofamiliar',
  appName: 'Planilha',
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
      iconColor: '#00DC82'
    }
  }
}

export default config
