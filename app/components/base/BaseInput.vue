<template>
  <UFormField
    :label="label || undefined"
    :help="hint || undefined"
    :error="error || undefined"
    :name="typeof $attrs.name === 'string' ? $attrs.name : undefined"
    :required="isRequired"
    class="base-field w-full"
    :class="$attrs.class"
    :style="$attrs.style as any"
  >
    <UPopover
      v-if="isTemporal"
      :open="open"
      :content="popoverContent"
      :ui="{ content: 'w-max max-w-[calc(100vw-1rem)] max-h-[var(--reka-popover-content-available-height)] overflow-y-auto overscroll-contain p-3' }"
      @update:open="setOpen"
    >
      <template #anchor>
        <UInputDate
          v-if="type === 'date'"
          :id="fieldId"
          ref="control"
          v-bind="controlAttrs"
          :model-value="dateValue"
          :min-value="minDate"
          :max-value="maxDate"
          :disabled="disabled"
          :readonly="readonly"
          :aria-label="accessibleLabel || undefined"
          locale="pt-BR"
          granularity="day"
          class="w-full"
          :ui="{ base: 'finance-control', segment: 'shrink-0 whitespace-nowrap tabular-nums data-[segment=day]:w-[calc(2ch+0.25rem)] data-[segment=month]:w-[calc(2ch+0.25rem)] data-[segment=year]:w-[calc(4ch+0.25rem)]' }"
          @update:model-value="updateDate"
          @keydown.alt.down.capture.prevent.stop="setOpen(true)"
        >
          <template #trailing>
            <UButton ref="pickerButton" color="neutral" variant="link" size="sm" class="px-0" :disabled="disabled || readonly" :aria-label="pickerLabel" aria-haspopup="dialog" :aria-expanded="open" :aria-controls="open ? popupId : undefined" @click="setOpen(!open)">
              <BaseIcon name="calendar" :size="16" />
            </UButton>
          </template>
        </UInputDate>
        <UInputTime
          v-else
          :id="fieldId"
          ref="control"
          v-bind="controlAttrs"
          :model-value="timeValue"
          :disabled="disabled"
          :readonly="readonly"
          :aria-label="accessibleLabel || undefined"
          :hour-cycle="24"
          locale="pt-BR"
          granularity="minute"
          class="w-full"
          :ui="{ base: 'finance-control', segment: 'shrink-0 whitespace-nowrap tabular-nums not-data-[segment=literal]:w-[calc(2ch+0.25rem)]' }"
          @update:model-value="updateTime"
          @keydown.alt.down.capture.prevent.stop="setOpen(true)"
        >
          <template #trailing>
            <UButton ref="pickerButton" color="neutral" variant="link" size="sm" class="px-0" :disabled="disabled || readonly" :aria-label="pickerLabel" aria-haspopup="dialog" :aria-expanded="open" :aria-controls="open ? popupId : undefined" @click="setOpen(!open)">
              <BaseIcon name="clock" :size="16" />
            </UButton>
          </template>
        </UInputTime>
      </template>
      <template #content>
        <div ref="panel">
          <template v-if="type === 'date'">
            <UCalendar :model-value="dateValue" :placeholder="dateValue || currentDate()" :min-value="minDate" :max-value="maxDate" :week-starts-on="0" locale="pt-BR" @update:model-value="chooseDate" />
            <div class="mt-3 flex justify-between gap-3 border-t border-default pt-3">
              <UButton color="neutral" variant="ghost" size="sm" :disabled="!dateValue" @click="clearDate">Limpar</UButton>
              <UButton variant="soft" size="sm" :disabled="!isDateAllowed(currentDate())" @click="chooseDate(currentDate())">Hoje</UButton>
            </div>
          </template>
          <div v-else class="w-56 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <BaseDropdown :model-value="selectedHour" label="Horas" :options="hours" @update:model-value="chooseTime('hour', $event)" />
              <BaseDropdown :model-value="selectedMinute" label="Minutos" :options="minutes" @update:model-value="chooseTime('minute', $event)" />
            </div>
            <UButton block size="sm" @click="close">Concluir</UButton>
          </div>
        </div>
      </template>
    </UPopover>
    <UInput
      v-else
      :id="fieldId"
      ref="control"
      v-bind="controlAttrs"
      :model-value="String(modelValue ?? '')"
      :model-modifiers="modelModifiers"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      class="w-full"
      :ui="{ base: 'finance-control' }"
      @update:model-value="updateValue"
    />
  </UFormField>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref, useAttrs, useId, watch } from 'vue'
import { CalendarDate, Time, getLocalTimeZone, parseDate, parseTime, today, type DateValue } from '@internationalized/date'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    modelModifiers?: { number?: boolean; trim?: boolean }
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    type?: string
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    label: '',
    hint: '',
    error: '',
    placeholder: '',
    type: 'text',
    disabled: false,
    readonly: false,
    id: undefined,
    modelModifiers: () => ({}),
  },
)
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const attrs = useAttrs()
const accessibleLabel = computed(() => props.label || (typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : ''))
const generatedId = useId()
const fieldId = computed(() => props.id || `field-${generatedId}`)
const popupId = computed(() => `${fieldId.value}-picker`)
const isTemporal = computed(() => props.type === 'date' || props.type === 'time')
const controlAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => !['class', 'style', ...(isTemporal.value ? ['min', 'max', 'step'] : [])].includes(key))))
const control = ref<{ inputRef?: HTMLInputElement | null; inputsRef?: { $el: HTMLElement }[] } | null>(null)
const pickerButton = ref<{ $el: HTMLButtonElement } | null>(null)
const panel = ref<HTMLElement | null>(null)
const input = computed(() => control.value?.inputRef ?? control.value?.inputsRef?.[0]?.$el ?? null)
const open = ref(false)
const pickerLabel = computed(() => `${props.type === 'date' ? 'Escolher data' : 'Escolher horário'}${accessibleLabel.value ? `: ${accessibleLabel.value}` : ''}`)
const popoverContent = computed(() => ({
  id: popupId.value,
  'aria-label': pickerLabel.value,
  align: 'end' as const,
  sideOffset: 4,
  collisionPadding: 8,
  onCloseAutoFocus: (event: Event) => {
    event.preventDefault()
    if (pickerButton.value?.$el?.isConnected) pickerButton.value.$el.focus({ preventScroll: true })
  },
}))
function parseCalendar(value: unknown) {
  try { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDate(value) : undefined }
  catch { return undefined }
}
const dateValue = computed(() => parseCalendar(props.modelValue))
const minDate = computed(() => parseCalendar(attrs.min))
const maxDate = computed(() => parseCalendar(attrs.max))
const timeValue = computed(() => {
  try { return typeof props.modelValue === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(props.modelValue) ? parseTime(props.modelValue) : undefined }
  catch { return undefined }
})
const currentDate = () => today(getLocalTimeZone())
const pad = (value: number) => String(value).padStart(2, '0')
const hours = Array.from({ length: 24 }, (_, value) => ({ value: pad(value), label: pad(value) }))
const minutes = Array.from({ length: 60 }, (_, value) => ({ value: pad(value), label: pad(value) }))
const selectedHour = computed(() => pad(timeValue.value?.hour ?? 0))
const selectedMinute = computed(() => pad(timeValue.value?.minute ?? 0))
function isDateAllowed(value: DateValue) {
  return (!minDate.value || value.compare(minDate.value) >= 0) && (!maxDate.value || value.compare(maxDate.value) <= 0)
}
function calendarValue(value: unknown) {
  if (value && typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value && typeof value.year === 'number' && typeof value.month === 'number' && typeof value.day === 'number') return new CalendarDate(value.year, value.month, value.day)
}
function updateDate(value: unknown) {
  if (props.disabled || props.readonly) return
  const date = calendarValue(value)
  if (date || value == null) emit('update:modelValue', date?.toString() ?? '')
}
function chooseDate(value: unknown) {
  const date = calendarValue(value)
  if (!date || !isDateAllowed(date)) return
  updateDate(date)
  close()
}
function clearDate() {
  updateDate(undefined)
  close()
}
function updateTime(value: unknown) {
  if (props.disabled || props.readonly) return
  if (value == null) emit('update:modelValue', '')
  else if (typeof value === 'object' && 'hour' in value && 'minute' in value && typeof value.hour === 'number' && typeof value.minute === 'number') emit('update:modelValue', `${pad(value.hour)}:${pad(value.minute)}`)
}
function chooseTime(part: 'hour' | 'minute', value: string) {
  const hour = part === 'hour' ? Number(value) : Number(selectedHour.value)
  const minute = part === 'minute' ? Number(value) : Number(selectedMinute.value)
  updateTime(new Time(hour, minute))
}
function setOpen(value: boolean) {
  open.value = value && !props.disabled && !props.readonly
}
function close() {
  open.value = false
  removeBackListeners()
}
function onBack(event: Event) {
  if (!open.value || event.defaultPrevented) return
  // A time dropdown closes first; the popover and parent modal stay open.
  if (panel.value?.querySelector('[role="combobox"][aria-expanded="true"]')) return
  event.preventDefault()
  event.stopImmediatePropagation()
  close()
}
function removeBackListeners() {
  if (!import.meta.client) return
  window.removeEventListener('finance:back', onBack, true)
  window.removeEventListener('finance:close-popup', onBack, true)
}
watch(open, (value) => {
  removeBackListeners()
  if (value && import.meta.client) {
    window.addEventListener('finance:back', onBack, true)
    window.addEventListener('finance:close-popup', onBack, true)
  }
})
watch(() => props.disabled || props.readonly, value => { if (value) close() })
onDeactivated(close)
onBeforeUnmount(removeBackListeners)
const isRequired = computed(
  () => attrs.required !== undefined && attrs.required !== false,
)
function updateValue(value: string | number | null | undefined) {
  emit('update:modelValue', value ?? '')
}
defineExpose({ focus: () => input.value?.focus(), input })
</script>
