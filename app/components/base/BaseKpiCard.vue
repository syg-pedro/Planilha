<template>
  <UCard
    :as="onClick ? 'button' : 'div'"
    :type="onClick ? 'button' : undefined"
    :class="{
      'cursor-pointer text-left hover:ring-accented focus-visible:outline-primary':
        onClick,
    }"
    :ui="{ body: 'p-3 sm:p-3' }"
    @click="onClick?.()"
  >
    <div class="mb-2 flex items-center justify-between gap-2 text-muted">
      <BaseIcon :name="icon" :size="16" /><UBadge
        v-if="trend !== undefined"
        :color="trend >= 0 ? 'success' : 'error'"
        size="xs"
        >{{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%</UBadge
      ><BaseIcon
        v-else-if="alert"
        name="warning"
        :size="16"
        class="text-warning"
      />
    </div>
    <p class="mb-1 text-xs text-muted">{{ label }}</p>
    <p
      class="text-lg leading-tight font-semibold tabular-nums"
      :style="{ color }"
    >
      {{ value }}
    </p>
    <p v-if="sub" class="mt-1 text-xs text-muted">{{ sub }}</p>
    <p v-if="detail" class="mt-1 text-xs text-toned">{{ detail }}</p>
  </UCard>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string
    label: string
    value: string
    sub?: string
    detail?: string
    color?: string
    trend?: number
    alert?: boolean
    onClick?: () => void
  }>(),
  {
    sub: '',
    detail: '',
    color: 'var(--primary)',
    trend: undefined,
    alert: false,
    onClick: undefined,
  },
)
</script>
