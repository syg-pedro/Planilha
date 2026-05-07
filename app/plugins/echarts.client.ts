import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, GaugeChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts'
import {
  CalendarComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  BarChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  CalendarComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent
])

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VChart', VChart)
})
