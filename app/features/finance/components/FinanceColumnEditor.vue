<template>
  <FinanceEntryEditorModal
    :open="true"
    :entry="selectedEntry"
    :accounts="store.accounts"
    :categories="store.categories"
    @close="emit('close')"
    @save="save"
    @delete="remove"
  >
    <template #context>
      <label class="column-entry-picker">
        Lançamento de {{ title }}
        <select v-model="selectedId" :disabled="busy">
          <option v-for="entry in entries" :key="entry.id" :value="entry.id">
            {{ formatDate(entry.dueDate) }} — {{ currency.format(entry.amount) }}
          </option>
        </select>
      </label>
      <p>As alterações serão aplicadas somente ao lançamento selecionado.</p>
      <p v-if="error" role="alert">{{ error }}</p>
    </template>
  </FinanceEntryEditorModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EntryKind, FinanceEntry } from '#shared/types'
import FinanceEntryEditorModal from './FinanceEntryEditorModal.vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const props = defineProps<{ title: string; kind: EntryKind; month: string }>()
const emit = defineEmits<{ close: [] }>()
const store = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()
const entries = computed(() => store.entries
  .filter(entry => entry.title === props.title && entry.kind === props.kind)
  .sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
const selectedId = ref(entries.value.find(entry => entry.dueDate.startsWith(props.month))?.id ?? entries.value[0]?.id ?? '')
const selectedEntry = computed(() => entries.value.find(entry => entry.id === selectedId.value) ?? null)
const busy = ref(false)
const error = ref('')

async function persist(upserts: Partial<FinanceEntry>[], deletes: string[]) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await store.saveEntriesBatch({ upserts, deletes })
    emit('close')
  } catch {
    error.value = 'Não foi possível salvar. Tente novamente.'
  } finally {
    busy.value = false
  }
}
const save = (entries: Partial<FinanceEntry>[]) => persist(entries, [])
const remove = (id: string) => persist([], [id])
</script>

<style scoped>
.column-entry-picker { display: flex; flex-direction: column; gap: 8px; font-weight: 700; }
.column-entry-picker select { padding: 12px; border: 1px solid var(--ds-color-border-default); border-radius: 8px; background: var(--ds-color-surface-card); color: inherit; font: inherit; }
</style>
