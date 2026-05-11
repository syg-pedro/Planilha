<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    style="flex-shrink: 0"
  >
    <path :d="path" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const ICON_PATHS: Record<string, string> = {
  dashboard: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2m4 0h-4m0 0V14m0 4v3',
  grid: 'M3 6h18M3 12h18M3 18h18',
  calendar: 'M3 4h18v16H3zM16 2v4M8 2v4M3 10h18',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zm6.4-3a6.4 6.4 0 01-.1 1.1l2.4 1.9-2.3 4-2.8-1.1a7 7 0 01-1.9 1.1L13 22h-2l-.7-2.9a7 7 0 01-1.9-1.1L5.6 19 3.3 15l2.4-1.9A6.4 6.4 0 015.6 12a6.4 6.4 0 01.1-1.1L3.3 9l2.3-4 2.8 1.1A7 7 0 0110.3 5L11 2h2l.7 2.9a7 7 0 011.9 1.1l2.8-1.1 2.3 4-2.4 1.9a6.4 6.4 0 01.1 1.1z',
  budget: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 14.5v2h-2v-2H7v-2l1-5h8l1 5h-4v2zm0-6H11V7h2v3.5z',
  goal: 'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 18l-6.1 3 1.2-6.8L2 9.3l6.9-1z',
  subscription: 'M21 4H3v16h18V4zM3 8h18M7 12h.01M11 12h.01M15 12h.01',
  debt: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM8 11h8M8 13h5',
  patrimony: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  planning: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  scenario: 'M22 12h-4l-3 9L9 3l-3 9H2',
  reports: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zm-2 16H8v-2h4zm2-4H8v-2h6zm0-4H8V8h6zm0-4H8V6h2l4 4h-2z',
  reconcile: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  alerts: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  income: 'M18 15l-6-6-6 6',
  expense: 'M6 9l6 6 6-6',
  balance: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  pending: 'M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 6v6l4 2',
  card: 'M1 4h22v16H1zM1 10h22',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  trash: 'M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z',
  chevron_down: 'M6 9l6 6 6-6',
  chevron_right: 'M9 18l6-6-6-6',
  chevron_left: 'M15 18l-6-6 6-6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0115 0M20.5 15a9 9 0 01-15 0',
  warning: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
  info: 'M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 16v-4M12 8h.01',
  arrow_up_right: 'M7 17L17 7M7 7h10v10',
  tag: 'M20.6 8.3l-4.9-4.9A2 2 0 0014.3 3H7a2 2 0 00-2 2v7.3a2 2 0 00.6 1.4l4.9 4.9a2 2 0 002.8 0l7.3-7.3a2 2 0 000-2.8zM9 9h.01',
  export: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  sparkle: 'M5 3l.5 2.5L8 6l-2.5.5L5 9l-.5-2.5L2 6l2.5-.5zM19 3l.5 2.5L22 6l-2.5.5L19 9l-.5-2.5L16 6l2.5-.5zM12 13l1 4 4 1-4 1-1 4-1-4-4-1 4-1z',
  wishlist: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z',
}

const props = withDefaults(defineProps<{
  name: string
  size?: number
  color?: string
}>(), {
  size: 16,
  color: 'currentColor',
})

const path = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS['info'])
</script>
