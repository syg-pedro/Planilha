<template>
  <div class="planilha-toolbar">
    <div class="planilha-toolbar__period">
      <BaseButton
        variant="ghost"
        aria-label="Mês anterior"
        @click="query.month = shiftFinanceMonth(query.month, -1)"
        >‹</BaseButton
      >
      <BaseMonthPicker v-model="query.month" @update:model-value="$emit('focusMonth', $event)" />
      <BaseButton
        variant="ghost"
        aria-label="Próximo mês"
        @click="query.month = shiftFinanceMonth(query.month, 1)"
        >›</BaseButton
      >
      <BaseButton
        variant="ghost"
        class="planilha-toolbar__today"
        @click="goToday"
        >Hoje</BaseButton
      >
    </div>
    <BaseButton
      variant="primary"
      class="planilha-toolbar__new"
      :aria-label="`Novo lançamento em ${monthLabel}`"
      @click="$emit('create')"
      ><span aria-hidden="true">＋</span><span class="planilha-toolbar__new-full">Novo lançamento</span
      ><span class="planilha-toolbar__new-short">Novo</span></BaseButton
    >
    <div class="planilha-toolbar__break" />
    <UTabs v-if="!compact" :model-value="query.presentation" :items="[{ label: 'Planilha', value: 'matrix' }, { label: 'Lista', value: 'list' }]" :content="false" class="planilha-toolbar__views" aria-label="Apresentação da planilha" @update:model-value="query.presentation = $event as FinanceQuery['presentation']" />
    <div v-if="!compact || searchOpen || query.search" class="planilha-toolbar__search">
      <BaseInput
        v-model="query.search"
        type="search"
        aria-label="Buscar na planilha"
        placeholder="Buscar descrição ou conta…"
      />
    </div>
    <div class="planilha-toolbar__range">
      <BaseDropdown v-model="query.range" :options="rangeOptions" aria-label="Período visível" />
    </div>
    <BaseButton
      variant="ghost"
      :aria-expanded="filtersOpen"
      aria-controls="planilha-filters"
      @click="filtersOpen = !filtersOpen"
      >Filtros<UBadge v-if="filterCount" color="primary" variant="subtle" size="xs">{{ filterCount }}</UBadge></BaseButton
    >
    <BaseButton
      variant="ghost"
      class="planilha-toolbar__search-toggle"
      aria-label="Abrir busca"
      :aria-expanded="searchOpen"
      @click="searchOpen = !searchOpen"
      ><BaseIcon name="search" :size="17"
    /></BaseButton>
    <template v-if="!compact && query.presentation === 'matrix'">
      <BaseButton
        variant="ghost"
        class="planilha-toolbar__advanced"
        :aria-pressed="expanded"
        @click="$emit('expand')"
        >{{ expanded ? 'Reduzir' : 'Ampliar' }}</BaseButton
      >
    </template>
    <UCollapsible :open="filtersOpen" class="planilha-toolbar__filters">
      <template #content>
      <UCard id="planilha-filters" :ui="{ body: 'planilha-toolbar__filter-grid' }">
        <BaseDropdown v-model="query.dateMode" label="Organizar pela data" :options="dateOptions" wrap />
        <BaseDropdown v-model="query.kind" label="Tipo" :options="kindOptions" wrap />
        <BaseDropdown v-model="query.status" label="Status" :options="statusOptions" wrap />
        <BaseDropdown v-model="query.accountId" label="Conta" :options="accountOptions" wrap />
        <BaseButton variant="ghost" @click="$emit('clear')">Limpar filtros</BaseButton>
      </UCard>
      </template>
    </UCollapsible>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Account } from '#shared/types'
import { shiftFinanceMonth, type FinanceQuery } from '#shared/financeQuery'
const query = defineModel<FinanceQuery>({ required: true })
const props = defineProps<{
  accounts: Account[]
  todayMonth: string
  focusMonth: string
  compact: boolean
  expanded: boolean
}>()
const emit = defineEmits<{
  create: []
  expand: []
  clear: []
  focusMonth: [month: string]
}>()
function goToday() {
  query.value.month = props.todayMonth
  emit('focusMonth', props.todayMonth)
}
const filtersOpen = ref(false),
  searchOpen = ref(false)
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${props.focusMonth}-01T12:00:00Z`)
  )
)
const rangeOptions = computed(() =>
  props.compact
    ? [
        { value: 'month', label: 'Mensal' },
        { value: 'quarter', label: '3 meses' },
        { value: 'year', label: 'Anual' }
      ]
    : [
        { value: 'month', label: 'Um mês' },
        { value: 'quarter', label: 'Comparar 3 meses' },
        { value: 'year', label: 'Visão anual' }
      ]
)
const dateOptions = [
  { value: 'due_date', label: 'Vencimento / recebimento' },
  { value: 'competence', label: 'Competência' }
]
const kindOptions = [
  { value: 'all', label: 'Receitas e despesas' },
  { value: 'expense', label: 'Despesas' },
  { value: 'income', label: 'Receitas' }
]
const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'paid', label: 'Pagos / recebidos' },
  { value: 'review', label: 'Em revisão' }
]
const accountOptions = computed(() => [
  { value: '', label: 'Todas as contas' },
  { value: 'none', label: 'Sem conta' },
  ...props.accounts.map((account) => ({ value: account.id, label: account.name }))
])
const filterCount = computed(
  () =>
    Number(query.value.dateMode !== 'due_date') +
    Number(query.value.kind !== 'all') +
    Number(query.value.status !== 'all') +
    Number(Boolean(query.value.accountId))
)
</script>

<style scoped>
.planilha-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}
.planilha-toolbar__period {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}
.planilha-toolbar__period :deep(.base-button) {
  padding-inline: 10px;
}
.planilha-toolbar__new {
  margin-left: auto;
}
.planilha-toolbar__new-short,
.planilha-toolbar__search-toggle {
  display: none;
}
.planilha-toolbar__break {
  flex-basis: 100%;
  height: 0;
}
.planilha-toolbar__views { flex-shrink: 0; }
.planilha-toolbar__search {
  flex: 1;
  min-width: 180px;
}
.planilha-toolbar__range {
  min-width: 150px;
}
.planilha-toolbar__range :deep(.bd-trigger) {
  width: 100%;
}
.planilha-toolbar__count {
  margin-left: 5px;
  color: var(--primary);
}
.planilha-toolbar__filters { width: 100%; min-width: 0; }
.planilha-toolbar__filters :deep(.planilha-toolbar__filter-grid) { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; gap: var(--ds-space-4); }
@media (min-width: 768px) and (max-width: 1023px) {
  .planilha-toolbar__filters :deep(.planilha-toolbar__filter-grid) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .planilha-toolbar {
    gap: 8px;
  }
  .planilha-toolbar__period {
    flex: 1;
    min-width: 0;
  }
  .planilha-toolbar__period :deep(.base-month-picker) {
    flex: 1;
    min-width: 0;
  }
  .planilha-toolbar__today {
    display: none;
  }
  .planilha-toolbar__new {
    font-size: 12px;
    padding-inline: 10px;
  }
  .planilha-toolbar__new-full {
    display: none;
  }
  .planilha-toolbar__new-short {
    display: inline;
  }
  .planilha-toolbar__search-toggle {
    display: flex;
    min-width: 36px;
    padding: 8px;
  }
  .planilha-toolbar__advanced {
    display: none;
  }
  .planilha-toolbar__search {
    order: 3;
    flex-basis: 100%;
  }
  .planilha-toolbar__range {
    flex: 1;
    min-width: 80px;
  }
  .planilha-toolbar__filters {
    order: 4;
  }
  .planilha-toolbar__filters :deep(.planilha-toolbar__filter-grid) { grid-template-columns: minmax(0, 1fr); }
}
</style>
