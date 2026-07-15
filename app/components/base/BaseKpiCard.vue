<template>
  <div
    class="base-kpi"
    :class="{ 'base-kpi--interactive': onClick }"
    :style="{ '--kpi-color': color }"
    :role="onClick ? 'button' : undefined"
    :tabindex="onClick ? 0 : undefined"
    @click="onClick?.()"
    @keydown.enter.prevent="onClick?.()"
    @keydown.space.prevent="onClick?.()"
  >
    <div class="base-kpi__accent" aria-hidden="true" />
    <div v-if="alert" class="base-kpi__alert">
      <BaseIcon name="warning" :size="14" color="var(--warning)" />
    </div>
    <div class="base-kpi__top">
      <div class="base-kpi__icon">
        <BaseIcon :name="icon" :size="17" :color="color" />
      </div>
      <span
        v-if="trend !== undefined"
        class="base-kpi__trend"
        :class="trend >= 0 ? 'base-kpi__trend--up' : 'base-kpi__trend--down'"
        :style="trend >= 0
          ? { background: 'var(--success-light)', color: 'var(--success)' }
          : { background: 'var(--danger-light)', color: 'var(--danger)' }"
      >
        {{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
    </div>
    <div>
      <p class="base-kpi__label">{{ label }}</p>
      <p class="base-kpi__value">{{ value }}</p>
      <p v-if="sub" class="base-kpi__sub">{{ sub }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '../../design-system/components/BaseIcon.vue'

withDefaults(defineProps<{
  icon: string
  label: string
  value: string
  sub?: string
  color?: string
  trend?: number
  alert?: boolean
  onClick?: () => void
}>(), {
  sub: '',
  color: 'var(--primary)',
  trend: undefined,
  alert: false,
  onClick: undefined,
})

</script>

<style scoped>
.base-kpi {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
  padding: 16px 18px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  cursor: default;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.base-kpi:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.base-kpi--interactive {
  cursor: pointer;
}

.base-kpi--interactive:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ds-shadow-color);
}

.base-kpi__accent {
  position: absolute;
  right: -22px;
  top: -32px;
  width: 92px;
  height: 72px;
  background: var(--kpi-color);
  border: 2px solid var(--border);
  transform: rotate(18deg);
  opacity: 0.2;
  pointer-events: none;
}

.base-kpi__alert {
  position: absolute;
  top: 10px;
  right: 10px;
}

.base-kpi__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.base-kpi__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--kpi-color);
  background: var(--surface2);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
}

.base-kpi__trend {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.base-kpi__label {
  margin-bottom: 4px;
  color: var(--text3);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.base-kpi__value {
  color: var(--kpi-color);
  font-family: var(--ds-font-family-mono);
  font-size: clamp(18px, 2vw, 22px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.05em;
}

.base-kpi__sub {
  margin-top: 5px;
  color: var(--text3);
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .base-kpi {
    gap: 7px;
    padding: 11px 12px 10px;
    border-radius: var(--radius-sm);
    box-shadow: 2px 2px 0 var(--ds-shadow-color);
  }

  .base-kpi__accent {
    right: -18px;
    top: -25px;
    width: 68px;
    height: 54px;
  }

  .base-kpi__icon {
    width: 30px;
    height: 30px;
    border-width: 2px;
    box-shadow: 1px 1px 0 var(--ds-shadow-color);
  }

  .base-kpi__icon :deep(svg) {
    width: 15px;
    height: 15px;
  }

  .base-kpi__label {
    margin-bottom: 2px;
    font-size: 9px;
    letter-spacing: 0.07em;
  }

  .base-kpi__value {
    font-size: clamp(16px, 4.6vw, 20px);
  }

  .base-kpi__sub {
    margin-top: 3px;
    font-size: 10px;
  }
}
</style>
