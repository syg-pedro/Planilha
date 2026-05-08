<template>
  <div
    :style="{
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: onClick ? 'pointer' : 'default',
    }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click="onClick?.()"
  >
    <div
      style="position: absolute; right: -16px; top: -16px; width: 80px; height: 80px; border-radius: 50%; pointer-events: none"
      :style="{ background: color + '18' }"
    />
    <div v-if="alert" style="position: absolute; top: 10px; right: 10px">
      <BaseIcon name="warning" :size="14" color="var(--warning)" />
    </div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start">
      <div
        style="width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center"
        :style="{ background: color + '18', color }"
      >
        <BaseIcon :name="icon" :size="17" :color="color" />
      </div>
      <span
        v-if="trend !== undefined"
        style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap"
        :style="trend >= 0
          ? { background: 'var(--success-light)', color: 'var(--success)' }
          : { background: 'var(--danger-light)', color: 'var(--danger)' }"
      >
        {{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
    </div>
    <div>
      <p style="font-size: 11px; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px">{{ label }}</p>
      <p style="font-size: 22px; font-weight: 800; line-height: 1.1" :style="{ color }">{{ value }}</p>
      <p v-if="sub" style="font-size: 11px; color: var(--text3); margin-top: 4px">{{ sub }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseIcon from './BaseIcon.vue'

const props = withDefaults(defineProps<{
  icon: string
  label: string
  value: string
  sub?: string
  color?: string
  trend?: number
  alert?: boolean
  onClick?: () => void
}>(), {
  color: 'var(--primary)',
  alert: false,
})

const hovered = ref(false)
</script>
