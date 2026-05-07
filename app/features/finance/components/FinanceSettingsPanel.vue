<template>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">

    <!-- Tema visual -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Tema visual</h3>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:10px">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            class="theme-btn"
            :style="{
              border: store.settings.themeMode === theme.id ? '2px solid var(--primary)' : '2px solid var(--border)',
              background: store.settings.themeMode === theme.id ? 'var(--primary-dim)' : 'var(--surface2)'
            }"
            @click="onThemeModeChange(theme.id)"
          >
            <span style="font-size:24px">{{ theme.icon }}</span>
            <div style="flex:1">
              <p style="font-size:13px;font-weight:700;color:var(--text)">{{ theme.name }}</p>
              <p style="font-size:11px;color:var(--text3)">{{ theme.desc }}</p>
            </div>
            <svg
              v-if="store.settings.themeMode === theme.id"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              style="color:var(--primary);flex-shrink:0;margin-left:auto"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Configurações do dashboard -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Configurações do dashboard</h3>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="field">
            <label class="field-label">Regra de período</label>
            <div class="select-wrap">
              <select v-model="store.filters.periodMode" class="select-inner">
                <option value="due_date">Por vencimento</option>
                <option value="competence">Por competência</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text3);flex-shrink:0;pointer-events:none"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>

          <div>
            <p style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px">Widgets visíveis</p>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div
                v-for="widget in WIDGETS"
                :key="widget.id"
                style="padding:8px 12px;background:var(--surface2);border-radius:var(--radius-xs);border:1px solid var(--border)"
              >
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                  <div
                    style="width:18px;height:18px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;cursor:pointer"
                    :style="{
                      border: isWidgetOn(widget.id) ? '2px solid var(--primary)' : '2px solid var(--border-strong)',
                      background: isWidgetOn(widget.id) ? 'var(--primary)' : 'var(--surface2)'
                    }"
                    @click="toggleWidget(widget.id)"
                  >
                    <svg v-if="isWidgetOn(widget.id)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style="font-size:13px;color:var(--text)">{{ widget.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <button class="btn-primary" @click="saveDashboard">Salvar configurações</button>
        </div>
      </div>
    </div>

    <!-- Importar CSV -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Importar CSV</h3>
        <p class="panel-sub">Cabeçalhos aceitos: date, amount, title</p>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:10px">
          <textarea
            v-model="csvText"
            class="textarea-field"
            rows="5"
            placeholder="date,amount,title&#10;2026-05-25,120.50,Supermercado"
          />
          <div class="field">
            <label class="field-label">Conta destino</label>
            <div class="select-wrap">
              <select v-model="importAccountId" class="select-inner">
                <option value="">Sem conta</option>
                <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text3);flex-shrink:0;pointer-events:none"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
          <button class="btn-primary" @click="runImport">Importar CSV</button>
        </div>
      </div>
    </div>

    <!-- Contas cadastradas -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Contas cadastradas</h3>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div
            v-for="account in store.accounts"
            :key="account.id"
            style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:var(--radius-xs);border:1px solid var(--border)"
          >
            <div
              style="width:8px;height:8px;border-radius:50%;flex-shrink:0"
              :style="{ background: accountTypeColor(account.type) }"
            />
            <div style="flex:1;min-width:0">
              <p
                style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                :style="{ color: account.active === false ? 'var(--text3)' : 'var(--text)' }"
              >{{ account.name }}</p>
              <p style="font-size:11px;color:var(--text3)">
                {{ accountTypeLabel(account.type) }}<span v-if="account.limitTotal"> · Limite {{ currency.format(account.limitTotal) }}</span>
              </p>
            </div>
            <span
              v-if="account.active === false"
              style="font-size:10px;color:var(--danger);background:var(--danger-light);border-radius:99px;padding:1px 8px;font-weight:700;flex-shrink:0"
            >Inativo</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { WIDGET_OPTIONS } from '#shared/constants'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { ThemeMode, Account } from '#shared/types'

const store = useFinanceStore()
const currency = useCurrency()
const csvText = ref('')
const importAccountId = ref('')

const THEMES = [
  { id: 'light', name: 'Light Clean', desc: 'Claro e minimalista, ideal para o dia a dia', icon: '☀️' },
  { id: 'dark', name: 'Dark Premium', desc: 'Escuro profissional, confortável à noite', icon: '🌙' },
  { id: 'eva', name: 'EVA-01', desc: 'Temática especial, roxa e neon', icon: '⚡' },
] as const

const WIDGETS = WIDGET_OPTIONS

const isWidgetOn = (id: string) => store.settings.dashboardConfig.visibleWidgets.includes(id)

const onThemeModeChange = (value: string) => {
  if (value === 'light' || value === 'dark' || value === 'eva') {
    store.setThemeMode(value as ThemeMode)
  }
}

const toggleWidget = (id: string) => {
  const next = new Set(store.settings.dashboardConfig.visibleWidgets)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  store.settings.dashboardConfig.visibleWidgets = [...next]
}

const saveDashboard = async () => {
  await store.saveDashboard()
}

const runImport = async () => {
  if (!csvText.value.trim()) return
  await store.importCsv(csvText.value, importAccountId.value || null)
  csvText.value = ''
}

const accountTypeColor = (type: Account['type']) => {
  if (type === 'bank') return 'var(--primary)'
  if (type === 'credit_card') return 'var(--danger)'
  return 'var(--warning)'
}

const accountTypeLabel = (type: Account['type']) => {
  if (type === 'bank') return 'Conta bancária'
  if (type === 'credit_card') return 'Cartão de crédito'
  return 'Benefício'
}
</script>

<style scoped>
.panel {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.panel-header {
  padding: 16px 20px 0;
}
.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.panel-sub {
  font-size: 12px;
  color: var(--text3);
  margin-top: 2px;
}
.panel-body {
  padding: 16px 20px;
}
.theme-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}
.theme-btn:hover {
  filter: brightness(0.97);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.select-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0 12px;
  height: 38px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.select-wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.select-inner {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  min-width: 0;
}
.textarea-field {
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 9px 12px;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}
.textarea-field:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
</style>
