<template>
  <div class="plan-screen" @click="closeColMenu">

    <!-- ── Barra de filtros ─────────────────────────────────────────── -->
    <div class="plan-toolbar">
      <label
        v-if="viewMode === 'matrix'"
        class="plan-search"
        :class="{ 'plan-search--focus': searchFocused }"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          v-model="searchText"
          type="text"
          aria-label="Buscar lançamentos" placeholder="Buscar lançamentos..."
          @focus="searchFocused = true"
          @blur="searchFocused = false"
        />
        <button v-if="searchText" type="button" class="plan-search-clear" title="Limpar busca" @click.stop="searchText = ''">×</button>
      </label>

      <div class="plan-seg">
        <button
          v-for="v in VIEWS"
          :key="v.id"
          type="button"
          class="plan-seg-btn" :aria-pressed="viewMode === v.id"
          :class="{ 'plan-seg-btn--on': viewMode === v.id }"
          @click="viewMode = v.id as 'matrix' | 'list'"
        >{{ v.label }}</button>
      </div>

      <button
        v-if="viewMode === 'matrix'"
        type="button"
        class="plan-new-btn"
        @click.stop="openAdd('expense')"
      >+ Novo lançamento</button>
    </div>

      <!-- Seletor de mês -->
      <div v-if="isCompact || viewMode === 'list'" class="month-nav">
        <button
          class="month-nav-btn"
          :disabled="selectedMonthIndex === 0"
          aria-label="Mês anterior"
         @click="prevMonth">‹</button>
        <BaseDropdown v-model="selectedMonth" :height="38" style="min-width: 0; flex: 1">
          <option v-for="m in months" :key="m" :value="m">{{ formatMonthLong(m) }}</option>
        </BaseDropdown>
        <button
          class="month-nav-btn"
          :disabled="selectedMonthIndex === months.length - 1"
          aria-label="Próximo mês"
         @click="nextMonth">›</button>
        <button class="month-nav-btn" aria-label="Ir para o mês atual" @click="selectedMonth = currentMonthKey">Hoje</button>
      </div>
    <p v-if="editError" role="alert" class="ds-alert-error">{{ editError }} <button type="button" @click="viewMode = 'list'">Abrir lista de lançamentos</button></p>

    <!-- ── Totalizadores ────────────────────────────────────────────── -->
    <div v-if="viewMode === 'matrix'" class="plan-totals">
      <div class="plan-total plan-total--income">
        <span class="plan-total-label">Receitas</span>
        <span class="plan-total-value ds-money">{{ fmt(monthIncomeTotal(selectedMonth)) }}</span>
      </div>
      <div class="plan-total plan-total--expense">
        <span class="plan-total-label">Despesas</span>
        <span class="plan-total-value ds-money">{{ fmt(monthExpenseTotal(selectedMonth)) }}</span>
      </div>
      <div class="plan-total" :class="sobra(selectedMonth) >= 0 ? 'plan-total--income' : 'plan-total--expense'">
        <span class="plan-total-label plan-total-label--muted">Saldo</span>
        <span class="plan-total-value ds-money">{{ fmt(sobra(selectedMonth)) }}</span>
      </div>
    </div>

    <p v-if="viewMode === 'matrix'" class="plan-hint">
      Resumo de {{ formatMonthLong(selectedMonth) }} por vencimento. Totais excluem benefícios e itens fora do cálculo; as células mantêm esses registros visíveis.
      {{ months.length }} meses no histórico · {{ expenseColumns.length }} despesas · {{ incomeColumns.length }} receitas
      <template v-if="hiddenColumnCount > 0"> · {{ hiddenColumnCount }} coluna(s) ocultas pela busca</template>
      <template v-else> · clique em uma célula para editar</template>
    </p>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MATRIZ VIEW — cards (≤640px)                                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <template v-if="viewMode === 'matrix' && isCompact">
      <MatrixMonthCard
v-model:value="editValue" :label="formatMonthLong(selectedMonth)" :rows="mobileRows"
        :income="monthIncomeTotal(selectedMonth)" :expense="monthExpenseTotal(selectedMonth)" :editing-key="editingKey" :saving="saving || store.syncing" :format="fmt"
        @clear="openClearRow(selectedMonth)" @edit="(kind, title, event) => startEdit(kind, title, selectedMonth, event)"
        @save="(kind, title) => saveCell(kind, title, selectedMonth)" @cancel="cancelEdit"
        @toggle="(kind, title) => toggleStatus(kind, title, selectedMonth)" />

      <div class="mcard-actions">
        <button class="plan-ghost-btn" @click.stop="openAdd('expense')">+ Despesa</button>
        <button class="plan-ghost-btn" @click.stop="openAdd('income')">+ Receita</button>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MATRIZ VIEW — tabelas (>640px)                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <template v-else-if="viewMode === 'matrix'">

      <!-- DESPESAS -->
      <section class="neo-panel plan-panel">
        <header class="neo-panel-header plan-panel-head">
          <h3 class="plan-panel-title">Despesas</h3>
          <span class="plan-panel-meta">{{ visibleExpenseColumns.length }} coluna(s)</span>
          <span class="plan-panel-total ds-money is-negative">{{ fmt(expenseTotal) }}</span>
        </header>

        <div class="plan-scroll">
          <table class="plan-table">
            <thead>
              <tr>
                <th class="th-sticky">Vencimento</th>
                <th
                  v-for="col in visibleExpenseColumns"
                  :key="col"
                  class="th-col"
                  @mouseenter="showTooltip(col, $event)"
                  @mouseleave="hideTooltip"
                  @dragover.prevent
                  @drop.prevent="dropColumn('expense', col)"
                >
                  <div class="col-head">
                    <div class="col-head-main">
                      <span class="col-title" draggable="true" @dragstart="startColumnDrag('expense', col, $event)">{{ truncate(col) }}</span>
                      <button class="col-menu-btn" title="Ações da coluna" @click.stop="openColMenu('expense', col, $event)">⋮</button>
                    </div>
                    <span
                      v-if="getColumnDueDay('expense', col)"
                      class="plan-pill plan-pill--warning due-day-badge"
                      :title="`Vencimento recorrente: dia ${getColumnDueDay('expense', col)}`"
                    >vence {{ getColumnDueDay('expense', col) }}</span>
                  </div>
                </th>
                <th class="th-sum">Soma ↓</th>
                <th class="th-add">
                  <button class="add-col-btn" @click.stop="openAdd('expense')">+ Coluna</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="month in months"
                :key="month"
                @mouseenter="hoverMonth = month"
                @mouseleave="hoverMonth = null"
              >
                <td class="td-sticky">
                  <div class="td-sticky-inner">
                    <span>{{ formatMonth(month) }}</span>
                    <button
                      class="row-clear-btn"
                      :style="{ opacity: hoverMonth === month ? '1' : '0' }"
                      title="Apagar valores do mês"
                      @click.stop="openClearRow(month)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
                    </button>
                  </div>
                </td>
                <td
                  v-for="col in visibleExpenseColumns"
                  :key="col"
                  class="td-data ds-money"
                  :class="{ 'is-editing': editingKey === cellKey('expense', col, month), 'is-empty': getAmount('expense', col, month) === 0 }"
                  :style="cellTint(getAmount('expense', col, month), editingKey === cellKey('expense', col, month), getStatus('expense', col, month), 'expense')"
                  @click="startEdit('expense', col, month, $event)"
                >
                  <input
                    v-if="editingKey === cellKey('expense', col, month)"
                    v-model="editValue"
                    type="text"
                    inputmode="decimal"
                    class="cell-input ds-money"
                    @blur="saveCell('expense', col, month)"
                    @keydown.enter.prevent="saveCell('expense', col, month)"
                    @keydown.escape.prevent="cancelEdit"
                    @click.stop
                  />
                  <div v-else class="cell-content">
                    <sup v-if="getCellCount('expense', col, month) > 1" class="cell-count">×{{ getCellCount('expense', col, month) }}</sup>
                    <span v-if="getAmount('expense', col, month) > 0">{{ fmt(getAmount('expense', col, month)) }}</span>
                    <span v-else>—</span>
                    <button
                      v-if="getAmount('expense', col, month) > 0"
                      class="status-dot"
                      :class="`status-dot--${getStatus('expense', col, month) === 'paid' ? 'paid' : getStatus('expense', col, month) === 'mixed' ? 'mixed' : 'pending-expense'}`"
                      :title="getStatus('expense', col, month) === 'paid' ? 'Pago — clique para marcar como não pago' : 'Não pago — clique para marcar como pago'"
                      @click.stop="toggleStatus('expense', col, month)"
                    />
                  </div>
                </td>
                <td class="td-sum ds-money" :class="monthExpenseTotal(month) > 0 ? 'is-negative' : 'is-muted'">
                  {{ monthExpenseTotal(month) > 0 ? fmt(monthExpenseTotal(month)) : '—' }}
                </td>
                <td class="td-filler" />
              </tr>
            </tbody>
            <tfoot>
              <tr class="tfoot-row">
                <td class="td-sticky td-foot">Total</td>
                <td v-for="col in visibleExpenseColumns" :key="col" class="td-foot ds-money">
                  {{ expenseColumnTotal(col) > 0 ? fmt(expenseColumnTotal(col)) : '—' }}
                </td>
                <td class="td-foot ds-money">{{ expenseTotal > 0 ? fmt(expenseTotal) : '—' }}</td>
                <td class="td-foot" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <!-- RECEITAS -->
      <section class="neo-panel plan-panel">
        <header class="neo-panel-header plan-panel-head">
          <h3 class="plan-panel-title">Receitas</h3>
          <span class="plan-panel-meta">{{ visibleIncomeColumns.length }} coluna(s)</span>
          <span class="plan-panel-total ds-money is-positive">{{ fmt(incomeTotal) }}</span>
        </header>

        <div class="plan-scroll">
          <table class="plan-table">
            <thead>
              <tr>
                <th class="th-sticky">Vencimento</th>
                <th
                  v-for="col in visibleIncomeColumns"
                  :key="col"
                  class="th-col"
                  @mouseenter="showTooltip(col, $event)"
                  @mouseleave="hideTooltip"
                  @dragover.prevent
                  @drop.prevent="dropColumn('income', col)"
                >
                  <div class="col-head">
                    <div class="col-head-main">
                      <span class="col-title" draggable="true" @dragstart="startColumnDrag('income', col, $event)">{{ truncate(col) }}</span>
                      <button class="col-menu-btn" title="Ações da coluna" @click.stop="openColMenu('income', col, $event)">⋮</button>
                    </div>
                  </div>
                </th>
                <th class="th-sum">Total ↓</th>
                <th class="th-sum th-sum--primary">Sobra ↓</th>
                <th class="th-add">
                  <button class="add-col-btn" @click.stop="openAdd('income')">+ Coluna</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="month in months"
                :key="month"
                @mouseenter="hoverMonth = month"
                @mouseleave="hoverMonth = null"
              >
                <td class="td-sticky">
                  <div class="td-sticky-inner">
                    <span>{{ formatMonth(month) }}</span>
                    <button
                      class="row-clear-btn"
                      :style="{ opacity: hoverMonth === month ? '1' : '0' }"
                      title="Apagar valores do mês"
                      @click.stop="openClearRow(month)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
                    </button>
                  </div>
                </td>
                <td
                  v-for="col in visibleIncomeColumns"
                  :key="col"
                  class="td-data ds-money"
                  :class="{ 'is-editing': editingKey === cellKey('income', col, month), 'is-empty': getAmount('income', col, month) === 0 }"
                  :style="cellTint(getAmount('income', col, month), editingKey === cellKey('income', col, month), getStatus('income', col, month), 'income')"
                  @click="startEdit('income', col, month, $event)"
                >
                  <input
                    v-if="editingKey === cellKey('income', col, month)"
                    v-model="editValue"
                    type="text"
                    inputmode="decimal"
                    class="cell-input ds-money"
                    @blur="saveCell('income', col, month)"
                    @keydown.enter.prevent="saveCell('income', col, month)"
                    @keydown.escape.prevent="cancelEdit"
                    @click.stop
                  />
                  <div v-else class="cell-content">
                    <sup v-if="getCellCount('income', col, month) > 1" class="cell-count">×{{ getCellCount('income', col, month) }}</sup>
                    <span v-if="getAmount('income', col, month) > 0">{{ fmt(getAmount('income', col, month)) }}</span>
                    <span v-else>—</span>
                    <button
                      v-if="getAmount('income', col, month) > 0"
                      class="status-dot"
                      :class="`status-dot--${getStatus('income', col, month) === 'paid' ? 'received' : getStatus('income', col, month) === 'mixed' ? 'mixed' : 'pending-income'}`"
                      :title="getStatus('income', col, month) === 'paid' ? 'Recebido — clique para marcar como pendente' : 'Pendente — clique para marcar como recebido'"
                      @click.stop="toggleStatus('income', col, month)"
                    />
                  </div>
                </td>
                <td class="td-sum ds-money" :class="monthIncomeTotal(month) > 0 ? 'is-positive' : 'is-muted'">
                  {{ monthIncomeTotal(month) > 0 ? fmt(monthIncomeTotal(month)) : '—' }}
                </td>
                <td class="td-sum ds-money" :class="sobra(month) === 0 ? 'is-muted' : sobra(month) > 0 ? 'is-positive' : 'is-negative'">
                  {{ sobra(month) !== 0 ? fmt(sobra(month)) : '—' }}
                </td>
                <td class="td-filler" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </template>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- LISTA VIEW                                                     -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <template v-else>
      <FinanceEntryGrid :month="selectedMonth" />
    </template>

    <!-- ── Tooltip ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="plan-tooltip"
        :style="{ left: tooltip.x + 'px', top: (tooltip.y - 44) + 'px' }"
      >{{ tooltip.text }}</div>
    </Teleport>

    <!-- ── Dropdown de ações da coluna ──────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="colMenu"
        class="plan-menu"
        :style="{ left: colMenu.x + 'px', top: colMenu.y + 'px' }"
        @click.stop
      >
        <button v-if="canMoveColumn(-1)" class="menu-item" @click="moveColumn(-1)">← Mover para esquerda</button>
        <button v-if="canMoveColumn(1)" class="menu-item" @click="moveColumn(1)">Mover para direita →</button>
        <button class="menu-item" @click="startRename()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Renomear
        </button>
        <button class="menu-item menu-item-danger" @click="startDelete()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Excluir coluna
        </button>
      </div>
    </Teleport>

    <!-- ── Modal: Renomear ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="renameState.open" class="modal-overlay" @click.self="closeMatrixDialogs">
          <div ref="matrixDialog" role="dialog" aria-modal="true" aria-label="Editar planilha" class="modal-box" @click.stop>
            <h3 class="modal-title">Renomear coluna</h3>
            <p class="modal-sub">Todos os lançamentos com este título serão renomeados.</p>
            <input
              ref="renameInputRef"
              v-model="renameState.newTitle"
              type="text"
              class="modal-input"
              placeholder="Novo nome..."
              @keydown.enter.prevent="runMatrixAction(confirmRename)"
              @keydown.escape.prevent="closeMatrixDialogs"
            />
            <p v-if="editError" role="alert" class="ds-alert-error">{{ editError }}</p>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeMatrixDialogs">Cancelar</button>
              <button class="btn-save" :disabled="!renameState.newTitle.trim() || actionPending" @click="runMatrixAction(confirmRename)">Renomear</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Confirmar exclusão de coluna ──────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteState.open" class="modal-overlay" @click.self="closeMatrixDialogs">
          <div ref="matrixDialog" role="dialog" aria-modal="true" aria-label="Editar planilha" class="modal-box" @click.stop>
            <h3 class="modal-title">Excluir coluna</h3>
            <p class="modal-sub">
              Isso excluirá <strong>{{ deleteState.count }} lançamento(s)</strong> com o título
              "<strong>{{ deleteState.title }}</strong>". Esta ação não pode ser desfeita.
            </p>
            <p v-if="editError" role="alert" class="ds-alert-error">{{ editError }}</p>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeMatrixDialogs">Cancelar</button>
              <button class="btn-delete" :disabled="actionPending" @click="runMatrixAction(confirmDelete)">Excluir</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Apagar valores do mês ───────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="clearRowState.open" class="modal-overlay" @click.self="closeMatrixDialogs">
          <div ref="matrixDialog" role="dialog" aria-modal="true" aria-label="Editar planilha" class="modal-box" @click.stop>
            <h3 class="modal-title">Apagar valores do mês</h3>
            <p class="modal-sub">
              Isso zera os <strong>{{ clearRowState.count }} valor(es)</strong> de
              <strong>{{ formatMonthLong(clearRowState.month) }}</strong>, mantendo a linha do mês.
            </p>
            <p v-if="editError" role="alert" class="ds-alert-error">{{ editError }}</p>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeMatrixDialogs">Cancelar</button>
              <button class="btn-delete" :disabled="clearRowState.count === 0 || actionPending" @click="runMatrixAction(confirmClearRow)">Apagar valores</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Adicionar coluna ───────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="addState.open" class="modal-overlay" @click.self="closeMatrixDialogs">
          <div ref="matrixDialog" role="dialog" aria-modal="true" aria-label="Editar planilha" class="modal-box" @click.stop>
            <h3 class="modal-title">
              Adicionar {{ addState.kind === 'expense' ? 'despesa' : 'receita' }}
            </h3>
            <p class="modal-sub">Cadastre um lançamento no mês selecionado.</p>
            <div style="display: flex; flex-direction: column; gap: 12px">
              <div>
                <label for="matrix-add-title" class="modal-label">Título</label>
                <input
                  id="matrix-add-title"
                  ref="addTitleInputRef"
                  v-model="addState.title"
                  type="text"
                  class="modal-input"
                  placeholder="Ex.: Aluguel, Salário..."
                  @keydown.enter.prevent="focusAddAmount"
                  @keydown.escape.prevent="closeMatrixDialogs"
                />
              </div>
              <div>
                <label for="matrix-add-amount" class="modal-label">{{ addState.recurrence > 1 ? 'Valor por mês (opcional)' : 'Valor inicial (mês selecionado, opcional)' }}</label>
                <div style="position: relative">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: var(--text3); pointer-events: none">R$</span>
                  <input
                    id="matrix-add-amount"
                    ref="addAmountInputRef"
                    v-model="addState.amount"
                    type="text"
                    inputmode="decimal"
                    class="modal-input"
                    style="padding-left: 34px"
                    placeholder="0,00"
                    @keydown.enter.prevent="runMatrixAction(confirmAdd)"
                    @keydown.escape.prevent="closeMatrixDialogs"
                  />
                </div>
              </div>
              <div>
                <label for="matrix-add-recurrence" class="modal-label">Recorrência (meses)</label>
                <input
                  id="matrix-add-recurrence"
                  v-model.number="addState.recurrence"
                  type="number"
                  min="1"
                  max="120"
                  class="modal-input"
                  placeholder="1"
                />
                <p style="font-size: 11px; color: var(--text3); margin-top: 5px">
                  {{ addState.recurrence > 1
                    ? `Cria o lançamento em ${addState.recurrence} meses, a partir deste. Cada mês pode ser editado depois.`
                    : '1 = apenas este mês.' }}
                </p>
              </div>
            </div>
            <p v-if="editError" role="alert" class="ds-alert-error">{{ editError }}</p>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeMatrixDialogs">Cancelar</button>
              <button class="btn-save" :disabled="!addState.title.trim() || actionPending || store.syncing" @click="runMatrixAction(confirmAdd)">Adicionar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useMatrixEditing } from '../../composables/useMatrixEditing'
import { useMatrixColumnOrder } from '../../composables/useMatrixColumnOrder'
import { useMatrixModel } from '../../composables/useMatrixModel'
import { useMonthNavigation } from '../../composables/useMonthNavigation'
import { parseMoney } from '#shared/money'
import { civilDate } from '#shared/period'
import { useDialog } from '~/design-system/composables/useDialog'
import MatrixMonthCard from '../MatrixMonthCard.vue'
import FinanceEntryGrid from '~/features/finance/components/FinanceEntryGrid.vue'
import type { EntryKind, EntryStatus, FinanceEntry } from '#shared/types'

const store    = useFinanceStore()
const route = useRoute()
const router = useRouter()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

const VIEWS = [{ id: 'matrix', label: 'Matriz' }, { id: 'list', label: 'Lista' }]
const viewMode = computed<'matrix' | 'list'>({ get: () => route.query.view === 'list' ? 'list' : 'matrix', set: view => { void router.replace({ query: { ...route.query, view } }) } })

const MONTH_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const formatMonth = (key: string) => {
  const parts = key.split('-')
  const y = parts[0] ?? '2025'
  const m = parts[1] ?? '01'
  return `${MONTH_ABBR[parseInt(m) - 1] ?? m}/${y.slice(2)}`
}
const formatMonthLong = (key: string) => {
  const parts = key.split('-')
  const y = parts[0] ?? '2025'
  const m = parseInt(parts[1] ?? '1') - 1
  const NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${NAMES[m] ?? ''} de ${y}`
}
const truncate = (s: string, n = 14) => s.length > n ? s.slice(0, n - 1) + '…' : s

// ─── viewport compacto (cards no lugar da tabela) ───────────────────────────

const isCompact = ref(false)
let compactQuery: MediaQueryList | null = null
const syncCompact = (event: MediaQueryListEvent) => { isCompact.value = event.matches }

onMounted(() => {
  if (!import.meta.client || typeof window.matchMedia !== 'function') return
  compactQuery = window.matchMedia('(max-width: 640px)')
  isCompact.value = compactQuery.matches
  compactQuery.addEventListener('change', syncCompact)
})

onBeforeUnmount(() => {
  compactQuery?.removeEventListener('change', syncCompact)
  compactQuery = null
})

// ─── computed columns & months ───────────────────────────────────────────────

const months = computed(() => {
  const set = new Set<string>([civilDate(new Date(), store.settings.timezone).slice(0, 7)])
  for (const e of store.entries) set.add(e.dueDate.slice(0, 7))
  return [...set].sort()
})

// ─── seletor de mês (usado na aba Lista) ────────────────────────────────────

const { currentMonth: currentMonthKey, selectedMonth, selectedMonthIndex, prevMonth, nextMonth } = useMonthNavigation(() => months.value, () => store.settings.timezone)

const expenseColumns = computed(() => buildColumns('expense'))
const incomeColumns  = computed(() => buildColumns('income'))

// ─── busca (apenas filtra quais colunas aparecem) ───────────────────────────

const searchText = computed({ get: () => typeof route.query.q === 'string' ? route.query.q : '', set: q => { void router.replace({ query: { ...route.query, q: q || undefined } }) } })
const searchFocused = ref(false)
const normalizedSearch = computed(() => searchText.value.trim().toLowerCase())
const matchesSearch = (title: string) =>
  !normalizedSearch.value || title.toLowerCase().includes(normalizedSearch.value)

const visibleExpenseColumns = computed(() => expenseColumns.value.filter(matchesSearch))
const visibleIncomeColumns  = computed(() => incomeColumns.value.filter(matchesSearch))
const hiddenColumnCount = computed(() =>
  (expenseColumns.value.length - visibleExpenseColumns.value.length)
  + (incomeColumns.value.length - visibleIncomeColumns.value.length))

const { columnOrder, buildColumns, saveColumnOrder } = useMatrixColumnOrder(() => store.entries, () => store.settings.id)

const matrixModel = useMatrixModel(() => store.entries)
const { getColumnDueDay, cellKey, getAmount, getCellCount, getCellEntries, getStatus } = matrixModel

const toggleStatus = async (kind: string, title: string, month: string) => {
  const entries = getCellEntries(kind, title, month)
  if (!entries.length) return
  const current = getStatus(kind, title, month)
  const next: EntryStatus = current === 'paid' ? 'pending' : 'paid'
  await runMatrixAction(() => store.saveEntriesBatch({ upserts: entries.map(e => ({ id: e.id, status: next })), deletes: [] }))
}

const mobileRows = computed(() => (['expense', 'income'] as const).flatMap(kind => {
  const columns = kind === 'expense' ? visibleExpenseColumns.value : visibleIncomeColumns.value
  return columns.filter(title => getCellCount(kind, title, selectedMonth.value) > 0).map(title => ({
    key: cellKey(kind, title, selectedMonth.value), kind, title,
    day: Math.min(...getCellEntries(kind, title, selectedMonth.value).map(entry => Number(entry.dueDate.slice(8)))),
    amount: getAmount(kind, title, selectedMonth.value), count: getCellCount(kind, title, selectedMonth.value),
    status: getStatus(kind, title, selectedMonth.value),
  })).sort((a, b) => a.day - b.day || a.title.localeCompare(b.title))
}))

const { getAmount: getCashAmount } = useMatrixModel(() => store.allCashableEntries)
const monthExpenseTotal = (month: string) => expenseColumns.value.reduce((s, c) => s + getCashAmount('expense', c, month), 0)
const monthIncomeTotal  = (month: string) => incomeColumns.value.reduce((s, c)  => s + getCashAmount('income',  c, month), 0)
const expenseColumnTotal = (column: string) => months.value.reduce((sum, month) => sum + getCashAmount('expense', column, month), 0)
const incomeColumnTotal  = (column: string) => months.value.reduce((sum, month) => sum + getCashAmount('income', column, month), 0)
const expenseTotal = computed(() => expenseColumns.value.reduce((sum, column) => sum + expenseColumnTotal(column), 0))
const incomeTotal  = computed(() => incomeColumns.value.reduce((sum, column) => sum + incomeColumnTotal(column), 0))
const sobra = (month: string) => monthIncomeTotal(month) - monthExpenseTotal(month)

// ─── inline cell editing ─────────────────────────────────────────────────────

const { editingKey, editValue, saving, editError, startEdit, cancelEdit, saveCell } = useMatrixEditing(
  matrixModel, () => store.settings.id, store.saveEntriesBatch, month => { selectedMonth.value = month },
)

// ─── tooltip ─────────────────────────────────────────────────────────────────

const tooltip = ref({ visible: false, text: '', x: 0, y: 0 })

const showTooltip = (text: string, e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tooltip.value = { visible: true, text, x: rect.left + rect.width / 2, y: rect.top }
}
const hideTooltip = () => { tooltip.value.visible = false }

// ─── column menu (⋮) ─────────────────────────────────────────────────────────

const colMenu = ref<{ kind: EntryKind; col: string; x: number; y: number } | null>(null)

const openColMenu = (kind: EntryKind, col: string, e: MouseEvent) => {
  hideTooltip()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  colMenu.value = { kind, col, x: rect.left, y: rect.bottom + 4 }
}
const closeColMenu = () => { colMenu.value = null }

const canMoveColumn = (direction: number) => {
  if (!colMenu.value) return false
  const index = buildColumns(colMenu.value.kind).indexOf(colMenu.value.col)
  return index + direction >= 0 && index + direction < buildColumns(colMenu.value.kind).length
}

const moveColumn = (direction: number) => {
  if (!colMenu.value) return
  const { kind, col } = colMenu.value
  const columns = buildColumns(kind)
  const index = columns.indexOf(col)
  const target = index + direction
  if (target < 0 || target >= columns.length) return
  columns.splice(index, 1)
  columns.splice(target, 0, col)
  saveColumnOrder(kind, columns)
  closeColMenu()
}

const draggedColumn = ref<{ kind: EntryKind; col: string } | null>(null)

const startColumnDrag = (kind: EntryKind, col: string, event: DragEvent) => {
  draggedColumn.value = { kind, col }
  event.dataTransfer?.setData('text/plain', col)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

const dropColumn = (kind: EntryKind, target: string) => {
  const dragged = draggedColumn.value
  draggedColumn.value = null
  if (!dragged || dragged.kind !== kind || dragged.col === target) return
  const columns = buildColumns(kind)
  columns.splice(columns.indexOf(dragged.col), 1)
  columns.splice(columns.indexOf(target), 0, dragged.col)
  saveColumnOrder(kind, columns)
}

// ─── rename ───────────────────────────────────────────────────────────────────

const renameInputRef = ref<HTMLInputElement | null>(null)
const renameState = ref({ open: false, kind: 'expense' as EntryKind, oldTitle: '', newTitle: '' })

const startRename = () => {
  if (!colMenu.value) return
  renameState.value = { open: true, kind: colMenu.value.kind, oldTitle: colMenu.value.col, newTitle: colMenu.value.col }
  colMenu.value = null
  nextTick(() => { renameInputRef.value?.focus(); renameInputRef.value?.select() })
}

const confirmRename = async () => {
  const { kind, oldTitle, newTitle } = renameState.value
  const trimmed = newTitle.trim()
  if (!trimmed || trimmed === oldTitle) { renameState.value.open = false; return }
  const entries = store.entries.filter(e => e.kind === kind && e.title === oldTitle)
  await store.saveEntriesBatch({ upserts: entries.map(e => ({ ...e, title: trimmed })), deletes: [] })
  saveColumnOrder(kind, columnOrder.value[kind].map(title => title === oldTitle ? trimmed : title))
  renameState.value.open = false
}

// ─── clear row values (month) ─────────────────────────────────────────────────

const hoverMonth = ref<string | null>(null)
const clearRowState = ref({ open: false, month: '', count: 0 })

const openClearRow = (month: string) => {
  const count = store.entries.filter(e => e.dueDate.startsWith(month) && e.amount > 0).length
  clearRowState.value = { open: true, month, count }
}

const confirmClearRow = async () => {
  const upserts = store.entries
    .filter(e => e.dueDate.startsWith(clearRowState.value.month) && e.amount > 0)
    .map(e => ({ ...e, amount: 0 }))
  if (upserts.length > 0) await store.saveEntriesBatch({ upserts, deletes: [] })
  clearRowState.value.open = false
}

// ─── delete column ────────────────────────────────────────────────────────────

const deleteState = ref({ open: false, kind: 'expense' as EntryKind, title: '', count: 0 })

const startDelete = () => {
  if (!colMenu.value) return
  const { kind, col } = colMenu.value
  const count = store.entries.filter(e => e.kind === kind && e.title === col).length
  deleteState.value = { open: true, kind, title: col, count }
  colMenu.value = null
}

const confirmDelete = async () => {
  const { kind, title } = deleteState.value
  const entries = store.entries.filter(e => e.kind === kind && e.title === title)
  await store.saveEntriesBatch({ upserts: [], deletes: entries.map(e => e.id) })
  saveColumnOrder(kind, columnOrder.value[kind].filter(column => column !== title))
  deleteState.value.open = false
}

// ─── add column ───────────────────────────────────────────────────────────────

const addTitleInputRef  = ref<HTMLInputElement | null>(null)
const addAmountInputRef = ref<HTMLInputElement | null>(null)
const addState = ref({ open: false, kind: 'expense' as EntryKind, title: '', amount: '', recurrence: 1 })

let addIds: string[] = []
const openAdd = (kind: EntryKind) => {
  addIds = []
  addState.value = { open: true, kind, title: '', amount: '', recurrence: 1 }
  nextTick(() => { addTitleInputRef.value?.focus() })
}

const focusAddAmount = () => { addAmountInputRef.value?.focus() }

// Avança N meses sobre uma chave 'YYYY-MM' e devolve a nova chave.
const shiftMonthKey = (key: string, add: number): string => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y ?? 2025, (m ?? 1) - 1 + add, 1))
  return d.toISOString().slice(0, 7)
}

const confirmAdd = async () => {
  const { kind, title, amount, recurrence } = addState.value
  if (!Number.isInteger(recurrence) || recurrence < 1 || recurrence > 120) { editError.value = 'Use de 1 a 120 meses inteiros.'; return }
  const trimmed = title.trim()
  if (!trimmed) return

  const amt = amount.trim() ? parseMoney(amount) : 0
  if (amt === null) { editError.value = 'Informe um valor válido, por exemplo 1.234,56.'; return }
  const startMonth = selectedMonth.value
  const householdId = store.entries[0]?.householdId ?? store.accounts[0]?.householdId ?? 'household-main'
  const now = new Date().toISOString()
  const months = Math.min(120, Math.max(1, recurrence || 1))

  const upserts: FinanceEntry[] = Array.from({ length: months }, (_, i) => {
    const monthKey = shiftMonthKey(startMonth, i)
    const due = `${monthKey}-01`
    return {
      id: (addIds[i] ??= crypto.randomUUID()), householdId, ruleId: null, accountId: null, categoryId: null,
      title: trimmed, description: '', amount: amt, kind,
      dueDate: due, competenceDate: due,
      installmentIndex: null, installmentTotal: null,
      status: 'pending', origin: 'manual', excludeFromCalc: false, metadata: null,
      createdAt: now, updatedAt: now,
    }
  })

  await store.saveEntriesBatch({ upserts, deletes: [] })
  addState.value.open = false
}

// ─── style helpers ────────────────────────────────────────────────────────────

const statusTint = (status: 'paid' | 'pending' | 'mixed' | null, kind: 'expense' | 'income') => {
  if (!status) return 'transparent'
  if (status === 'paid') return 'color-mix(in srgb, var(--success) 12%, transparent)'
  if (status === 'mixed') return 'color-mix(in srgb, var(--warning) 12%, transparent)'
  return kind === 'income'
    ? 'color-mix(in srgb, var(--warning) 12%, transparent)'
    : 'color-mix(in srgb, var(--danger) 12%, transparent)'
}

const cellTint = (amount: number, isEditing: boolean, status: 'paid' | 'pending' | 'mixed' | null, kind: 'expense' | 'income') => ({
  background: isEditing
    ? 'color-mix(in srgb, var(--primary) 14%, var(--surface))'
    : (amount > 0 && status ? statusTint(status, kind) : 'transparent'),
})
const matrixDialog = ref<HTMLElement | null>(null)
const anyDialogOpen = computed(() => renameState.value.open || deleteState.value.open || clearRowState.value.open || addState.value.open)
const actionPending = ref(false)
const runMatrixAction = async (action: () => Promise<void>) => {
  if (actionPending.value || store.syncing) return
  actionPending.value = true
  editError.value = ''
  try { await action() }
  catch (error) { editError.value = error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.' }
  finally { actionPending.value = false }
}
const closeMatrixDialogs = () => {
  if (actionPending.value || store.syncing) return
  const changed = (addState.value.open && (addState.value.title || addState.value.amount || addState.value.recurrence !== 1))
    || (renameState.value.open && renameState.value.newTitle !== renameState.value.oldTitle)
  if (changed && !window.confirm('Descartar as alterações do formulário?')) return
  renameState.value.open = false; deleteState.value.open = false; clearRowState.value.open = false; addState.value.open = false
}
useDialog(anyDialogOpen, matrixDialog, closeMatrixDialogs)
onMounted(() => {
  if (route.query.create === 'expense') {
    openAdd('expense')
    void router.replace({ query: { ...route.query, create: undefined } })
  }
})
</script>

<style scoped src="../../styles/matrix.css"></style>
