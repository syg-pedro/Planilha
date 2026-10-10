<template>
  <div class="month-picker" @keydown.esc.stop>
    <span v-if="label" class="month-picker__label">{{ label }}</span>
    <button
      ref="trigger"
      type="button"
      class="month-picker__trigger"
      :popovertarget="panelId"
      :aria-label="`${label || 'Mês'}: ${displayMonth}. Escolher mês`"
      aria-haspopup="dialog"
    >
      {{ displayMonth }}
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    </button>
    <div
      :id="panelId"
      ref="panel"
      popover
      role="dialog"
      :aria-label="label ? `Escolher mês — ${label}` : 'Escolher mês'"
      class="month-picker__panel"
      :style="position"
      @beforetoggle="prepare"
      @toggle="onToggle"
    >
      <div class="month-picker__year">
        <button
          type="button"
          aria-label="Ano anterior"
          :disabled="browseYear <= minYear"
          @click="browseYear--"
        >
          ‹
        </button>
        <input
          :value="browseYear"
          type="number"
          aria-label="Ano do calendário"
          :min="minYear"
          :max="maxYear"
          @change="setYear"
        />
        <button
          type="button"
          aria-label="Próximo ano"
          :disabled="browseYear >= maxYear"
          @click="browseYear++"
        >
          ›
        </button>
      </div>
      <div class="month-picker__months" @keydown="navigateMonths">
        <button
          v-for="(month, index) in MONTHS"
          :key="month"
          type="button"
          :data-month="index"
          :aria-label="`${month} de ${browseYear}`"
          :aria-pressed="monthValue(index) === modelValue"
          :disabled="!isAllowed(monthValue(index))"
          @click="choose(monthValue(index))"
        >
          {{ month }}
        </button>
      </div>
      <button
        type="button"
        class="month-picker__today"
        :disabled="!isAllowed(currentMonth)"
        @click="choose(currentMonth)"
      >
        Este mês
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    min?: string
    max?: string
  }>(),
  { label: '', min: '1900-01', max: '2199-12' },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const minYear = computed(() => Number(props.min.slice(0, 4)))
const maxYear = computed(() => Number(props.max.slice(0, 4)))
const displayMonth = computed(() =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(props.modelValue)
    ? `${MONTHS[Number(props.modelValue.slice(5, 7)) - 1]} de ${props.modelValue.slice(0, 4)}`
    : 'Escolher mês',
)
const browseYear = ref(now.getFullYear())
const panelId = useId()
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const position = reactive({ top: '0px', left: '0px' })
const monthValue = (index: number) => `${browseYear.value}-${String(index + 1).padStart(2, '0')}`
const isAllowed = (value: string) => value >= props.min && value <= props.max

function positionPanel() {
  if (!trigger.value || !panel.value) return
  const rect = trigger.value.getBoundingClientRect()
  const width = Math.min(288, window.innerWidth - 24)
  const height = panel.value.offsetHeight || 260
  position.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`
  position.top = `${rect.bottom + height + 8 <= window.innerHeight - 12 ? rect.bottom + 8 : Math.max(12, rect.top - height - 8)}px`
}
function prepare(event: Event) {
  if ((event as ToggleEvent).newState !== 'open') return
  const selectedYear = Number(props.modelValue.slice(0, 4)) || now.getFullYear()
  browseYear.value = Math.min(maxYear.value, Math.max(minYear.value, selectedYear))
  positionPanel()
}
function onToggle(event: Event) {
  if ((event as ToggleEvent).newState !== 'open') return
  positionPanel()
  const selected =
    panel.value?.querySelector<HTMLButtonElement>('[data-month][aria-pressed="true"]') ??
    panel.value?.querySelector<HTMLButtonElement>('[data-month]:not(:disabled)')
  selected?.focus()
}
function setYear(event: Event) {
  const input = event.target as HTMLInputElement
  browseYear.value = Math.min(
    maxYear.value,
    Math.max(minYear.value, Number.parseInt(input.value) || now.getFullYear()),
  )
  input.value = String(browseYear.value)
}
function choose(value: string) {
  if (!isAllowed(value)) return
  emit('update:modelValue', value)
  panel.value?.hidePopover()
  trigger.value?.focus()
}
function navigateMonths(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (target.dataset.month == null) return
  const index = Number(target.dataset.month)
  const next =
    event.key === 'ArrowRight'
      ? index + 1
      : event.key === 'ArrowLeft'
        ? index - 1
        : event.key === 'ArrowDown'
          ? index + 3
          : event.key === 'ArrowUp'
            ? index - 3
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? 11
                : null
  if (next == null) return
  event.preventDefault()
  panel.value
    ?.querySelector<HTMLButtonElement>(`[data-month="${Math.min(11, Math.max(0, next))}"]:not(:disabled)`)
    ?.focus()
}
function dismissOnResize() {
  panel.value?.hidePopover()
}
onMounted(() => window.addEventListener('resize', dismissOnResize))
onBeforeUnmount(() => window.removeEventListener('resize', dismissOnResize))
</script>

<style scoped>
.month-picker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.month-picker__label {
  font-size: 11px;
  color: var(--text2);
}
.month-picker__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  min-height: var(--ds-control-height);
  padding: 6px var(--ds-space-3);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface2);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
}
.month-picker__trigger:hover {
  border-color: var(--primary);
}
.month-picker__panel {
  position: fixed;
  inset: auto;
  margin: 0;
  width: min(288px, calc(100vw - 24px));
  padding: var(--ds-space-3);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-md);
}
.month-picker__panel:popover-open {
  display: grid;
  gap: var(--ds-space-3);
}
.month-picker__year {
  display: flex;
  align-items: center;
  gap: 8px;
}
.month-picker__year input {
  width: 0;
  flex: 1;
  text-align: center;
  min-height: var(--ds-control-height);
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface2);
  color: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}
.month-picker__year button,
.month-picker__months button,
.month-picker__today {
  min-height: 36px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface2);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.month-picker__year button {
  min-width: 36px;
  font-size: 18px;
}
.month-picker__months {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.month-picker__months button[aria-pressed='true'] {
  border-color: var(--primary);
  background: var(--primary-dim);
  color: var(--text);
  font-weight: 800;
}
.month-picker__months button:hover,
.month-picker__year button:hover {
  border-color: var(--primary);
}
.month-picker__today {
  background: var(--primary);
  color: var(--on-primary);
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
@media (max-width: 767px) {
  .month-picker__trigger,
  .month-picker__panel button,
  .month-picker__year input {
    min-height: var(--ds-control-height);
  }
}
</style>
