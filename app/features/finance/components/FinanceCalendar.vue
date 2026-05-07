<template>
  <BasePanel title="Calendario financeiro">
    <template #header>
      <div class="flex flex-wrap gap-2">
        <BaseButton size="sm" variant="secondary" @click="setView('multiMonthYear')">Anual</BaseButton>
        <BaseButton size="sm" variant="secondary" @click="setView('multiMonthQuarter')">3 meses</BaseButton>
        <BaseButton size="sm" variant="secondary" @click="setView('dayGridMonth')">Mensal</BaseButton>
      </div>
    </template>

    <FullCalendar ref="calendarRef" :options="calendarOptions" />

    <FinanceEntryEditorModal
      :open="editorOpen"
      :entry="selectedEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      @close="closeEditor"
      @save="saveFromEditor"
      @delete="deleteFromEditor"
    />
  </BasePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EventClickArg } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { FinanceEntry } from '#shared/types'

const store = useFinanceStore()
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const editorOpen = ref(false)
const selectedEntry = ref<FinanceEntry | null>(null)

const events = computed(() =>
  store.entries.map((entry) => ({
    id: entry.id,
    title: `${entry.kind === 'income' ? '+' : '-'} ${entry.title} (${entry.amount.toFixed(2)})`,
    date: entry.dueDate,
    color:
      entry.status === 'paid'
        ? 'var(--ds-color-state-neutral)'
        : entry.kind === 'income'
          ? 'var(--ds-color-state-success)'
          : 'var(--ds-color-state-danger)'
  }))
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, multiMonthPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: ptBrLocale,
  height: 'auto',
  events: events.value,
  views: {
    multiMonthYear: { type: 'multiMonth', duration: { months: 12 } },
    multiMonthQuarter: { type: 'multiMonth', duration: { months: 3 } }
  },
  eventClick: onEventClick,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: ''
  }
}))

const setView = (view: 'multiMonthYear' | 'multiMonthQuarter' | 'dayGridMonth') => {
  calendarRef.value?.getApi().changeView(view)
}

const onEventClick = (event: EventClickArg) => {
  const id = event.event.id
  const found = store.entries.find((entry) => entry.id === id)
  if (!found) return
  selectedEntry.value = { ...found }
  editorOpen.value = true
}

const closeEditor = () => {
  editorOpen.value = false
  selectedEntry.value = null
}

const saveFromEditor = async (entry: Partial<FinanceEntry>) => {
  await store.saveEntriesBatch({ upserts: [entry], deletes: [] })
  closeEditor()
}

const deleteFromEditor = async (entryId: string) => {
  await store.saveEntriesBatch({ upserts: [], deletes: [entryId] })
  closeEditor()
}
</script>
