<template>
  <div class="month-picker inline-flex min-w-0 items-center gap-2">
    <span v-if="label" class="text-xs text-toned">{{ label }}</span>
    <UPopover
      :open="open"
      :content="contentProps"
      :ui="{
        content: 'month-picker__panel w-72 max-w-[calc(100vw-1.5rem)] p-3',
      }"
      @update:open="setOpen"
    >
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        class="month-picker__trigger finance-control"
        :aria-label="`${label || 'Mês'}: ${displayMonth}. Escolher mês`"
        >{{ displayMonth
        }}<template #trailing><BaseIcon name="calendar" :size="16" /></template
      ></UButton>
      <template #content>
        <div ref="panel" class="space-y-3">
          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              aria-label="Ano anterior"
              :disabled="browseYear <= minYear"
              @click="browseYear--"
              ><BaseIcon name="chevron_left" :size="16" /></UButton
            ><UInput
              :model-value="yearDraft"
              type="number"
              :min="minYear"
              :max="maxYear"
              aria-label="Ano do calendário"
              class="min-w-0 flex-1"
              :ui="{ base: 'finance-control text-center' }"
              @update:model-value="yearDraft = String($event ?? '')"
              @change="commitYear"
              @blur="commitYear"
            /><UButton
              color="neutral"
              variant="ghost"
              aria-label="Próximo ano"
              :disabled="browseYear >= maxYear"
              @click="browseYear++"
              ><BaseIcon name="chevron_right" :size="16"
            /></UButton>
          </div>
          <div class="grid grid-cols-3 gap-1.5" @keydown="navigateMonths">
            <UButton
              v-for="(month, index) in MONTHS"
              :key="month"
              :data-month="index"
              :color="monthValue(index) === modelValue ? 'primary' : 'neutral'"
              :variant="monthValue(index) === modelValue ? 'soft' : 'ghost'"
              size="sm"
              class="min-h-9 justify-center"
              :aria-label="`${month} de ${browseYear}`"
              :aria-pressed="monthValue(index) === modelValue"
              :disabled="!isAllowed(monthValue(index))"
              @click="choose(monthValue(index))"
              >{{ month }}</UButton
            >
          </div>
          <UButton
            block
            color="primary"
            variant="soft"
            size="sm"
            :disabled="!isAllowed(currentMonth)"
            @click="choose(currentMonth)"
            >Este mês</UButton
          >
        </div>
      </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
} from 'vue'
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
const yearDraft = ref(String(now.getFullYear()))
const panel = ref<HTMLElement | null>(null)
const open = ref(false)
const contentProps = computed(() => ({
  'aria-label': props.label ? `Escolher mês — ${props.label}` : 'Escolher mês',
  onOpenAutoFocus: (event: Event) => {
    event.preventDefault()
    nextTick(() => {
      ;(
        panel.value?.querySelector<HTMLButtonElement>(
          '[data-month][aria-pressed="true"]',
        ) ??
        panel.value?.querySelector<HTMLButtonElement>(
          '[data-month]:not(:disabled)',
        )
      )?.focus()
    })
  },
}))
const monthValue = (index: number) =>
  `${browseYear.value}-${String(index + 1).padStart(2, '0')}`
const isAllowed = (value: string) => value >= props.min && value <= props.max
function setOpen(value: boolean) {
  if (value)
    browseYear.value = Math.min(
      maxYear.value,
      Math.max(
        minYear.value,
        Number(props.modelValue.slice(0, 4)) || now.getFullYear(),
      ),
    )
  yearDraft.value = String(browseYear.value)
  open.value = value
}
function setYear(value: string | number | null | undefined) {
  browseYear.value = Math.min(
    maxYear.value,
    Math.max(
      minYear.value,
      Number.parseInt(String(value)) || now.getFullYear(),
    ),
  )
  yearDraft.value = String(browseYear.value)
}
function commitYear() {
  setYear(yearDraft.value)
}
watch(browseYear, (value) => {
  yearDraft.value = String(value)
})
function choose(value: string) {
  if (isAllowed(value)) {
    emit('update:modelValue', value)
    close()
  }
}
function close() {
  open.value = false
  removeBackListeners()
}
function onBack(event: Event) {
  if (open.value && !event.defaultPrevented) {
    event.preventDefault()
    event.stopImmediatePropagation()
    close()
  }
}
function removeBackListeners() {
  if (import.meta.client) {
    window.removeEventListener('finance:back', onBack, true)
    window.removeEventListener('finance:close-popup', onBack, true)
  }
}
watch(open, (value) => {
  removeBackListeners()
  if (value && import.meta.client) {
    window.addEventListener('finance:back', onBack, true)
    window.addEventListener('finance:close-popup', onBack, true)
  }
})
function navigateMonths(event: KeyboardEvent) {
  const index = Number((event.target as HTMLElement).dataset.month)
  if (!Number.isInteger(index)) return
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
    ?.querySelector<HTMLButtonElement>(
      `[data-month="${Math.min(11, Math.max(0, next))}"]:not(:disabled)`,
    )
    ?.focus()
}
onDeactivated(close)
onBeforeUnmount(removeBackListeners)
</script>
