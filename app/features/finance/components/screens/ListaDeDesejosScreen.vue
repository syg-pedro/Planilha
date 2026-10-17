<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-3"><BaseKpiCard icon="wishlist" label="Quero comprar" :value="String(kpis.wantCount)" color="var(--primary)" :sub="`${kpis.wantCount} item(s)`" /><BaseKpiCard icon="balance" label="Valor total" :value="fmt(kpis.totalValue)" color="var(--warning)" sub="Quero + Guardando" /><BaseKpiCard icon="check" label="Comprados" :value="String(kpis.boughtCount)" color="var(--success)" sub="Já adquiridos" /></div>
    <div class="flex flex-wrap items-end justify-between gap-3"><div class="flex flex-wrap gap-2"><BaseInput v-model="search" label="Buscar item" placeholder="Nome ou categoria" /><BaseDropdown v-model="filterStatus" label="Status"><option value="">Todos</option><option value="want">Quero</option><option value="saving">Guardando</option><option value="bought">Comprado</option></BaseDropdown><BaseDropdown v-model="filterPriority" label="Prioridade"><option value="">Todas</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></BaseDropdown></div><BaseButton @click="openEditor(null)"><BaseIcon name="plus" :size="16" /> Adicionar item</BaseButton></div>
    <UAlert v-if="loadError" color="error" variant="subtle" :description="loadError"><template #actions><BaseButton variant="ghost" @click="fetchItems">Tentar novamente</BaseButton></template></UAlert>
    <div v-if="loading" class="grid gap-3 md:grid-cols-3"><USkeleton v-for="n in 3" :key="n" class="h-56 w-full" /></div>
    <BaseEmptyState v-else-if="visibleItems.length === 0" icon="wishlist" title="Nenhum item na lista" body="Adicione itens que deseja comprar para acompanhar seus desejos e metas."><BaseButton @click="openEditor(null)">Adicionar item</BaseButton></BaseEmptyState>
    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><UCard v-for="item in visibleItems" :key="item.id" :title="item.name" :description="item.category || undefined"><template #header><div class="flex items-start gap-3"><div class="min-w-0 flex-1"><h3 class="text-sm font-semibold text-highlighted">{{ item.name }}</h3><p v-if="item.category" class="mt-1 text-xs text-muted">{{ item.category }}</p></div><UButton v-if="item.url" :to="item.url" target="_blank" rel="noopener noreferrer" :icon="appConfig.ui.icons.external" color="neutral" variant="ghost" :aria-label="`Abrir link de ${item.name}`" /><BaseButton variant="ghost" :aria-label="`Editar ${item.name}`" @click="openEditor(item)"><BaseIcon name="edit" :size="16" /></BaseButton></div></template><img v-if="item.imageUrl && !brokenImages.has(item.id)" :src="item.imageUrl" :alt="item.name" class="mb-4 aspect-video w-full rounded object-cover" @error="brokenImages.add(item.id)" /><p class="text-xl font-semibold tabular-nums" :class="item.price != null ? 'text-highlighted' : 'text-muted'">{{ item.price != null ? fmt(item.price) : 'Sem preço' }}</p><div class="mt-3 flex flex-wrap gap-2"><UBadge :color="item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'success'" variant="subtle">{{ priorityLabel(item.priority) }}</UBadge><UBadge :color="item.status === 'want' ? 'primary' : item.status === 'saving' ? 'warning' : 'success'" variant="subtle">{{ statusLabel(item.status) }}</UBadge></div><p v-if="item.notes" class="mt-3 whitespace-pre-wrap text-sm text-muted">{{ item.notes }}</p></UCard></div>
    <BaseModal :open="editorOpen" :busy="saving" :title="editingItem ? 'Editar item' : 'Novo item'" @close="closeEditor"><div ref="wishForm" class="space-y-4"><BaseInput v-model="draft.name" label="Nome do item" :error="fieldErrors.name" required placeholder="Ex.: Celular, tênis..." /><div class="grid gap-3 sm:grid-cols-2"><BaseInput v-model="draft.price" label="Preço (R$)" :error="fieldErrors.price" type="number" inputmode="decimal" step="0.01" min="0" /><BaseInput v-model="draft.category" label="Categoria" /><BaseDropdown v-model="draft.priority" label="Prioridade"><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></BaseDropdown><BaseDropdown v-model="draft.status" label="Status"><option value="want">Quero</option><option value="saving">Guardando</option><option value="bought">Comprado</option></BaseDropdown></div><UAccordion v-model="wishDetails" :items="wishDetailsItems" :unmount-on-hide="false"><template #links-body><div class="space-y-3"><BaseInput v-model="draft.url" label="Link do produto (opcional)" :error="fieldErrors.url" type="url" placeholder="https://..." /><BaseInput v-model="draft.imageUrl" label="URL da imagem (opcional)" :error="fieldErrors.imageUrl" type="url" placeholder="https://..." /><BaseTextarea v-model="draft.notes" label="Observações (opcional)" :rows="3" /></div></template></UAccordion><UAlert v-if="errorMsg" color="error" variant="subtle" :description="errorMsg" /><UAlert v-if="confirmingDelete" color="warning" variant="subtle" description="Excluir este item definitivamente?" /></div><template #footer><div class="flex w-full flex-wrap justify-end gap-2"><BaseButton v-if="editingItem && !confirmingDelete" variant="danger" :disabled="saving" class="mr-auto" @click="confirmingDelete = true">Excluir</BaseButton><template v-if="confirmingDelete"><BaseButton variant="ghost" :disabled="saving" @click="confirmingDelete = false">Voltar</BaseButton><BaseButton variant="danger" :loading="saving" @click="deleteItem">Confirmar exclusão</BaseButton></template><template v-else><BaseButton variant="ghost" :disabled="saving" @click="closeEditor">Cancelar</BaseButton><BaseButton :loading="saving" :disabled="!draft.name.trim()" @click="saveItem">{{ editingItem ? 'Salvar' : 'Criar' }}</BaseButton></template></div></template></BaseModal>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { sumMoney } from '#shared/matrix'
import { makeId } from '#shared/id'
import type { WishItem, WishPriority, WishStatus } from '#shared/types'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const appConfig = useAppConfig()
const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

// ─── State ────────────────────────────────────────────────────────────────────

const items = computed(() => store.wishItems)
const loading      = ref(false)
const loadError = ref('')
const brokenImages = reactive(new Set<string>())

const search         = ref('')
const filterStatus   = ref('')
const filterPriority = ref('')

// ─── Fetch ────────────────────────────────────────────────────────────────────

const fetchItems = async () => {
  loading.value = true
  loadError.value = ''
  try {
    await store.loadWishItems()
  } catch { loadError.value = 'Não foi possível carregar a lista de desejos. Tente novamente.' } finally {
    loading.value = false
  }
}

onMounted(fetchItems)

// ─── Computed ─────────────────────────────────────────────────────────────────

const visibleItems = computed(() => {
  let list = items.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i => i.name.toLowerCase().includes(q) || (i.category ?? '').toLowerCase().includes(q))
  }
  if (filterStatus.value) {
    list = list.filter(i => i.status === filterStatus.value)
  }
  if (filterPriority.value) {
    list = list.filter(i => i.priority === filterPriority.value)
  }
  return list
})

const kpis = computed(() => {
  const wantCount  = items.value.filter(i => i.status === 'want').length
  const boughtCount = items.value.filter(i => i.status === 'bought').length
  const totalValue = sumMoney(items.value.filter(item => item.status !== 'bought').map(item => item.price ?? 0))
  return { wantCount, boughtCount, totalValue }
})

// ─── Badges ───────────────────────────────────────────────────────────────────

const priorityLabel = (p: WishPriority) =>
  p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'


const statusLabel = (s: WishStatus) =>
  s === 'want' ? 'Quero' : s === 'saving' ? 'Guardando' : 'Comprado'


// ─── Editor ───────────────────────────────────────────────────────────────────

const wishDetails = ref<string | undefined>()
const wishDetailsItems = [{ label: 'Links e observações', value: 'links', slot: 'links' as const }]
const editorOpen  = ref(false)
const editingItem = ref<WishItem | null>(null)
const saving      = ref(false)
const errorMsg    = ref('')
const fieldErrors = ref<Record<string, string>>({})
const confirmingDelete = ref(false)
const wishForm = ref<HTMLElement | null>(null)

const draft = reactive({
  name:     '',
  price:    '' as string | number,
  url:      '',
  imageUrl: '',
  category: '',
  priority: 'medium' as WishPriority,
  status:   'want' as WishStatus,
  notes:    '',
})

const openEditor = (item: WishItem | null) => {
  editingItem.value = item
  wishDetails.value = item?.url || item?.imageUrl || item?.notes ? 'links' : undefined
  errorMsg.value    = ''
  fieldErrors.value = {}
  confirmingDelete.value = false
  draft.name     = item?.name     ?? ''
  draft.price    = item?.price    != null ? item.price : ''
  draft.url      = item?.url      ?? ''
  draft.imageUrl = item?.imageUrl ?? ''
  draft.category = item?.category ?? ''
  draft.priority = item?.priority ?? 'medium'
  draft.status   = item?.status   ?? 'want'
  draft.notes    = item?.notes    ?? ''
  editorOpen.value = true
}

const closeEditor = () => {
  editorOpen.value  = false
  editingItem.value = null
  errorMsg.value    = ''
}

const saveItem = async () => {
  const errors: Record<string, string> = {}
  if (!draft.name.trim()) errors.name = 'Informe o nome do item.'
  if (draft.price !== '' && (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0)) errors.price = 'Informe um preço válido, igual ou maior que zero.'
  for (const key of ['url', 'imageUrl'] as const) {
    if (!draft[key].trim()) continue
    try { if (!['http:', 'https:'].includes(new URL(draft[key]).protocol)) errors[key] = 'Use um link http:// ou https://.' }
    catch { errors[key] = 'Informe um link válido.' }
  }
  fieldErrors.value = errors
  if (Object.keys(errors).length) {
    if (errors.url || errors.imageUrl) wishDetails.value = 'links'
    await nextTick()
    wishForm.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  saving.value   = true
  errorMsg.value = ''
  try {
    const upsert: Partial<WishItem> = {
      id:       editingItem.value?.id ?? makeId('wish'),
      name:     draft.name.trim(),
      price:    draft.price !== '' ? Number(draft.price) : null,
      url:      draft.url.trim() || null,
      imageUrl: draft.imageUrl.trim() || null,
      category: draft.category.trim() || null,
      priority: draft.priority,
      status:   draft.status,
      notes:    draft.notes.trim() || null,
    }
    await store.saveWishItemsBatch({ upserts: [upsert], deletes: [] })
    closeEditor()
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Erro ao salvar item'
  } finally {
    saving.value = false
  }
}

const deleteItem = async () => {
  if (!editingItem.value) return
  saving.value   = true
  errorMsg.value = ''
  try {
    await store.saveWishItemsBatch({ upserts: [], deletes: [editingItem.value.id] })
    closeEditor()
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Erro ao excluir item'
  } finally {
    saving.value = false
  }
}
</script>
