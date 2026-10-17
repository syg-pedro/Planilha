<template>
  <FinanceEntryEditorModal
    :open="true"
    :entry="selectedEntry"
    :accounts="store.accounts"
    :categories="store.categories"
    :busy="busy"
    :error="error"
    @close="emit('close')"
    @save="save"
    @delete="remove"
  >
    <template #context>
      <div class="column-entry-picker">
        <BaseDropdown
          v-model="selectedId"
          :label="`Lançamento de ${title}`"
          :options="entryOptions"
          :disabled="busy"
          hint="As alterações serão aplicadas somente ao lançamento selecionado."
        />
      </div>
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
const entries = computed(() =>
  store.entries
    .filter((entry) => entry.title === props.title && entry.kind === props.kind)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
)
const entryOptions = computed(() =>
  entries.value.map((entry) => ({
    value: entry.id,
    label: `${formatDate(entry.dueDate)} — ${currency.format(entry.amount)}`,
  })),
)
const selectedId = ref(
  entries.value.find((entry) => entry.dueDate.startsWith(props.month))?.id ??
    entries.value[0]?.id ??
    '',
)
const selectedEntry = computed(
  () => entries.value.find((entry) => entry.id === selectedId.value) ?? null,
)
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
.column-entry-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
