<template>
  <div v-if="visible.length" class="flex flex-col gap-2">
    <UAlert
      v-for="item in visible"
      :key="item.index"
      :title="item.title"
      :description="item.body"
      :role="
        item.tone === 'danger' || item.tone === 'warning' ? 'alert' : 'status'
      "
      :aria-live="
        item.tone === 'danger' || item.tone === 'warning'
          ? 'assertive'
          : 'polite'
      "
      aria-atomic="true"
      :color="
        item.tone === 'danger'
          ? 'error'
          : item.tone === 'warning'
            ? 'warning'
            : item.tone === 'success'
              ? 'success'
              : 'info'
      "
      close
      @update:open="dismissed.push(item.index)"
      ><template #leading
        ><BaseIcon
          :name="
            item.tone === 'danger' || item.tone === 'warning'
              ? 'warning'
              : 'info'
          "
          :size="20" /></template
    ></UAlert>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
interface AlertItem {
  tone?: 'danger' | 'warning' | 'info' | 'success'
  title: string
  body?: string
}
const props = defineProps<{ alerts: AlertItem[] }>()
const dismissed = ref<number[]>([])
const visible = computed(() =>
  props.alerts
    .map((alert, index) => ({ ...alert, index }))
    .filter((item) => !dismissed.value.includes(item.index)),
)
</script>
