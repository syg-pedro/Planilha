<template>
  <UBadge
    :color="entry.status === 'paid' ? 'success' : 'error'"
    variant="subtle"
    size="md"
    class="finance-entry-status justify-center whitespace-nowrap"
    :data-status="entry.status"
  >{{ label || statusLabel }}</UBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FinanceEntry } from '#shared/types'

const props = defineProps<{
  entry: Pick<FinanceEntry, 'status' | 'kind'>
  label?: string
}>()

const statusLabel = computed(() =>
  props.entry.status === 'paid'
    ? props.entry.kind === 'income' ? 'Recebido' : 'Pago'
    : props.entry.status === 'review' ? 'Em revisão' : 'Pendente'
)
</script>
