<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- KPIs -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="income"   label="Total de ativos"   :value="fmt(summary.totalAssets)"      color="var(--success)" />
      <BaseKpiCard icon="expense"  label="Total de passivos" :value="fmt(summary.totalLiabilities)"  color="var(--danger)"  />
      <BaseKpiCard icon="patrimony" label="Patrimônio líq."  :value="fmt(summary.netWorth)"          :color="summary.netWorth >= 0 ? 'var(--primary)' : 'var(--danger)'" />
    </div>

    <!-- Add button row -->
    <div style="display: flex; gap: 10px; justify-content: flex-end">
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: 1.5px solid var(--success); background: transparent; color: var(--success)"
        @click="openModal('asset', null)"
      >
        <BaseIcon name="plus" :size="14" color="var(--success)" /> Adicionar Ativo
      </button>
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: 1.5px solid var(--danger); background: transparent; color: var(--danger)"
        @click="openModal('liability', null)"
      >
        <BaseIcon name="plus" :size="14" color="var(--danger)" /> Adicionar Passivo
      </button>
    </div>

    <!-- Assets + Liabilities grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px">

      <!-- Assets -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden">
        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--success)">Ativos</h3>
          <span style="font-size: 14px; font-weight: 800; color: var(--success)">{{ fmt(summary.totalAssets) }}</span>
        </div>
        <BaseEmptyState v-if="assetItems.length === 0" icon="income" title="Nenhum ativo" body="Adicione bens, investimentos e saldos." />
        <div v-else>
          <div
            v-for="item in assetItems"
            :key="item.id"
            style="display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--border)"
          >
            <div style="flex: 1; min-width: 0">
              <p style="font-size: 13px; font-weight: 600; color: var(--text)">{{ item.name }}</p>
              <p v-if="item.category" style="font-size: 11px; color: var(--text3)">{{ item.category }}</p>
            </div>
            <span style="font-size: 14px; font-weight: 700; color: var(--success); white-space: nowrap">{{ fmt(item.value) }}</span>
            <div style="display: flex; gap: 2px">
              <button style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px" @click="openModal('asset', item)">
                <BaseIcon name="settings" :size="13" />
              </button>
              <button style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 4px" @click="deleteItem(item.id)">
                <BaseIcon name="close" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Liabilities -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden">
        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--danger)">Passivos</h3>
          <span style="font-size: 14px; font-weight: 800; color: var(--danger)">{{ fmt(summary.totalLiabilities) }}</span>
        </div>
        <BaseEmptyState v-if="liabilityItems.length === 0" icon="expense" title="Nenhum passivo" body="Adicione dívidas, financiamentos e obrigações." />
        <div v-else>
          <div
            v-for="item in liabilityItems"
            :key="item.id"
            style="display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--border)"
          >
            <div style="flex: 1; min-width: 0">
              <p style="font-size: 13px; font-weight: 600; color: var(--text)">{{ item.name }}</p>
              <p v-if="item.category" style="font-size: 11px; color: var(--text3)">{{ item.category }}</p>
            </div>
            <span style="font-size: 14px; font-weight: 700; color: var(--danger); white-space: nowrap">{{ fmt(item.value) }}</span>
            <div style="display: flex; gap: 2px">
              <button style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px" @click="openModal('liability', item)">
                <BaseIcon name="settings" :size="13" />
              </button>
              <button style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 4px" @click="deleteItem(item.id)">
                <BaseIcon name="close" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Net worth bar -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px 18px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
        <p style="font-size: 13px; font-weight: 700; color: var(--text)">Composição patrimonial</p>
        <p style="font-size: 15px; font-weight: 800" :style="{ color: summary.netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }">
          {{ fmt(summary.netWorth) }}
        </p>
      </div>
      <div style="height: 12px; border-radius: 99px; overflow: hidden; background: var(--danger); position: relative">
        <div
          :style="{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: summary.totalAssets + summary.totalLiabilities > 0
              ? `${(summary.totalAssets / (summary.totalAssets + summary.totalLiabilities)) * 100}%`
              : '50%',
            background: 'var(--success)',
            transition: 'width 0.6s',
            borderRadius: '99px'
          }"
        />
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 6px">
        <span style="font-size: 11px; color: var(--success); font-weight: 600">Ativos {{ fmt(summary.totalAssets) }}</span>
        <span style="font-size: 11px; color: var(--danger); font-weight: 600">Passivos {{ fmt(summary.totalLiabilities) }}</span>
      </div>
    </div>

    <!-- Modal -->
    <BaseModal v-model="showModal" :title="editingItem ? `Editar ${modalKind === 'asset' ? 'ativo' : 'passivo'}` : `Novo ${modalKind === 'asset' ? 'ativo' : 'passivo'}`">
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Nome</label>
          <input
            v-model="form.name"
            :placeholder="modalKind === 'asset' ? 'Ex: Poupança, Imóvel…' : 'Ex: Financiamento, Cartão…'"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Valor (R$)</label>
            <input
              v-model.number="form.value"
              type="number" min="0" step="0.01"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
            />
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Categoria</label>
            <input
              v-model="form.category"
              placeholder="Ex: Investimentos"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
            />
          </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <button
            style="padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
            @click="showModal = false"
          >Cancelar</button>
          <button
            :disabled="!form.name || !form.value || saving"
            style="padding: 8px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff"
            @click="saveItem"
          >{{ editingItem ? 'Salvar' : 'Criar' }}</button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { makeId } from '#shared/id'
import type { PatrimonyItem } from '#shared/types'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseModal      from '~/components/base/BaseModal.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

const assetItems     = computed(() => store.patrimony.filter(p => p.kind === 'asset').sort((a, b) => b.value - a.value))
const liabilityItems = computed(() => store.patrimony.filter(p => p.kind === 'liability').sort((a, b) => b.value - a.value))

const summary = computed(() => {
  const totalAssets      = assetItems.value.reduce((s, p) => s + p.value, 0)
  const totalLiabilities = liabilityItems.value.reduce((s, p) => s + p.value, 0)
  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities }
})

// Modal
const showModal   = ref(false)
const editingItem = ref<PatrimonyItem | null>(null)
const modalKind   = ref<'asset' | 'liability'>('asset')
const saving      = ref(false)
const form        = ref({ name: '', value: 0, category: '' })

const openModal = (kind: 'asset' | 'liability', item: PatrimonyItem | null) => {
  modalKind.value   = kind
  editingItem.value = item
  form.value        = { name: item?.name ?? '', value: item?.value ?? 0, category: item?.category ?? '' }
  showModal.value   = true
}

const saveItem = async () => {
  if (!form.value.name || !form.value.value) return
  saving.value = true
  try {
    const upsert: Partial<PatrimonyItem> = {
      id:       editingItem.value?.id ?? makeId('patrimony'),
      name:     form.value.name,
      kind:     modalKind.value,
      value:    form.value.value,
      category: form.value.category
    }
    await store.savePatrimony([upsert], [])
    showModal.value = false
  } finally {
    saving.value = false
  }
}

const deleteItem = async (id: string) => {
  await store.savePatrimony([], [id])
}
</script>
