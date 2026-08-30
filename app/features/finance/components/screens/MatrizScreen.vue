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
          placeholder="Buscar lançamentos..."
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
          class="plan-seg-btn"
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

    <!-- ── Totalizadores ────────────────────────────────────────────── -->
    <div v-if="viewMode === 'matrix'" class="plan-totals">
      <div class="plan-total plan-total--income">
        <span class="plan-total-label">Receitas</span>
        <span class="plan-total-value ds-money">{{ fmt(incomeTotal) }}</span>
      </div>
      <div class="plan-total plan-total--expense">
        <span class="plan-total-label">Despesas</span>
        <span class="plan-total-value ds-money">{{ fmt(expenseTotal) }}</span>
      </div>
      <div class="plan-total" :class="netTotal >= 0 ? 'plan-total--income' : 'plan-total--expense'">
        <span class="plan-total-label plan-total-label--muted">Saldo</span>
        <span class="plan-total-value ds-money">{{ fmt(netTotal) }}</span>
      </div>
    </div>

    <p v-if="viewMode === 'matrix'" class="plan-hint">
      {{ months.length }} meses · {{ expenseColumns.length }} despesas · {{ incomeColumns.length }} receitas
      <template v-if="hiddenColumnCount > 0"> · {{ hiddenColumnCount }} coluna(s) ocultas pela busca</template>
      <template v-else> · clique em uma célula para editar</template>
    </p>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MATRIZ VIEW — cards (≤640px)                                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <template v-if="viewMode === 'matrix' && isCompact">
      <section v-for="month in months" :key="`card-${month}`" class="neo-panel mcard">
        <header class="neo-panel-header mcard-head">
          <span class="mcard-month">{{ formatMonthLong(month) }}</span>
          <span class="mcard-net ds-money" :class="sobra(month) >= 0 ? 'is-positive' : 'is-negative'">{{ fmt(sobra(month)) }}</span>
          <button class="mcard-clear" title="Apagar valores do mês" @click.stop="openClearRow(month)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
          </button>
        </header>

        <p class="mcard-group">Despesas</p>
        <div
          v-for="col in visibleExpenseColumns"
          :key="`e-${month}-${col}`"
          class="mcard-row"
          @click="startEdit('expense', col, month, $event)"
        >
          <span class="mcard-swatch mcard-swatch--expense" />
          <div class="mcard-row-main">
            <p class="mcard-row-title">{{ col }}</p>
            <p v-if="getColumnDueDay('expense', col)" class="mcard-row-sub">vence dia {{ getColumnDueDay('expense', col) }}</p>
          </div>
          <div class="mcard-row-side">
            <input
              v-if="editingKey === cellKey('expense', col, month)"
              v-model="editValue"
              type="text"
              inputmode="decimal"
              class="mcard-input"
              @blur="saveCell('expense', col, month)"
              @keydown.enter.prevent="saveCell('expense', col, month)"
              @keydown.escape.prevent="cancelEdit"
              @click.stop
            />
            <template v-else>
              <p class="mcard-amount ds-money" :class="{ 'is-empty': getAmount('expense', col, month) === 0 }">
                <sup v-if="getCellCount('expense', col, month) > 1" class="cell-count">×{{ getCellCount('expense', col, month) }}</sup>
                {{ getAmount('expense', col, month) > 0 ? fmt(getAmount('expense', col, month)) : '—' }}
              </p>
              <button
                v-if="getAmount('expense', col, month) > 0"
                class="plan-pill"
                :class="pillClass(getStatus('expense', col, month))"
                @click.stop="toggleStatus('expense', col, month)"
              >{{ statusLabel('expense', getStatus('expense', col, month)) }}</button>
            </template>
          </div>
        </div>
        <p v-if="visibleExpenseColumns.length === 0" class="mcard-empty">Nenhuma despesa.</p>

        <p class="mcard-group">Receitas</p>
        <div
          v-for="col in visibleIncomeColumns"
          :key="`i-${month}-${col}`"
          class="mcard-row"
          @click="startEdit('income', col, month, $event)"
        >
          <span class="mcard-swatch mcard-swatch--income" />
          <div class="mcard-row-main">
            <p class="mcard-row-title">{{ col }}</p>
          </div>
          <div class="mcard-row-side">
            <input
              v-if="editingKey === cellKey('income', col, month)"
              v-model="editValue"
              type="text"
              inputmode="decimal"
              class="mcard-input"
              @blur="saveCell('income', col, month)"
              @keydown.enter.prevent="saveCell('income', col, month)"
              @keydown.escape.prevent="cancelEdit"
              @click.stop
            />
            <template v-else>
              <p class="mcard-amount ds-money" :class="{ 'is-empty': getAmount('income', col, month) === 0 }">
                <sup v-if="getCellCount('income', col, month) > 1" class="cell-count">×{{ getCellCount('income', col, month) }}</sup>
                {{ getAmount('income', col, month) > 0 ? fmt(getAmount('income', col, month)) : '—' }}
              </p>
              <button
                v-if="getAmount('income', col, month) > 0"
                class="plan-pill"
                :class="pillClass(getStatus('income', col, month))"
                @click.stop="toggleStatus('income', col, month)"
              >{{ statusLabel('income', getStatus('income', col, month)) }}</button>
            </template>
          </div>
        </div>
        <p v-if="visibleIncomeColumns.length === 0" class="mcard-empty">Nenhuma receita.</p>

        <footer class="mcard-foot">
          <span>Despesas <b class="ds-money is-negative">{{ fmt(monthExpenseTotal(month)) }}</b></span>
          <span>Receitas <b class="ds-money is-positive">{{ fmt(monthIncomeTotal(month)) }}</b></span>
        </footer>
      </section>

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
      <!-- Seletor de mês -->
      <div class="month-nav">
        <button
          class="month-nav-btn"
          :disabled="selectedMonthIndex === 0"
          @click="prevMonth"
        >‹</button>
        <BaseDropdown v-model="selectedMonth" :height="38" style="min-width: 200px">
          <option v-for="m in months" :key="m" :value="m">{{ formatMonthLong(m) }}</option>
        </BaseDropdown>
        <button
          class="month-nav-btn"
          :disabled="selectedMonthIndex === months.length - 1"
          @click="nextMonth"
        >›</button>
      </div>
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
        <div v-if="renameState.open" class="modal-overlay" @click.self="renameState.open = false">
          <div class="modal-box" @click.stop>
            <h3 class="modal-title">Renomear coluna</h3>
            <p class="modal-sub">Todos os lançamentos com este título serão renomeados.</p>
            <input
              ref="renameInputRef"
              v-model="renameState.newTitle"
              type="text"
              class="modal-input"
              placeholder="Novo nome..."
              @keydown.enter.prevent="confirmRename"
              @keydown.escape.prevent="renameState.open = false"
            />
            <div class="modal-footer">
              <button class="btn-cancel" @click="renameState.open = false">Cancelar</button>
              <button class="btn-save" :disabled="!renameState.newTitle.trim()" @click="confirmRename">Renomear</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Confirmar exclusão de coluna ──────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteState.open" class="modal-overlay" @click.self="deleteState.open = false">
          <div class="modal-box" @click.stop>
            <h3 class="modal-title">Excluir coluna</h3>
            <p class="modal-sub">
              Isso excluirá <strong>{{ deleteState.count }} lançamento(s)</strong> com o título
              "<strong>{{ deleteState.title }}</strong>". Esta ação não pode ser desfeita.
            </p>
            <div class="modal-footer">
              <button class="btn-cancel" @click="deleteState.open = false">Cancelar</button>
              <button class="btn-delete" @click="confirmDelete">Excluir</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Apagar valores do mês ───────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="clearRowState.open" class="modal-overlay" @click.self="clearRowState.open = false">
          <div class="modal-box" @click.stop>
            <h3 class="modal-title">Apagar valores do mês</h3>
            <p class="modal-sub">
              Isso zera os <strong>{{ clearRowState.count }} valor(es)</strong> de
              <strong>{{ formatMonthLong(clearRowState.month) }}</strong>, mantendo a linha do mês.
            </p>
            <div class="modal-footer">
              <button class="btn-cancel" @click="clearRowState.open = false">Cancelar</button>
              <button class="btn-delete" :disabled="clearRowState.count === 0" @click="confirmClearRow">Apagar valores</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: Adicionar coluna ───────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="addState.open" class="modal-overlay" @click.self="addState.open = false">
          <div class="modal-box" @click.stop>
            <h3 class="modal-title">
              Adicionar {{ addState.kind === 'expense' ? 'despesa' : 'receita' }}
            </h3>
            <p class="modal-sub">Cria uma nova coluna na matriz com o nome informado.</p>
            <div style="display: flex; flex-direction: column; gap: 12px">
              <div>
                <label class="modal-label">Título</label>
                <input
                  ref="addTitleInputRef"
                  v-model="addState.title"
                  type="text"
                  class="modal-input"
                  placeholder="Ex.: Aluguel, Salário..."
                  @keydown.enter.prevent="focusAddAmount"
                  @keydown.escape.prevent="addState.open = false"
                />
              </div>
              <div>
                <label class="modal-label">{{ addState.recurrence > 1 ? 'Valor por mês (opcional)' : 'Valor inicial (mês atual, opcional)' }}</label>
                <div style="position: relative">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: var(--text3); pointer-events: none">R$</span>
                  <input
                    ref="addAmountInputRef"
                    v-model="addState.amount"
                    type="text"
                    inputmode="decimal"
                    class="modal-input"
                    style="padding-left: 34px"
                    placeholder="0,00"
                    @keydown.enter.prevent="confirmAdd"
                    @keydown.escape.prevent="addState.open = false"
                  />
                </div>
              </div>
              <div>
                <label class="modal-label">Recorrência (meses)</label>
                <input
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
            <div class="modal-footer">
              <button class="btn-cancel" @click="addState.open = false">Cancelar</button>
              <button class="btn-save" :disabled="!addState.title.trim()" @click="confirmAdd">Adicionar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import FinanceEntryGrid from '~/features/finance/components/FinanceEntryGrid.vue'
import type { EntryKind, EntryStatus, FinanceEntry } from '#shared/types'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

const VIEWS = [{ id: 'matrix', label: 'Matriz' }, { id: 'list', label: 'Lista' }]
const viewMode = ref<'matrix' | 'list'>('matrix')

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
  const set = new Set<string>()
  for (const e of store.entries) set.add(e.dueDate.slice(0, 7))
  return [...set].sort()
})

// ─── seletor de mês (usado na aba Lista) ────────────────────────────────────

const currentMonthKey = new Date().toISOString().slice(0, 7)
const selectedMonth = ref(currentMonthKey)

const selectedMonthIndex = computed(() => {
  const idx = months.value.indexOf(selectedMonth.value)
  return idx >= 0 ? idx : 0
})

const prevMonth = () => {
  const idx = selectedMonthIndex.value
  if (idx > 0) selectedMonth.value = months.value[idx - 1]!
}

const nextMonth = () => {
  const idx = selectedMonthIndex.value
  if (idx < months.value.length - 1) selectedMonth.value = months.value[idx + 1]!
}

const expenseColumns = computed(() => buildColumns('expense'))
const incomeColumns  = computed(() => buildColumns('income'))

// ─── busca (apenas filtra quais colunas aparecem) ───────────────────────────

const searchText = ref('')
const searchFocused = ref(false)
const normalizedSearch = computed(() => searchText.value.trim().toLowerCase())
const matchesSearch = (title: string) =>
  !normalizedSearch.value || title.toLowerCase().includes(normalizedSearch.value)

const visibleExpenseColumns = computed(() => expenseColumns.value.filter(matchesSearch))
const visibleIncomeColumns  = computed(() => incomeColumns.value.filter(matchesSearch))
const hiddenColumnCount = computed(() =>
  (expenseColumns.value.length - visibleExpenseColumns.value.length)
  + (incomeColumns.value.length - visibleIncomeColumns.value.length))

const COLUMN_ORDER_KEY = 'finance-matrix-column-order'
const columnOrder = ref<Record<EntryKind, string[]>>({ expense: [], income: [] })
const columnOrderReady = ref(false)

function buildColumns(kind: EntryKind): string[] {
  const titles: string[] = []
  for (const e of store.entries) {
    if (e.kind === kind && !titles.includes(e.title)) titles.push(e.title)
  }
  const saved = [...new Set(columnOrder.value[kind].filter(title => titles.includes(title)))]
  return [...saved, ...titles.filter(title => !saved.includes(title))]
}

const persistColumnOrder = () => {
  if (import.meta.client) localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder.value))
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_ORDER_KEY) ?? '{}') as Partial<Record<EntryKind, unknown>>
    columnOrder.value = {
      expense: Array.isArray(saved.expense) ? saved.expense.filter((title): title is string => typeof title === 'string') : [],
      income: Array.isArray(saved.income) ? saved.income.filter((title): title is string => typeof title === 'string') : [],
    }
  } catch {
    // Mantém a ordem dos lançamentos se a preferência local estiver inválida.
  }
  columnOrderReady.value = true
})

watch([columnOrderReady, expenseColumns, incomeColumns], ([ready, expenses, incomes]) => {
  if (!ready) return
  const sync = (kind: EntryKind, columns: string[]) => [
    ...new Set(columnOrder.value[kind].filter(column => columns.includes(column))),
    ...columns.filter(column => !columnOrder.value[kind].includes(column)),
  ]
  const next = { expense: sync('expense', expenses), income: sync('income', incomes) }
  if (next.expense.join('\0') === columnOrder.value.expense.join('\0') && next.income.join('\0') === columnOrder.value.income.join('\0')) return
  columnOrder.value = next
  persistColumnOrder()
}, { immediate: true })

const columnDueDayMap = computed(() => {
  const daysByColumn = new Map<string, Set<number>>()

  for (const entry of store.entries) {
    const key = `${entry.kind}__${entry.title}`
    const days = daysByColumn.get(key) ?? new Set<number>()
    days.add(Number.parseInt(entry.dueDate.slice(8, 10), 10))
    daysByColumn.set(key, days)
  }

  const result = new Map<string, number>()
  for (const [key, days] of daysByColumn) {
    if (days.size === 1) {
      result.set(key, [...days][0]!)
    }
  }
  return result
})

const getColumnDueDay = (kind: EntryKind, title: string): number | null =>
  columnDueDayMap.value.get(`${kind}__${title}`) ?? null

// ─── cell lookup maps ────────────────────────────────────────────────────────

const amountMap = computed(() => {
  const map  = new Map<string, number>()
  const cnt  = new Map<string, number>()
  const ents = new Map<string, FinanceEntry[]>()
  for (const e of store.entries) {
    const k = `${e.kind}__${e.title}__${e.dueDate.slice(0, 7)}`
    map.set(k,  (map.get(k)  ?? 0) + e.amount)
    cnt.set(k,  (cnt.get(k)  ?? 0) + 1)
    if (!ents.has(k)) ents.set(k, [])
    ents.get(k)!.push(e)
  }
  return { map, cnt, ents }
})

const cellKey         = (kind: string, title: string, month: string) => `${kind}__${title}__${month}`
const getAmount       = (kind: string, title: string, month: string) => amountMap.value.map.get(cellKey(kind, title, month)) ?? 0
const getCellCount    = (kind: string, title: string, month: string) => amountMap.value.cnt.get(cellKey(kind, title, month)) ?? 0
const getCellEntries  = (kind: string, title: string, month: string) => amountMap.value.ents.get(cellKey(kind, title, month)) ?? []

// ─── status por célula ───────────────────────────────────────────────────────

const statusMap = computed(() => {
  const map = new Map<string, 'paid' | 'pending' | 'mixed'>()
  for (const e of store.entries) {
    const k = cellKey(e.kind, e.title, e.dueDate.slice(0, 7))
    const existing = map.get(k)
    const st = e.status === 'paid' ? 'paid' : 'pending'
    if (!existing) { map.set(k, st) }
    else if (existing !== st) { map.set(k, 'mixed') }
  }
  return map
})

const getStatus = (kind: string, title: string, month: string): 'paid' | 'pending' | 'mixed' | null => {
  if (getAmount(kind, title, month) === 0) return null
  return statusMap.value.get(cellKey(kind, title, month)) ?? null
}

const toggleStatus = async (kind: string, title: string, month: string) => {
  const entries = getCellEntries(kind, title, month)
  if (!entries.length) return
  const current = getStatus(kind, title, month)
  const next: EntryStatus = current === 'paid' ? 'pending' : 'paid'
  await store.saveEntriesBatch({ upserts: entries.map(e => ({ ...e, status: next })), deletes: [] })
}

// Rótulos/estilos das pills de status (usados no layout de cards).
const statusLabel = (kind: 'expense' | 'income', status: 'paid' | 'pending' | 'mixed' | null) => {
  if (status === 'mixed') return 'Parcial'
  if (status === 'paid') return kind === 'income' ? 'Recebido' : 'Pago'
  return kind === 'income' ? 'A receber' : 'A pagar'
}

const pillClass = (status: 'paid' | 'pending' | 'mixed' | null) =>
  status === 'paid' ? 'plan-pill--success'
    : status === 'mixed' ? 'plan-pill--warning'
      : 'plan-pill--danger'

const monthExpenseTotal = (month: string) => expenseColumns.value.reduce((s, c) => s + getAmount('expense', c, month), 0)
const monthIncomeTotal  = (month: string) => incomeColumns.value.reduce((s, c)  => s + getAmount('income',  c, month), 0)
const expenseColumnTotal = (column: string) => months.value.reduce((sum, month) => sum + getAmount('expense', column, month), 0)
const incomeColumnTotal  = (column: string) => months.value.reduce((sum, month) => sum + getAmount('income', column, month), 0)
const expenseTotal = computed(() => expenseColumns.value.reduce((sum, column) => sum + expenseColumnTotal(column), 0))
const incomeTotal  = computed(() => incomeColumns.value.reduce((sum, column) => sum + incomeColumnTotal(column), 0))
const netTotal     = computed(() => incomeTotal.value - expenseTotal.value)
const sobra = (month: string) => monthIncomeTotal(month) - monthExpenseTotal(month)

// ─── inline cell editing ─────────────────────────────────────────────────────

const editingKey = ref<string | null>(null)
const editValue  = ref('')
const saving     = ref(false)

const startEdit = (kind: string, title: string, month: string, event: MouseEvent) => {
  if (saving.value) return
  const key = cellKey(kind, title, month)
  editingKey.value = key
  const amount = getAmount(kind, title, month)
  editValue.value = amount > 0 ? String(amount).replace('.', ',') : ''
  const host = event.currentTarget as HTMLElement | null
  nextTick(() => {
    const input = host?.querySelector('input') as HTMLInputElement | null
    input?.focus()
    input?.select()
  })
}

const cancelEdit = () => { editingKey.value = null }

const saveCell = async (kind: EntryKind, title: string, month: string) => {
  const key = cellKey(kind, title, month)
  if (editingKey.value !== key) return
  editingKey.value = null

  const raw    = editValue.value.replace(',', '.').trim()
  const amount = parseFloat(raw)
  if (isNaN(amount) && raw !== '') return

  const newAmount  = isNaN(amount) ? 0 : Math.max(0, amount)
  const existing   = getCellEntries(kind, title, month)
  const prevAmount = getAmount(kind, title, month)
  if (newAmount === prevAmount) return

  saving.value = true
  try {
    if (existing.length === 0 && newAmount === 0) return

    if (existing.length === 0) {
      const householdId = store.entries[0]?.householdId ?? store.accounts[0]?.householdId ?? 'household-main'
      const newEntry: FinanceEntry = {
        id: crypto.randomUUID(), householdId, ruleId: null, accountId: null, categoryId: null,
        title, description: '', amount: newAmount, kind,
        dueDate: `${month}-01`, competenceDate: `${month}-01`,
        installmentIndex: null, installmentTotal: null,
        status: 'pending', origin: 'manual', excludeFromCalc: false, metadata: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      await store.saveEntriesBatch({ upserts: [newEntry], deletes: [] })
      return
    }

    if (newAmount === 0) {
      await store.saveEntriesBatch({ upserts: [], deletes: existing.map(e => e.id) })
      return
    }

    if (existing.length === 1) {
      await store.saveEntriesBatch({ upserts: [{ ...existing[0]!, amount: newAmount }], deletes: [] })
      return
    }

    await store.saveEntriesBatch({
      upserts: [{ ...existing[0]!, amount: newAmount }],
      deletes: existing.slice(1).map(e => e.id),
    })
  } finally {
    saving.value = false
  }
}

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

const saveColumnOrder = (kind: EntryKind, columns: string[]) => {
  columnOrder.value = { ...columnOrder.value, [kind]: columns }
  persistColumnOrder()
}

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

const openAdd = (kind: EntryKind) => {
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
  const trimmed = title.trim()
  if (!trimmed) return

  const amt = Math.max(0, parseFloat(amount.replace(',', '.')) || 0)
  const startMonth = new Date().toISOString().slice(0, 7)
  const householdId = store.entries[0]?.householdId ?? store.accounts[0]?.householdId ?? 'household-main'
  const now = new Date().toISOString()
  const months = Math.min(120, Math.max(1, recurrence || 1))

  const upserts: FinanceEntry[] = Array.from({ length: months }, (_, i) => {
    const monthKey = shiftMonthKey(startMonth, i)
    const due = `${monthKey}-01`
    return {
      id: crypto.randomUUID(), householdId, ruleId: null, accountId: null, categoryId: null,
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
</script>

<style scoped>
.plan-screen {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Barra de filtros ────────────────────────────── */
.plan-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-search {
  flex: 1;
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text3);
  transition: box-shadow var(--ds-motion-fast) linear;
}
.plan-search--focus {
  box-shadow: var(--shadow-xs);
}
.plan-search input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
}
.plan-search input::placeholder { color: var(--text3); }
/* Neutraliza a altura global de inputs em telas pequenas (evita estourar a barra). */
.plan-search input[type='text'] { height: 100%; }
@media (max-width: 767px) {
  .plan-search { height: 44px; }
}
.plan-search-clear {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--text3);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
  font-family: inherit;
}
.plan-search-clear:hover { color: var(--text); }

.plan-seg {
  display: flex;
  gap: 6px;
}
.plan-seg-btn {
  padding: 7px 14px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-xs);
  background: var(--surface);
  color: var(--text2);
  font-family: inherit;
  font-weight: 800;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}
.plan-seg-btn--on {
  background: var(--primary);
  color: var(--on-primary);
}
.plan-seg-btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.plan-new-btn {
  padding: 8px 16px;
  background: var(--primary);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  color: var(--on-primary);
  font-family: inherit;
  font-weight: 800;
  font-size: 12.5px;
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}
.plan-new-btn:active { transform: translate(2px, 2px); box-shadow: none; }

.plan-ghost-btn {
  flex: 1;
  padding: 10px 14px;
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  color: var(--text);
  font-family: inherit;
  font-weight: 800;
  font-size: 12.5px;
  cursor: pointer;
}
.plan-ghost-btn:active { transform: translate(2px, 2px); box-shadow: none; }

/* ── Totalizadores ───────────────────────────────── */
.plan-screen .ds-money {
  font-family: var(--ds-font-family-grid);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
}

.plan-totals {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.plan-total {
  padding: 9px 18px;
  border-radius: var(--ds-radius-md);
  border: 1px solid var(--success);
  background: var(--success-light);
  display: flex;
  flex-direction: column;
  min-width: 120px;
}
.plan-total--income {
  border-color: var(--success);
  background: var(--success-light);
}
.plan-total--expense {
  border-color: var(--danger);
  background: var(--danger-light);
}
.plan-total-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.plan-total--income .plan-total-label,
.plan-total--income .plan-total-value { color: var(--success); }
.plan-total--expense .plan-total-label,
.plan-total--expense .plan-total-value { color: var(--danger); }
.plan-total-label--muted { color: var(--text3) !important; }
.plan-total-value {
  font-size: 15px;
  font-weight: 800;
}

.plan-hint {
  font-size: 11.5px;
  color: var(--text3);
  font-weight: 600;
}

/* ── Painel + tabela ─────────────────────────────── */
.plan-panel {
  display: flex;
  flex-direction: column;
}
.plan-panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
}
.plan-panel-title {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}
.plan-panel-meta {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3);
}
.plan-panel-total {
  margin-left: auto;
  font-size: 13px;
  font-weight: 800;
}

.plan-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}

.plan-table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 12.5px;
}

.plan-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--surface2);
  border-bottom: var(--border-width) solid var(--border);
  padding: 10px 14px;
  text-align: right;
  white-space: nowrap;
  color: var(--text3);
  font-weight: 700;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.plan-table th.th-sticky {
  left: 0;
  z-index: 3;
  text-align: left;
  border-right: var(--border-width) solid var(--border);
  min-width: 94px;
}
.plan-table th.th-col {
  padding: 0;
  min-width: 96px;
  max-width: 130px;
}
.plan-table th.th-sum { min-width: 96px; }
.plan-table th.th-sum--primary { color: var(--primary); }
.plan-table th.th-add {
  padding: 6px 10px;
  min-width: 96px;
  text-align: left;
}

.plan-table tbody tr {
  border-bottom: 1px solid var(--border);
}
.plan-table tbody tr:hover .td-sticky { background: var(--surface2); }

.plan-table td {
  padding: 10px 14px;
  text-align: right;
  white-space: nowrap;
  color: var(--text);
}

.td-sticky {
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left;
  font-weight: 700;
  font-size: 12px;
  color: var(--text2);
  background: var(--surface);
  border-right: var(--border-width) solid var(--border);
  transition: background var(--ds-motion-fast) linear;
}
.td-sticky-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: space-between;
}

.td-data {
  cursor: text;
  user-select: none;
  min-width: 96px;
  max-width: 130px;
  padding: 6px 12px;
  font-family: var(--ds-font-family-grid);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
}
.td-data.is-empty { color: var(--text3); font-weight: 600; }
.td-data.is-editing {
  outline: var(--border-width) solid var(--primary);
  outline-offset: calc(-1 * var(--border-width));
}

.td-sum {
  font-family: var(--ds-font-family-grid);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
}
.td-filler { padding: 0; }

.is-positive { color: var(--success); }
.is-negative { color: var(--danger); }
.is-muted    { color: var(--text3); }

.tfoot-row .td-foot {
  border-top: var(--border-width) solid var(--border);
  background: var(--danger-light);
  color: var(--danger);
  font-family: var(--ds-font-family-grid);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
  padding: 9px 14px;
}
.tfoot-row .td-sticky.td-foot {
  background: var(--danger-light);
  color: var(--danger);
}

.cell-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--ds-font-family-grid);
  font-size: 12.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
  text-align: right;
  color: var(--text);
  display: block;
  padding: 0;
}

/* ── Conteúdo da célula ──────────────────────────── */
.cell-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  min-height: 18px;
}
.cell-count {
  font-size: 8px;
  color: var(--text3);
  flex-shrink: 0;
}

/* ── Status dot ──────────────────────────────────── */
.status-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border: 1px solid var(--border);
  border-radius: 2px;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: transform .12s, opacity .12s;
  opacity: 0.9;
}
.status-dot:hover { transform: scale(1.4); opacity: 1; }

.status-dot--paid      { background: var(--success); }
.status-dot--received  { background: var(--success); }
.status-dot--pending-expense { background: var(--danger); }
.status-dot--pending-income  { background: var(--warning); }
.status-dot--mixed     { background: var(--warning); }

/* ── Pills (Tipo / Status) ───────────────────────── */
.plan-pill {
  display: inline-block;
  padding: 2px 10px;
  border: none;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: none;
  cursor: pointer;
}
.plan-pill--success { background: var(--success-light); color: var(--success); }
.plan-pill--danger  { background: var(--danger-light);  color: var(--danger); }
.plan-pill--warning { background: var(--warning-light); color: var(--warning); }

/* ── Column header ───────────────────────────────── */
.col-head {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  min-height: 42px;
  padding: 8px 10px 8px 14px;
  gap: 3px;
  height: 100%;
}
.col-head-main {
  display: flex;
  align-items: center;
  min-width: 0;
}
.col-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  cursor: grab;
}
.col-title:active { cursor: grabbing; }
.due-day-badge {
  align-self: flex-end;
  cursor: default;
  font-size: 9px;
  padding: 1px 8px;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}
.col-menu-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-xs);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text3);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.12s, background 0.12s;
  font-family: inherit;
  line-height: 1;
}
th:hover .col-menu-btn {
  opacity: 1;
}
.col-menu-btn:hover {
  background: var(--surface);
  border-color: var(--border);
  color: var(--primary);
}

@media (max-width: 767px) {
  .plan-scroll {
    scrollbar-color: var(--primary) var(--surface2);
    scrollbar-width: thin;
  }
  .col-menu-btn { opacity: 1; }
}

/* ── Row clear-values button ─────────────────────── */
.row-clear-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-xs);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text3);
  cursor: pointer;
  padding: 0;
  transition: opacity 0.12s, background 0.12s, color 0.12s;
}
.row-clear-btn:hover { background: var(--danger-light); border-color: var(--border); color: var(--danger); }

/* ── Add column button ───────────────────────────── */
.add-col-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: var(--border-width) dashed var(--border);
  border-radius: var(--radius-xs);
  padding: 4px 8px;
  background: transparent;
  color: var(--text3);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  text-transform: none;
  letter-spacing: 0;
  transition: border-color 0.12s, color 0.12s, background 0.12s;
}
.add-col-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-dim);
}

/* ── Cards (≤640px) ──────────────────────────────── */
.mcard {
  display: flex;
  flex-direction: column;
}
.mcard-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
}
.mcard-month {
  flex: 1;
  min-width: 0;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mcard-net {
  font-size: 13px;
  font-weight: 800;
}
.mcard-clear {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text3);
  cursor: pointer;
  padding: 0;
}
.mcard-clear:hover { background: var(--danger-light); color: var(--danger); border-color: var(--border); }

.mcard-group {
  padding: 8px 14px 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
}
.mcard-empty {
  padding: 0 14px 10px;
  font-size: 11.5px;
  color: var(--text3);
}

.mcard-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  cursor: text;
}
.mcard-swatch {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  border: 1px solid var(--border);
}
.mcard-swatch--expense { background: var(--danger); }
.mcard-swatch--income  { background: var(--success); }

.mcard-row-main { flex: 1; min-width: 0; }
.mcard-row-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mcard-row-sub {
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--text3);
}

.mcard-row-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}
.mcard-amount {
  font-family: var(--ds-font-family-grid);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
  color: var(--text);
}
.mcard-amount.is-empty { color: var(--text3); font-weight: 600; }
.mcard-input {
  width: 120px;
  height: 32px;
  border: var(--border-width) solid var(--primary);
  border-radius: var(--radius-sm);
  background: var(--surface2);
  font-family: var(--ds-font-family-grid);
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
  text-align: right;
  color: var(--text);
  outline: none;
  padding: 0 8px;
}

.mcard-foot {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-top: var(--border-width) solid var(--border);
  background: var(--surface2);
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3);
}
.mcard-foot b { font-size: 12px; font-weight: 800; margin-left: 4px; }

.mcard-actions {
  display: flex;
  gap: 8px;
}

/* ── Seletor de mês (aba Lista) ──────────────────── */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.month-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  background: var(--surface2);
  color: var(--text);
  font-family: inherit;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}
.month-nav-btn:disabled { opacity: 0.35; cursor: default; box-shadow: none; }
.month-nav-btn:not(:disabled):active { transform: translate(2px, 2px); box-shadow: none; }

/* ── Tooltip / menu flutuante ────────────────────── */
.plan-tooltip {
  position: fixed;
  z-index: 9999;
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  pointer-events: none;
  white-space: nowrap;
  max-width: 320px;
  transform: translateX(-50%);
}

.plan-menu {
  position: fixed;
  z-index: 9999;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 4px;
  min-width: 168px;
}

/* ── Dropdown menu items ─────────────────────────── */
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: var(--border-width) solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text2);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.1s;
  text-align: left;
}
.menu-item:hover { background: var(--surface2); border-color: var(--border); }
.menu-item-danger { color: var(--danger); }
.menu-item-danger:hover { background: var(--danger-light); }

/* ── Modal ───────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--overlay);
}
.modal-box {
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.modal-sub {
  font-size: 13px;
  color: var(--text3);
  line-height: 1.5;
}
.modal-label {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3);
  margin-bottom: 6px;
}
.modal-input {
  width: 100%;
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  height: 42px;
  font-size: 14px;
  font-weight: 650;
  color: var(--text);
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: box-shadow 0.15s, transform 0.15s;
  -webkit-appearance: none;
}
.modal-input:focus {
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.btn-cancel {
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 16px;
  height: 40px;
  font-size: 13px;
  font-weight: 750;
  color: var(--text2);
  cursor: pointer;
  font-family: inherit;
}
.btn-save {
  background: var(--primary);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 20px;
  height: 40px;
  font-size: 13px;
  font-weight: 800;
  color: var(--on-primary);
  cursor: pointer;
  font-family: inherit;
}
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-delete {
  background: var(--danger);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 20px;
  height: 40px;
  font-size: 13px;
  font-weight: 800;
  color: var(--on-danger);
  cursor: pointer;
  font-family: inherit;
}
.btn-delete:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Modal transition ────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity var(--ds-motion-base) linear; }
.modal-enter-active .modal-box, .modal-leave-active .modal-box { transition: transform var(--ds-motion-base) linear; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: translate(5px, 5px); }
</style>
