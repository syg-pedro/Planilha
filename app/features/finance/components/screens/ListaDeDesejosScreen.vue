<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- KPIs -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard
        icon="wishlist"
        label="Quero comprar"
        :value="String(kpis.wantCount)"
        color="var(--primary)"
        :sub="`${kpis.wantCount} item(s)`"
      />
      <BaseKpiCard
        icon="balance"
        label="Valor total"
        :value="fmt(kpis.totalValue)"
        color="var(--warning)"
        sub="Quero + Guardando"
      />
      <BaseKpiCard
        icon="check"
        label="Comprados"
        :value="String(kpis.boughtCount)"
        color="var(--success)"
        sub="Já adquiridos"
      />
    </div>

    <!-- Toolbar -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px">
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
        <input
          v-model="search"
          placeholder="Buscar item..."
          style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 34px; font-size: 12px; color: var(--text); font-family: inherit; outline: none; min-width: 180px"
        />
        <select
          v-model="filterStatus"
          style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 34px; font-size: 12px; color: var(--text); font-family: inherit; outline: none; cursor: pointer"
        >
          <option value="">Todos</option>
          <option value="want">Quero</option>
          <option value="saving">Guardando</option>
          <option value="bought">Comprado</option>
        </select>
        <select
          v-model="filterPriority"
          style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 34px; font-size: 12px; color: var(--text); font-family: inherit; outline: none; cursor: pointer"
        >
          <option value="">Todas prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </div>
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff"
        @click="openEditor(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" /> Adicionar item
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display: flex; flex-direction: column; gap: 12px">
      <div v-for="n in 3" :key="n" class="skeleton-card" />
    </div>

    <!-- Empty state -->
    <BaseEmptyState
      v-else-if="visibleItems.length === 0"
      icon="wishlist"
      title="Nenhum item na lista"
      body="Adicione itens que você deseja comprar para acompanhar seus desejos e metas."
    >
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff; margin-top: 12px"
        @click="openEditor(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" /> Adicionar
      </button>
    </BaseEmptyState>

    <!-- Grid de cards -->
    <div v-else class="wish-grid">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="wish-card"
      >
        <!-- Imagem -->
        <div class="wish-img-wrap">
          <img
            v-if="item.imageUrl && !brokenImages.has(item.id)"
            :src="item.imageUrl"
            :alt="item.name"
            class="wish-img"
            @error="brokenImages.add(item.id)"
          />
          <div v-else class="wish-img-placeholder">
            <BaseIcon name="wishlist" :size="32" color="var(--text3)" />
          </div>
        </div>

        <!-- Conteúdo -->
        <div class="wish-content">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px">
            <p class="wish-name">{{ item.name }}</p>
            <div style="display: flex; gap: 4px; flex-shrink: 0">
              <!-- Link externo -->
              <a
                v-if="item.url"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="wish-icon-btn"
                title="Abrir link"
              >
                <BaseIcon name="arrow_up_right" :size="13" />
              </a>
              <!-- Editar -->
              <button class="wish-icon-btn" title="Editar" @click="openEditor(item)">
                <BaseIcon name="edit" :size="13" />
              </button>
            </div>
          </div>

          <p v-if="item.category" class="wish-category">{{ item.category }}</p>

          <p v-if="item.price != null" class="wish-price">{{ fmt(item.price) }}</p>
          <p v-else class="wish-price" style="color: var(--text3)">Sem preço</p>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px">
            <!-- Priority badge -->
            <span :class="['wish-badge', priorityBadgeClass(item.priority)]">
              {{ priorityLabel(item.priority) }}
            </span>
            <!-- Status badge -->
            <span :class="['wish-badge', statusBadgeClass(item.status)]">
              {{ statusLabel(item.status) }}
            </span>
          </div>

          <p v-if="item.notes" class="wish-notes">{{ item.notes }}</p>
        </div>
      </div>
    </div>

    <!-- Editor bottom-sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="editorOpen" class="sheet-overlay" @click.self="closeEditor">
          <div class="sheet-container">
            <div class="sheet-handle-area" @click="closeEditor">
              <div class="sheet-handle" />
            </div>

            <div class="sheet-header">
              <div>
                <h2 class="sheet-title">{{ editingItem ? 'Editar item' : 'Novo item' }}</h2>
                <p class="sheet-subtitle">{{ draft.name || 'Preencha os dados abaixo' }}</p>
              </div>
              <button class="sheet-close" @click="closeEditor">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div class="sheet-body">

              <!-- Nome -->
              <div class="field-group">
                <label class="field-label">Nome do item</label>
                <input v-model="draft.name" type="text" class="field-input" placeholder="Ex.: iPhone 15, Tênis Nike..." />
              </div>

              <!-- Preço + Categoria -->
              <div class="field-row">
                <div class="field-group">
                  <label class="field-label">Preço (R$)</label>
                  <div class="amount-wrapper">
                    <span class="amount-prefix">R$</span>
                    <input
                      v-model="draft.price"
                      type="number"
                      inputmode="decimal"
                      class="field-input amount-input"
                      placeholder="0,00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div class="field-group">
                  <label class="field-label">Categoria</label>
                  <input v-model="draft.category" type="text" class="field-input" placeholder="Ex.: Eletrônicos..." />
                </div>
              </div>

              <!-- Prioridade + Status -->
              <div class="field-row">
                <div class="field-group">
                  <label class="field-label">Prioridade</label>
                  <select v-model="draft.priority" class="field-select">
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Status</label>
                  <select v-model="draft.status" class="field-select">
                    <option value="want">Quero</option>
                    <option value="saving">Guardando</option>
                    <option value="bought">Comprado</option>
                  </select>
                </div>
              </div>

              <!-- URL -->
              <div class="field-group">
                <label class="field-label">Link do produto (opcional)</label>
                <input v-model="draft.url" type="url" class="field-input" placeholder="https://..." />
              </div>

              <!-- Image URL -->
              <div class="field-group">
                <label class="field-label">URL da imagem (opcional)</label>
                <input v-model="draft.imageUrl" type="url" class="field-input" placeholder="https://..." />
              </div>

              <!-- Observações -->
              <div class="field-group">
                <label class="field-label">Observações (opcional)</label>
                <textarea v-model="draft.notes" class="field-input" rows="3" placeholder="Anotações sobre o item..." style="height: auto; padding: 10px 14px; resize: none" />
              </div>

              <!-- Erro -->
              <div
                v-if="errorMsg"
                style="padding: 10px 14px; border-radius: 8px; background: color-mix(in srgb, var(--danger) 12%, transparent); border: 1px solid var(--danger); font-size: 13px; color: var(--danger); font-weight: 600"
              >{{ errorMsg }}</div>

            </div>

            <div class="sheet-footer">
              <div style="flex: 1">
                <button
                  v-if="editingItem"
                  class="btn-danger"
                  :disabled="saving"
                  @click="deleteItem"
                >
                  {{ saving ? '...' : 'Excluir' }}
                </button>
              </div>
              <div class="btn-group">
                <button type="button" class="btn-cancel" @click="closeEditor">Cancelar</button>
                <button
                  type="button"
                  class="btn-save"
                  :disabled="!draft.name.trim() || saving"
                  :style="{ opacity: !draft.name.trim() || saving ? 0.5 : 1 }"
                  @click="saveItem"
                >
                  <svg v-if="saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  {{ saving ? 'Salvando...' : (editingItem ? 'Salvar' : 'Criar') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

.skeleton-card {
  height: 120px;
  border-radius: var(--radius);
  background: var(--surface2);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }

.wish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.wish-card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s;
}
.wish-card:hover {
  box-shadow: var(--shadow-sm);
}

.wish-img-wrap {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: var(--surface2);
  flex-shrink: 0;
}
.wish-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.wish-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wish-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.wish-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  word-break: break-word;
}

.wish-category {
  font-size: 11px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.wish-price {
  font-size: 15px;
  font-weight: 800;
  color: var(--primary);
  margin-top: 2px;
}

.wish-notes {
  font-size: 12px;
  color: var(--text3);
  margin-top: 4px;
  line-height: 1.4;
  word-break: break-word;
}

.wish-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
}
.badge-danger {
  background: color-mix(in srgb, var(--danger) 14%, transparent);
  color: var(--danger);
}
.badge-warning {
  background: color-mix(in srgb, var(--warning) 14%, transparent);
  color: var(--warning);
}
.badge-success {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
}
.badge-primary {
  background: var(--primary-dim);
  color: var(--primary);
}

.wish-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text3);
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
}
.wish-icon-btn:hover {
  background: var(--primary-dim);
  color: var(--primary);
}

/* Sheet */
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: oklch(0% 0 0 / 0.55);
  backdrop-filter: blur(4px);
}
.sheet-container {
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  border: 1px solid var(--border);
  border-bottom: none;
  box-shadow: 0 -8px 40px oklch(0% 0 0 / 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.sheet-handle-area {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
  cursor: pointer;
}
.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 99px;
  background: var(--border);
}
.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 20px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.sheet-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.2;
}
.sheet-subtitle {
  font-size: 13px;
  color: var(--text3);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}
.sheet-close {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text2);
  flex-shrink: 0;
  touch-action: manipulation;
  transition: background 0.12s;
}
.sheet-close:hover { filter: brightness(0.9); }
.sheet-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.field-input {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  -webkit-appearance: none;
}
.field-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.field-input::placeholder { color: var(--text3); }
.field-select {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  font-family: inherit;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-appearance: none;
}
.field-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.amount-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.amount-prefix {
  position: absolute;
  left: 14px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text3);
  pointer-events: none;
}
.amount-input { padding-left: 42px; }
.sheet-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.btn-group { display: flex; gap: 8px; }
.btn-cancel {
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 18px;
  height: 46px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  transition: filter 0.12s;
}
.btn-cancel:hover { filter: brightness(0.95); }
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary);
  border: none;
  border-radius: 10px;
  padding: 0 24px;
  height: 46px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  transition: filter 0.12s;
}
.btn-save:hover:not(:disabled) { filter: brightness(1.1); }
.btn-danger {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  border: 1.5px solid var(--danger);
  border-radius: 10px;
  padding: 0 18px;
  height: 46px;
  font-size: 14px;
  font-weight: 700;
  color: var(--danger);
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  transition: filter 0.12s;
}
.btn-danger:hover:not(:disabled) { filter: brightness(0.9); }
.sheet-enter-active,
.sheet-leave-active { transition: opacity 0.22s ease; }
.sheet-enter-active .sheet-container,
.sheet-leave-active .sheet-container { transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-container,
.sheet-leave-to .sheet-container { transform: translateY(100%); }
@media (min-width: 640px) {
  .sheet-overlay { align-items: center; padding: 16px; }
  .sheet-container { border-radius: 20px; border: 1px solid var(--border); max-height: 92dvh; }
  .sheet-handle-area { display: none; }
  .sheet-enter-from .sheet-container,
  .sheet-leave-to .sheet-container { transform: scale(0.95) translateY(8px); }
}
</style>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { makeId } from '#shared/id'
import type { WishItem, WishPriority, WishStatus } from '#shared/types'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

// ─── State ────────────────────────────────────────────────────────────────────

const items        = ref<WishItem[]>([])
const loading      = ref(false)
const brokenImages = reactive(new Set<string>())

const search         = ref('')
const filterStatus   = ref('')
const filterPriority = ref('')

// ─── Fetch ────────────────────────────────────────────────────────────────────

const fetchItems = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ items: WishItem[] }>(`/api/wishlist?key=${store.editKey}`)
    items.value = res.items
  } finally {
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
  const totalValue = items.value
    .filter(i => i.status !== 'bought')
    .reduce((s, i) => s + (i.price ?? 0), 0)
  return { wantCount, boughtCount, totalValue }
})

// ─── Badges ───────────────────────────────────────────────────────────────────

const priorityLabel = (p: WishPriority) =>
  p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'

const priorityBadgeClass = (p: WishPriority) =>
  p === 'high' ? 'badge-danger' : p === 'medium' ? 'badge-warning' : 'badge-success'

const statusLabel = (s: WishStatus) =>
  s === 'want' ? 'Quero' : s === 'saving' ? 'Guardando' : 'Comprado'

const statusBadgeClass = (s: WishStatus) =>
  s === 'want' ? 'badge-primary' : s === 'saving' ? 'badge-warning' : 'badge-success'

// ─── Editor ───────────────────────────────────────────────────────────────────

const editorOpen  = ref(false)
const editingItem = ref<WishItem | null>(null)
const saving      = ref(false)
const errorMsg    = ref('')

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
  errorMsg.value    = ''
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
  if (!draft.name.trim()) return
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
    const res = await $fetch<{ items: WishItem[] }>(`/api/wishlist/batch?key=${store.editKey}`, {
      method: 'POST',
      body: { upserts: [upsert], deletes: [] },
    })
    items.value = res.items
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
    const res = await $fetch<{ items: WishItem[] }>(`/api/wishlist/batch?key=${store.editKey}`, {
      method: 'POST',
      body: { upserts: [], deletes: [editingItem.value.id] },
    })
    items.value = res.items
    closeEditor()
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Erro ao excluir item'
  } finally {
    saving.value = false
  }
}
</script>
