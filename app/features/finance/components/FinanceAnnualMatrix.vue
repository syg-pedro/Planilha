<template>
  <div ref="screenHost" class="annual-screen" :class="{ 'annual-screen--expanded': expanded, 'annual-screen--simple': simple }" @keydown.esc="escapeScreen">
    <template v-if="compact">
      <div class="annual-mobile-toolbar">
        <div class="annual-mobile-view"><BaseDropdown v-model="view" :options="viewOptions" aria-label="Visualização da planilha" /></div>
        <template v-if="view !== 'list'">
          <button type="button" aria-label="Buscar na planilha" :aria-expanded="mobileSearchOpen" @click="mobileSearchOpen = !mobileSearchOpen">
            <BaseIcon name="search" :size="16" />
            <span v-if="search.trim()" class="annual-mobile-dot" />
          </button>
          <button type="button" :aria-expanded="mobileOptionsOpen" aria-controls="annual-mobile-options" @click="mobileOptionsOpen = !mobileOptionsOpen">Opções</button>
        </template>
        <button type="button" class="annual-primary" aria-label="Novo lançamento" @click="newEntry(undefined, view !== 'list' ? mobileMonth : selectedMonth)">+</button>
      </div>
      <div v-if="view !== 'list'" class="annual-mobile-month-nav" aria-label="Navegar pelos meses">
        <button type="button" aria-label="Mês anterior da matriz" :disabled="!canMoveMobile(-1)" @click="moveMobileMonth(-1)">‹</button>
        <BaseMonthPicker :model-value="mobileMonth" class="annual-mobile-month" @update:model-value="chooseMobileMonth" />
        <button type="button" aria-label="Próximo mês da matriz" :disabled="!canMoveMobile(1)" @click="moveMobileMonth(1)">›</button>
        <button type="button" @click="chooseMobileMonth(todayMonth)">Hoje</button>
      </div>
      <label v-if="view !== 'list' && mobileSearchOpen" class="annual-search annual-mobile-search">
        <span class="sr-only">Buscar despesas, receitas ou contas</span>
        <input v-model="search" type="search" placeholder="Buscar despesas, receitas ou contas…" />
        <button v-if="search" type="button" aria-label="Limpar busca" @click="search = ''">×</button>
      </label>
    </template>
    <div v-else class="annual-toolbar">
      <div class="annual-tabs" aria-label="Visualização da planilha">
        <button type="button" :aria-pressed="view === 'simple'" @click="view = 'simple'">Simples</button>
        <button type="button" :aria-pressed="view === 'matrix'" @click="view = 'matrix'">Completa</button
        ><button type="button" :aria-pressed="view === 'list'" @click="view = 'list'">Lista</button>
      </div>
      <template v-if="view !== 'list'">
        <label class="annual-search"
          ><span class="sr-only">Buscar despesas, receitas ou contas</span
          ><input v-model="search" type="search" placeholder="Buscar despesas, receitas ou contas…"
        /></label>
        <button
          v-if="!simple"
          type="button"
          :aria-pressed="selection.enabled.value"
          @click="selection.enabled.value = !selection.enabled.value"
        >
          {{ selection.enabled.value ? 'Concluir seleção' : 'Selecionar células' }}
        </button>
        <button v-if="!simple" type="button" :aria-pressed="expanded" @click="expanded = !expanded">
          {{ expanded ? 'Reduzir' : 'Ampliar' }}
        </button>
        <button v-if="simple" type="button" :aria-expanded="mobileOptionsOpen" aria-controls="annual-mobile-options" @click="mobileOptionsOpen = !mobileOptionsOpen">Opções</button>
      </template>
      <button type="button" class="annual-primary" @click="newEntry()">+ Novo lançamento</button>
    </div>

    <template v-if="view !== 'list'">
      <div v-if="(!compact && !simple) || mobileOptionsOpen" id="annual-mobile-options" class="annual-controls">
        <BaseSelect v-model="windowMode" label="Período" class="annual-select">
          <option value="rolling">12 meses</option>
          <option value="year">Ano civil</option>
        </BaseSelect>
        <div class="annual-period-nav">
          <span v-if="compact" class="annual-period-label">{{ windowMode === 'rolling' ? 'Início' : 'Ano' }}</span>
          <button type="button" aria-label="Período anterior" @click="movePeriod(-1)">‹</button>
          <BaseMonthPicker v-if="windowMode === 'rolling'" v-model="anchorMonth" :label="compact ? '' : 'Início'" />
          <label v-else><span v-if="!compact">Ano</span><input v-model.number="year" aria-label="Ano do período" type="number" min="1900" max="2199" /></label>
          <button type="button" aria-label="Próximo período" @click="movePeriod(1)">›</button>
          <button v-if="!compact" type="button" @click="goToToday">Hoje</button>
        </div>
        <BaseSelect v-model="dateMode" label="Data" class="annual-select">
          <option value="due_date">Vencimento / recebimento</option>
          <option value="competence">Competência</option>
        </BaseSelect>
        <label v-if="!compact && !simple" class="annual-check"
          ><input v-model="showMetadata" type="checkbox" :disabled="compact" /> Vencimentos e limites</label
        >
        <template v-if="compact || simple">
          <div class="annual-mobile-actions" aria-label="Ações da matriz">
            <button type="button" :aria-pressed="selection.enabled.value" @click="toggleMobileSelection">{{ selection.enabled.value ? 'Concluir seleção' : 'Selecionar células' }}</button>
            <button type="button" :aria-pressed="expanded" @click="expanded = !expanded; mobileOptionsOpen = false">{{ expanded ? 'Reduzir' : 'Ampliar' }}</button>
          </div>
          <details class="annual-mobile-help">
            <summary>Como usar a matriz</summary>
            <p>Deslize para comparar meses. Toque em um valor para ver seus lançamentos e editar. A sobra prevista usa receitas menos despesas cadastradas; não é saldo bancário. ✓ quitado · ○ pendente · ◐ parcial · ! revisar · — sem lançamento.</p>
          </details>
        </template>
      </div>
      <div class="annual-context">
        <strong>{{ periodLabel }}</strong
        ><span
          ><template v-if="!compact && !simple">{{ visibleMonths.length }} meses visíveis · valores em R$ · </template><template v-else>R$ · </template>
          {{ dateMode === 'competence' ? 'por competência' : 'por vencimento' }}</span
        ><span v-if="search.trim()">Busca mostra linhas; resumo mantém todo o período.</span
        ><button v-if="hiddenInPeriod.length" type="button" @click="showAllMonths">
          Mostrar {{ hiddenInPeriod.length }} mês(es) oculto(s)
        </button>
        <button v-if="simple && !compact" type="button" @click="mobileSummaryOpen = true">Todos os totais</button>
        <span v-if="simple && !search.trim()" class="annual-simple-hint">{{ compact ? 'Toque' : 'Clique' }} em um valor para ver detalhes.</span>
      </div>
      <p v-if="error" class="annual-error" role="alert">{{ error }}</p>

      <div ref="scrollHost" class="annual-scroll annual-scroll--compact" :style="{ maxHeight: tableHeight ? `${tableHeight}px` : undefined, '--annual-mobile-month-width': `${mobileColumnWidth}px`, '--annual-mobile-table-width': `${124 + visibleMonths.length * mobileColumnWidth}px` }" @scroll="onMatrixScroll">
        <table class="annual-table">
          <caption class="sr-only">
            Despesas, cartões, receitas e resultado mensal de
            {{
              periodLabel
            }}. Totais incluem o período inteiro, mesmo com busca ou meses ocultos.
          </caption>
          <thead>
            <tr>
              <th class="annual-name" scope="col">{{ simple ? 'Descrição' : 'Descrição / conta' }}</th>
              <th v-if="metadataVisible" class="annual-day" scope="col">Dia</th>
              <th v-if="metadataVisible" class="annual-limit" scope="col">Limite</th>
              <th
                v-for="month in visibleMonths"
                :key="month"
                class="annual-month"
                :data-month="month"
                :class="{ 'annual-current': month === todayMonth, 'annual-mobile-current': compact && month === mobileMonth }"
                scope="col"
              >
                <div class="annual-month-heading">
                  <span>{{ shortMonth(month) }}</span
                  ><FinanceRowActions v-if="!simple" :label="longMonth(month)" @action="monthAction(month, $event)" />
                </div>
                <span
                  v-if="coverage(month)"
                  class="annual-coverage"
                  :title="`${coverage(month)} no saldo. Confira se os registros estão completos.`"
                  >{{ coverage(month) }}</span
                >
              </th>
              <th v-if="!simple" class="annual-total" scope="col">Período</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in groups" :key="group.id">
              <tr class="annual-group">
                <th class="annual-name" :colspan="metadataSpan" scope="row">
                  <button
                    type="button"
                    :aria-expanded="!collapsed.includes(group.id)"
                    @click="toggleGroup(group.id)"
                  >
                    {{ collapsed.includes(group.id) ? '▸' : '▾' }} {{ compact || simple ? mobileGroupLabels[group.id] : group.label }}
                    <span v-if="!simple">({{ group.rows.length }})</span></button
                  ><button
                    v-if="!simple"
                    type="button"
                    class="annual-group-add"
                    :aria-label="`Adicionar ${group.id === 'income' ? 'receita' : 'despesa'}`"
                    @click="newEntry(undefined, undefined, group.id === 'income' ? 'income' : 'expense')"
                  >
                    +
                  </button>
                </th>
                <td v-for="month in visibleMonths" :key="month" class="annual-month">
                  {{ number(groupAmount(group.id, month)) }}
                </td>
                <td v-if="!simple" class="annual-total">{{ number(groupTotal(group.id)) }}</td>
              </tr>
              <template v-if="!collapsed.includes(group.id)">
                <tr
                  v-for="row in group.rows"
                  :key="row.id"
                  :class="{ 'annual-excluded': row.group === 'excluded' }"
                >
                  <th class="annual-name" scope="row">
                    <div class="annual-row-name">
                      <button
                        type="button"
                        class="annual-row-title"
                        :title="[row.title, rowCaption(row)].filter(Boolean).join(' · ')"
                        @click="inspectRow(row)"
                      >
                        {{ row.title }}
                      </button>
                      <div v-if="!simple" class="annual-row-menu" @keydown.esc.stop>
                        <button type="button" class="annual-row-trigger" :popovertarget="rowMenuId(row)" :aria-label="`Ações de ${row.title}`">⋮</button>
                        <div :id="rowMenuId(row)" popover class="annual-row-options" :aria-label="`Ações de ${row.title}`" @beforetoggle="placeRowMenu" @toggle="placeRowMenu">
                          <button type="button" autofocus @click="moveRow(row, -1, $event)">↑ Mover para cima</button
                          ><button type="button" @click="moveRow(row, 1, $event)">↓ Mover para baixo</button
                          ><button
                            v-if="row.group === 'cards' && row.account"
                            type="button"
                            @click="editAccount(row.account, $event)"
                          >
                            Editar cartão</button
                          ><button v-else type="button" @click="renameRow(row, $event)">Renomear…</button
                          ><button
                            v-if="row.entries.length"
                            type="button"
                            class="annual-danger"
                            @click="requestDeleteRow(row, $event)"
                          >
                            Excluir lançamentos…
                          </button>
                        </div>
                      </div>
                    </div>
                    <template v-if="!simple">
                      <span v-if="compact" class="annual-row-caption">{{ rowDueCaption(row) }}</span>
                      <span v-else-if="rowCaption(row)" class="annual-row-caption">{{ rowCaption(row) }}</span>
                    </template>
                  </th>
                  <td
                    v-if="metadataVisible"
                    class="annual-day"
                    :title="`Dias de vencimento / recebimento: ${row.dueDays.join(', ')}`"
                  >
                    {{ dueLabel(row) }}
                  </td>
                  <td v-if="metadataVisible" class="annual-limit">
                    {{
                      row.group === 'cards' && row.account?.limitTotal != null
                        ? number(row.account.limitTotal)
                        : '—'
                    }}
                  </td>
                  <td
                    v-for="month in visibleMonths"
                    :key="month"
                    class="annual-cell annual-month"
                    :class="{
                      'annual-current': month === todayMonth,
                      'annual-cell--selected': selection.isSelected(selectionCell(row, month)),
                      'annual-cell--active': activeCell?.rowId === row.id && activeCell.month === month,
                    }"
                    @pointerdown="beginDrag(row, month, $event)"
                    @pointerenter="extendDrag(row, month, $event)"
                  >
                    <button
                      type="button"
                      class="annual-value"
                      :class="{ 'annual-value--empty': !cell(row, month).entries.length }"
                      :data-row="row.id"
                      :data-month="month"
                      :aria-label="cellLabel(row, month)"
                      :title="cellLabel(row, month)"
                      :aria-pressed="
                        selection.enabled.value
                          ? selection.isSelected(selectionCell(row, month))
                          : activeCell?.rowId === row.id && activeCell.month === month
                      "
                      @click="selectCell(row, month, $event)"
                      @dblclick="!compact && editCell(row, month)"
                      @keydown="cellKeydown(row, month, $event)"
                    >
                      <span v-if="selection.enabled.value" class="annual-selection-mark" aria-hidden="true">{{
                        selection.isSelected(selectionCell(row, month)) ? '☑' : '☐'
                      }}</span
                      ><span
                        v-if="cell(row, month).entries.length"
                        class="annual-status"
                        :class="`annual-status--${cell(row, month).status}`"
                        aria-hidden="true"
                        >{{ statusSymbol(cell(row, month)) }}</span
                      ><span>{{
                        cell(row, month).entries.length ? number(cell(row, month).amount) : '—'
                      }}</span
                      ><sup v-if="!simple && cell(row, month).entries.length > 1">{{
                        cell(row, month).entries.length
                      }}</sup>
                    </button>
                  </td>
                  <td v-if="!simple" class="annual-total">{{ number(row.total) }}</td>
                </tr>
              </template>
            </template>
            <tr v-if="!groups.length">
              <td :colspan="metadataSpan + visibleMonths.length + (simple ? 0 : 1)" class="annual-empty">
                Nenhum lançamento neste período{{ search.trim() ? ' para esta busca' : '' }}.
              </td>
            </tr>
          </tbody>
          <tfoot v-if="!compact">
            <tr
              v-for="(summary, index) in visibleSummaryRows"
              :key="summary.key"
              :style="{ '--annual-footer-offset': `${(visibleSummaryRows.length - index - 1) * 24}px` }"
              :class="{ 'annual-net': summary.key === 'net' }"
            >
              <th class="annual-name" :colspan="metadataSpan" scope="row" :title="summary.description">
                {{ summary.label }}
              </th>
              <td
                v-for="month in visibleMonths"
                :key="month"
                :class="{
                  'annual-negative': summary.signed && model.summaries[month]![summary.key] < 0,
                  'annual-positive': summary.signed && model.summaries[month]![summary.key] > 0,
                }"
              >
                {{ hasCash(month) ? number(model.summaries[month]![summary.key]) : '—' }}
              </td>
              <td
                v-if="!simple"
                class="annual-total"
                :class="{
                  'annual-negative': summary.signed && periodSum(summary.key) < 0,
                  'annual-positive': summary.signed && periodSum(summary.key) > 0,
                }"
              >
                {{ number(periodSum(summary.key)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div v-if="!compact && !simple" class="annual-legend">
        <span>✓ Pago / recebido</span><span>○ Pendente</span><span>◐ Parcial</span><span>! Revisar</span
        ><span>— Sem lançamento</span><span>0,00 Valor cadastrado</span>
      </div>
      <p v-if="!compact && !simple" class="annual-note">
        Sobra prevista = receitas − despesas cadastradas. Meses sinalizados podem estar incompletos. Quitados
        considera o status dos itens pela data escolhida; não é saldo bancário. Clique para ver detalhes;
        duplo clique ou F2 para editar.
      </p>
      <div v-if="selection.enabled.value" class="annual-selection-summary" :class="{ 'annual-selection-summary--mobile': compact }" :style="compact ? mobileDockStyle : undefined" role="status" aria-live="polite">
        <span
          >{{ selection.count.value }} célula(s) selecionada(s) ·
          <strong>Soma: {{ fmt(selection.sum.value) }}</strong></span
        ><button type="button" @click="selection.clear">Limpar seleção</button>
        <button v-if="compact" type="button" @click="selection.enabled.value = false">Concluir</button>
      </div>

      <div v-if="compact && model.summaries[mobileMonth]" class="annual-mobile-summary" :style="mobileDockStyle">
        <button type="button" class="annual-mobile-summary-title" @click="mobileSummaryOpen = true">Resumo · {{ shortMonth(mobileMonth) }} <span>Ver todos os totais ↑</span></button>
        <div class="annual-mobile-summary-values">
          <button type="button" @click="mobileSummaryOpen = true"><span>Receitas</span><strong>{{ number(model.summaries[mobileMonth]!.income) }}</strong></button>
          <button type="button" @click="mobileSummaryOpen = true"><span>Despesas</span><strong>{{ number(model.summaries[mobileMonth]!.expense) }}</strong></button>
          <button type="button" :class="model.summaries[mobileMonth]!.net < 0 ? 'annual-negative' : 'annual-positive'" @click="mobileSummaryOpen = true"><span>Sobra prevista</span><strong>{{ number(model.summaries[mobileMonth]!.net) }}</strong></button>
        </div>
      </div>

      <Teleport to="body"><component
        :is="compact ? 'dialog' : 'section'"
        v-if="activeRow && activeCell && !selection.enabled.value"
        ref="detailHost"
        class="annual-detail"
        :class="{ 'annual-detail--mobile': compact }"
        aria-label="Composição da célula"
        :aria-modal="compact ? true : undefined"
        @cancel="activeCell = null"
        @click="dismissDetailBackdrop"
        @keydown.esc.stop
      >
        <header>
          <div>
            <h3>{{ activeRow.title }} · {{ longMonth(activeCell.month) }}</h3>
            <p v-if="activeRow.account && activeRow.group !== 'cards'">Conta: {{ activeRow.account.name }}</p>
            <p>
              {{ cell(activeRow, activeCell.month).entries.length }} lançamento(s) ·
              {{ fmt(cell(activeRow, activeCell.month).amount)
              }}<template v-if="cell(activeRow, activeCell.month).status === 'mixed'">
                · quitado {{ fmt(cell(activeRow, activeCell.month).paid) }} · pendente
                {{ fmt(cell(activeRow, activeCell.month).pending) }}</template
              >
            </p>
          </div>
          <button type="button" :autofocus="compact" aria-label="Fechar detalhes da célula" @click="activeCell = null">×</button>
        </header>
        <p>{{ rowDueCaption(activeRow) }} · Total do período: {{ fmt(activeRow.total) }}</p>
        <div v-if="activeRow.group === 'cards' && activeRow.account" class="annual-card-info">
          <span
            >Limite
            <strong>{{
              activeRow.account.limitTotal != null ? fmt(activeRow.account.limitTotal) : 'Não cadastrado'
            }}</strong></span
          ><span
            >Fecha
            <strong>{{
              cardDayLabel(activeRow.account.closingDay)
            }}</strong></span
          ><span
            >Vence
            <strong>{{
              cardDayLabel(activeRow.account.dueDay)
            }}</strong></span
          ><span
            >Comprometido registrado <strong>{{ fmt(cardCommitment(activeRow).committed) }}</strong></span
          ><span
            >Disponível estimado
            <strong>{{
              cardCommitment(activeRow).available != null
                ? fmt(cardCommitment(activeRow).available!)
                : 'Sem limite'
            }}</strong></span
          ><small
            >Estimativa com todas as despesas pendentes do cartão, inclusive parcelas futuras fora do período.
            Não é uma consulta ao banco.</small
          >
        </div>
        <ul v-if="cell(activeRow, activeCell.month).entries.length" class="annual-entry-list">
          <li v-for="entry in cell(activeRow, activeCell.month).entries" :key="entry.id">
            <div>
              <strong>{{ entry.title }}</strong
              ><small
                >{{ entry.kind === 'income' ? 'Recebimento' : 'Vencimento' }}: {{ formatDate(entry.dueDate)
                }}<template v-if="entry.installmentTotal">
                  · parcela {{ entry.installmentIndex }}/{{ entry.installmentTotal }}</template
                ><template v-if="entry.competenceDate !== entry.dueDate"> · competência {{ formatDate(entry.competenceDate) }}</template><template v-if="activeRow.group === 'excluded'"> · fora do saldo</template></small
              >
              <small v-if="entry.description">{{ entry.description }}</small>
            </div>
            <span class="annual-entry-amount">{{ fmt(entry.amount) }}</span
            ><span>{{ entryStatusLabel(entry) }}</span
            ><button type="button" :disabled="busy" @click="openEditor(entry)">Editar</button
            ><button type="button" :disabled="busy" @click="toggleEntryStatus(entry)">
              {{
                entry.status === 'paid' ? 'Marcar pendente' : entry.kind === 'income' ? 'Marcar recebido' : 'Marcar pago'
              }}
            </button>
          </li>
        </ul>
        <p v-else class="annual-note">Não há lançamento cadastrado nesta célula.</p>
        <footer>
          <button type="button" @click="newEntry(activeRow, activeCell.month)">+ Adicionar lançamento</button
          ><button
            v-if="cell(activeRow, activeCell.month).entries.length === 1"
            type="button"
            @click="editCell(activeRow, activeCell.month)"
          >
            Editar lançamento</button
          ><button
            type="button"
            @click="monthAction(activeCell.month, 'view')"
          >
            Ver o mês na Lista
          </button>
        </footer>
      </component></Teleport>

      <Teleport to="body">
        <dialog v-if="compact || simple" ref="summaryDialog" class="annual-mobile-totals" aria-label="Resumo financeiro da planilha" @cancel="mobileSummaryOpen = false" @click="dismissSummaryBackdrop" @keydown.esc.stop>
          <header><h3>Resumo financeiro</h3><button type="button" autofocus aria-label="Fechar resumo" @click="mobileSummaryOpen = false">×</button></header>
          <table>
            <thead><tr><th scope="col">Valores em R$</th><th scope="col">{{ shortMonth(mobileMonth) }}</th><th scope="col">Período</th></tr></thead>
            <tbody><tr v-for="summary in summaryRows" :key="summary.key"><th scope="row">{{ summary.label }}</th><td>{{ number(model.summaries[mobileMonth]?.[summary.key] ?? 0) }}</td><td>{{ number(periodSum(summary.key)) }}</td></tr></tbody>
          </table>
          <p>{{ periodLabel }} · {{ dateMode === 'competence' ? 'por competência' : 'por vencimento' }}.</p>
          <p v-if="coverage(mobileMonth)">{{ coverage(mobileMonth) }} no mês. Confira se os registros estão completos.</p>
          <p>Totais incluem todo o período, mesmo com busca ou meses ocultos. Sobra prevista e resultado quitado não são saldo bancário.</p>
        </dialog>
      </Teleport>
    </template>
    <template v-else
      ><div class="annual-list-nav">
        <button
          type="button"
          aria-label="Mês anterior"
          @click="selectedMonth = shiftMonth(selectedMonth, -1)"
        >
          ‹</button>
        <BaseMonthPicker v-model="selectedMonth" label="Mês" />
        <button type="button" aria-label="Próximo mês" @click="selectedMonth = shiftMonth(selectedMonth, 1)">
          ›
        </button>
      </div>
      <FinanceEntryGrid :month="selectedMonth"
    /></template>

    <FinanceEntryEditorModal
      v-if="editorEntry"
      :open="true"
      :entry="editorEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      :allow-recurrence="isNewEntry"
      :creating="isNewEntry"
      :busy="busy"
      @close="editorEntry = null"
      @save="saveEditor"
      @delete="requestDeleteEntry"
      ><template #context
        ><p v-if="error" class="annual-error" role="alert">{{ error }}</p>
        <p v-if="busy" role="status">Salvando…</p></template
      ></FinanceEntryEditorModal
    >
    <AccountEditorSheet
      v-if="accountEditor"
      :open="true"
      :account="accountEditor"
      @close="accountEditor = null"
      @save="saveAccount"
    />
    <Teleport to="body"
      ><div
        v-if="dialog"
        class="annual-dialog-overlay"
        @click.self="dialog = null"
        @keydown.esc.stop="dialog = null"
      >
        <section class="annual-dialog" role="dialog" aria-modal="true" aria-labelledby="annual-dialog-title">
          <h3 id="annual-dialog-title">
            {{
              dialog.type === 'rename'
                ? 'Renomear despesa / receita'
                : dialog.type === 'clear'
                  ? 'Zerar valores do mês'
                  : 'Excluir lançamentos'
            }}
          </h3>
          <p>{{ dialog.message }}</p>
          <label v-if="dialog.type === 'rename'"
            >Novo nome <input v-model="renameValue" type="text" @keydown.enter.prevent="confirmDialog"
          /></label>
          <p v-if="error" class="annual-error" role="alert">{{ error }}</p>
          <footer>
            <button type="button" :disabled="busy" @click="dialog = null">Cancelar</button
            ><button
              type="button"
              :disabled="busy || (dialog.type === 'rename' && !renameValue.trim())"
              :class="{ 'annual-danger': dialog.type === 'delete' }"
              @click="confirmDialog"
            >
              {{
                busy
                  ? 'Salvando…'
                  : dialog.type === 'rename'
                    ? 'Renomear'
                    : dialog.type === 'clear'
                      ? 'Zerar valores'
                      : 'Excluir'
              }}
            </button>
          </footer>
        </section>
      </div></Teleport
    >
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { buildFinanceMatrix, matrixCardCommitment, matrixDate, matrixMonths, sumMoney } from '#shared/matrix'
import type { MatrixGroup, MatrixRow, MatrixValue } from '#shared/matrix'
import type { Account, EntryKind, FinanceEntry, PeriodMode } from '#shared/types'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useMatrixSelection, type MatrixCell } from '~/features/finance/composables/useMatrixSelection'
import FinanceEntryGrid from './FinanceEntryGrid.vue'
import FinanceEntryEditorModal from './FinanceEntryEditorModal.vue'
import FinanceRowActions from './FinanceRowActions.vue'
import AccountEditorSheet from './AccountEditorSheet.vue'
import BaseMonthPicker from '~/components/base/BaseMonthPicker.vue'
import BaseSelect from '~/components/base/BaseSelect.vue'
import BaseDropdown from '~/components/base/BaseDropdown.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const store = useFinanceStore()
const currency = useCurrency()
const fmt = (amount: number) => currency.format(amount)
const { formatDate } = useDateFormat()
const numberFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const number = (amount: number) => numberFormatter.format(amount)
const dateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: store.settings.timezone,
  year: 'numeric',
  month: '2-digit',
}).formatToParts(new Date())
const todayMonth = `${dateParts.find((part) => part.type === 'year')!.value}-${dateParts.find((part) => part.type === 'month')!.value}`
type MatrixView = 'simple' | 'matrix' | 'list'
const view = ref<MatrixView>('simple')
const simple = computed(() => view.value === 'simple')
const lastMatrixView = ref<'simple' | 'matrix'>('simple')
const viewOptions: { value: MatrixView; label: string }[] = [
  { value: 'simple', label: 'Matriz simples' },
  { value: 'matrix', label: 'Matriz completa' },
  { value: 'list', label: 'Lista' },
]
const windowMode = ref<'rolling' | 'year'>('rolling')
const anchorMonth = ref(todayMonth)
const year = ref(Number(todayMonth.slice(0, 4)))
const dateMode = ref<PeriodMode>('due_date')
const showMetadata = ref(true),
  expanded = ref(false),
  compact = ref(false)
const search = ref(''),
  error = ref(''),
  busy = ref(false)
const hiddenMonths = ref<string[]>([]),
  rowOrder = ref<string[]>([])
const collapsed = ref<MatrixGroup[]>(['excluded'])
const selectedMonth = ref(todayMonth)
const scrollHost = ref<HTMLElement | null>(null)
const screenHost = ref<HTMLElement | null>(null)
const tableHeight = ref<number | null>(null)
const mobileOptionsOpen = ref(false)
const mobileSearchOpen = ref(false)
const mobileSummaryOpen = ref(false)
const mobileMonth = ref(todayMonth)
const mobileColumnWidth = ref(120)
const mobileDockStyle = ref<Record<string, string>>({})
const detailHost = ref<HTMLElement | null>(null)
const summaryDialog = ref<HTMLDialogElement | null>(null)
const startMonth = computed(() =>
  windowMode.value === 'year'
    ? `${Math.min(2199, Math.max(1900, year.value || Number(todayMonth.slice(0, 4))))}-01`
    : /^\d{4}-(0[1-9]|1[0-2])$/.test(anchorMonth.value)
      ? anchorMonth.value
      : todayMonth,
)
const months = computed(() => matrixMonths(startMonth.value))
const visibleMonths = computed(() => simple.value ? months.value : months.value.filter((month) => !hiddenMonths.value.includes(month)))
const hiddenInPeriod = computed(() => simple.value ? [] : months.value.filter((month) => hiddenMonths.value.includes(month)))
const model = computed(() => buildFinanceMatrix(store.entries, store.accounts, months.value, dateMode.value))
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const shortMonth = (month: string) => `${monthNames[Number(month.slice(5, 7)) - 1]}/${month.slice(2, 4)}`
const longMonth = (month: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00Z`),
  )
const periodLabel = computed(() => `${shortMonth(months.value[0]!)} a ${shortMonth(months.value.at(-1)!)}`)
const shiftMonth = (month: string, offset: number) => {
  const [y = 2026, m = 1] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 7)
}
const movePeriod = (direction: number) => {
  if (windowMode.value === 'year') year.value = Math.min(2199, Math.max(1900, year.value + direction))
  else anchorMonth.value = shiftMonth(startMonth.value, direction * 12)
}
const goToToday = () => {
  anchorMonth.value = todayMonth
  year.value = Number(todayMonth.slice(0, 4))
}
const metadataVisible = computed(() => showMetadata.value && !compact.value && !simple.value)
const metadataSpan = computed(() => (metadataVisible.value ? 3 : 1))
const cardDayLabel = (day: number | null) => day == null ? 'Não cadastrado'
  : Number.isInteger(day) && day >= 1 && day <= 31 ? `dia ${day}` : `Revisar (${day})`
const labels: Record<MatrixGroup, string> = {
  expenses: 'Contas e despesas',
  cards: 'Cartões · faturas registradas',
  income: 'Receitas',
  excluded: 'Fora do saldo · benefícios e excluídos',
}
const mobileGroupLabels: Record<MatrixGroup, string> = {
  expenses: 'Despesas', cards: 'Cartões', income: 'Receitas', excluded: 'Fora do saldo',
}
const groups = computed(() =>
  (Object.keys(labels) as MatrixGroup[])
    .map((id) => ({
      id,
      label: labels[id],
      rows: model.value.rows
        .filter(
          (row) =>
            row.group === id &&
            `${row.title} ${row.account?.name ?? ''} ${row.account?.owner ?? ''}`
              .toLocaleLowerCase('pt-BR')
              .includes(search.value.trim().toLocaleLowerCase('pt-BR')),
        )
        .sort((a, b) => {
          const ai = rowOrder.value.indexOf(a.id),
            bi = rowOrder.value.indexOf(b.id)
          return (ai < 0 ? Number.MAX_SAFE_INTEGER : ai) - (bi < 0 ? Number.MAX_SAFE_INTEGER : bi)
        }),
    }))
    .filter((group) => group.rows.length),
)
const cell = (row: MatrixRow, month: string): MatrixValue => row.cells[month]!
const dueLabel = (row: MatrixRow) =>
  row.dueDays.length > 2
    ? 'Vários'
    : row.dueDays.length
      ? row.dueDays.join('/')
      : (row.account?.dueDay ?? '—')
const rowCaption = (row: MatrixRow) =>
  row.group === 'cards'
    ? row.account?.owner &&
      !row.title.toLocaleLowerCase('pt-BR').includes(row.account.owner.toLocaleLowerCase('pt-BR'))
      ? row.account.owner
      : ''
    : row.account?.name
const rowDueCaption = (row: MatrixRow) => {
  const day = dueLabel(row)
  return day === '—' ? 'Sem vencimento' : `${row.kind === 'income' ? 'Recebe' : 'Vence'} ${day === 'Vários' ? 'em vários dias' : `dia ${day}`}`
}
const groupAmount = (group: MatrixGroup, month: string) =>
  sumMoney(model.value.rows.filter((row) => row.group === group).map((row) => cell(row, month).amount))
const groupTotal = (group: MatrixGroup) =>
  sumMoney(model.value.rows.filter((row) => row.group === group).map((row) => row.total))
const toggleGroup = (group: MatrixGroup) => {
  collapsed.value = collapsed.value.includes(group)
    ? collapsed.value.filter((id) => id !== group)
    : [...collapsed.value, group]
}
type SummaryField = 'expense' | 'income' | 'net' | 'pendingExpense' | 'pendingIncome' | 'settledNet'
const summaryRows: { key: SummaryField; label: string; description: string; signed?: boolean }[] = [
  {
    key: 'expense',
    label: 'Total de despesas',
    description: 'Despesas incluídas no saldo, pagas e pendentes.',
  },
  {
    key: 'income',
    label: 'Total de receitas',
    description: 'Receitas incluídas no saldo, recebidas e pendentes.',
  },
  {
    key: 'net',
    label: 'Sobra prevista',
    description: 'Receitas menos despesas cadastradas. Não é saldo bancário.',
    signed: true,
  },
  { key: 'pendingExpense', label: 'Ainda a pagar', description: 'Despesas pendentes ou em revisão.' },
  { key: 'pendingIncome', label: 'Ainda a receber', description: 'Receitas pendentes ou em revisão.' },
  {
    key: 'settledNet',
    label: 'Resultado quitado',
    description: 'Receitas recebidas menos despesas pagas, pela data escolhida.',
    signed: true,
  },
]
const visibleSummaryRows = computed(() => simple.value ? summaryRows.slice(0, 3) : summaryRows)
const periodSum = (key: SummaryField) =>
  sumMoney(months.value.map((month) => model.value.summaries[month]![key]))
const hasCash = (month: string) =>
  Boolean(model.value.summaries[month]!.expenseCount + model.value.summaries[month]!.incomeCount)
const coverage = (month: string) =>
  !hasCash(month)
    ? 'Sem registros'
    : !model.value.summaries[month]!.expenseCount
      ? 'Sem despesas'
      : !model.value.summaries[month]!.incomeCount
        ? 'Sem receitas'
        : ''
const statusSymbol = (value: MatrixValue) =>
  value.status === 'paid' ? '✓' : value.status === 'mixed' ? '◐' : value.status === 'review' ? '!' : '○'
const entryStatusLabel = (entry: FinanceEntry) =>
  entry.status === 'paid'
    ? entry.kind === 'income'
      ? 'Recebido'
      : 'Pago'
    : entry.status === 'review'
      ? 'Revisar'
      : 'Pendente'
const cellLabel = (row: MatrixRow, month: string) => {
  const value = cell(row, month)
  return `${row.title}, ${longMonth(month)}: ${value.entries.length ? `${fmt(value.amount)}, ${value.entries.length} lançamento(s), ${value.status === 'paid' ? (row.kind === 'income' ? 'recebido' : 'pago') : value.status === 'mixed' ? `parcial: quitado ${fmt(value.paid)}, pendente ${fmt(value.pending)}` : value.status === 'review' ? 'revisar' : 'pendente'}` : 'sem lançamento'}`
}

// Stable identities keep identically named expenses in different accounts separate.
const selectionCell = (row: MatrixRow, month: string): MatrixCell => ({
  kind: row.kind,
  title: row.id,
  month,
})
const selectableCells = computed(() =>
  groups.value
    .filter((group) => !collapsed.value.includes(group.id))
    .flatMap((group) =>
      group.rows.flatMap((row) => visibleMonths.value.map((month) => selectionCell(row, month))),
    ),
)
const selection = useMatrixSelection(
  selectableCells,
  (item) => model.value.rows.find((row) => row.id === item.title)?.cells[item.month]?.amount ?? 0,
)
const activeCell = ref<{ rowId: string; month: string } | null>(null)
const activeRow = computed(() => model.value.rows.find((row) => row.id === activeCell.value?.rowId) ?? null)
let drag: { from: MatrixCell; base: Set<string> } | null = null
let dragged = false
function beginDrag(row: MatrixRow, month: string, event: PointerEvent) {
  dragged = false
  if (selection.enabled.value && event.pointerType === 'mouse' && event.button === 0)
    drag = { from: selectionCell(row, month), base: new Set(selection.selected.value) }
}
function extendDrag(row: MatrixRow, month: string, event: PointerEvent) {
  if (!drag || !(event.buttons & 1) || drag.from.kind !== row.kind) return
  dragged = true
  selection.anchor.value = drag.from
  selection.range(drag.from, selectionCell(row, month), drag.base)
}
function endDrag() {
  drag = null
}
function selectCell(row: MatrixRow, month: string, event: MouseEvent) {
  if (dragged) {
    dragged = false
    return
  }
  if (selection.enabled.value) {
    const item = selectionCell(row, month)
    if (event.shiftKey && selection.anchor.value)
      selection.range(selection.anchor.value, item, selection.selected.value)
    else selection.toggle(item)
  } else {
    if (compact.value || simple.value) mobileMonth.value = month
    activeCell.value = { rowId: row.id, month }
  }
}
function inspectRow(row: MatrixRow) {
  const month = compact.value ? mobileMonth.value : row.cells[todayMonth]?.entries.length
    ? todayMonth
    : (visibleMonths.value.find((month) => cell(row, month).entries.length) ?? visibleMonths.value[0])
  if (month) activeCell.value = { rowId: row.id, month }
}
function cellKeydown(row: MatrixRow, month: string, event: KeyboardEvent) {
  if (event.key === 'F2') {
    event.preventDefault()
    editCell(row, month)
    return
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const rows = groups.value
    .filter((group) => !collapsed.value.includes(group.id))
    .flatMap((group) => group.rows)
  const nextRow =
    rows[
      rows.findIndex((item) => item.id === row.id) +
        (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0)
    ]
  const nextMonth =
    visibleMonths.value[
      visibleMonths.value.indexOf(month) +
        (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0)
    ]
  if (!nextRow || !nextMonth) return
  const target = [...(scrollHost.value?.querySelectorAll<HTMLButtonElement>('.annual-value') ?? [])].find(
    (button) => button.dataset.row === nextRow.id && button.dataset.month === nextMonth,
  )
  target?.focus()
}

const editorEntry = ref<FinanceEntry | null>(null),
  isNewEntry = ref(false)
function editCell(row: MatrixRow, month: string) {
  if (selection.enabled.value || busy.value) return
  activeCell.value = { rowId: row.id, month }
  const entries = cell(row, month).entries
  if (!entries.length) newEntry(row, month)
  else if (entries.length === 1) openEditor(entries[0]!)
}
function openEditor(entry: FinanceEntry) {
  if (compact.value) activeCell.value = null
  isNewEntry.value = false
  editorEntry.value = { ...entry }
  error.value = ''
}
function newEntry(row?: MatrixRow, month = selectedMonth.value, kind: EntryKind = row?.kind ?? 'expense') {
  if (compact.value) activeCell.value = null
  isNewEntry.value = true
  error.value = ''
  const chosenMonth = month || todayMonth,
    day = row?.dueDays[0] ?? row?.account?.dueDay ?? 1
  const maxDay = new Date(
    Date.UTC(Number(chosenMonth.slice(0, 4)), Number(chosenMonth.slice(5, 7)), 0),
  ).getUTCDate()
  const date = `${chosenMonth}-${String(Math.min(maxDay, Math.max(1, day))).padStart(2, '0')}`,
    now = new Date().toISOString()
  editorEntry.value = {
    id: crypto.randomUUID(),
    householdId: store.settings.id,
    title: row?.group === 'cards' ? `${row.title} - fatura` : (row?.title ?? ''),
    description: '',
    amount: 0,
    kind,
    accountId: row?.account?.id ?? null,
    categoryId: row?.entries[0]?.categoryId ?? null,
    ruleId: row?.group === 'cards' ? null : (row?.entries[0]?.ruleId ?? null),
    dueDate: date,
    competenceDate: date,
    status: 'pending',
    installmentIndex: null,
    installmentTotal: null,
    origin: 'manual',
    excludeFromCalc: row?.group === 'excluded',
    metadata: null,
    createdAt: now,
    updatedAt: now,
  }
}
async function persist(upserts: Partial<FinanceEntry>[], deletes: string[] = []): Promise<boolean> {
  if (busy.value) return false
  busy.value = true
  error.value = ''
  try {
    await store.saveEntriesBatch({ upserts, deletes })
    return true
  } catch {
    error.value = 'Não foi possível salvar. Seus valores continuam disponíveis para tentar novamente.'
    return false
  } finally {
    busy.value = false
  }
}
async function saveEditor(values: Partial<FinanceEntry>[]) {
  const seed = editorEntry.value
  if (!seed) return
  const upserts = values.map((value) => ({
    ...(store.entries.find((entry) => entry.id === value.id) ?? seed),
    ...value,
  }))
  if (await persist(upserts)) editorEntry.value = null
}
const toggleEntryStatus = (entry: FinanceEntry) =>
  persist([{ ...entry, status: entry.status === 'paid' ? 'pending' : 'paid' }])
const cardCommitment = (row: MatrixRow) => matrixCardCommitment(store.entries, row.account!)
const accountEditor = ref<Account | null>(null)
const rowMenuPrefix = useId()
const rowMenuId = (row: MatrixRow) => `${rowMenuPrefix}-${encodeURIComponent(row.id)}`
function placeRowMenu(event: Event) {
  if ((event as ToggleEvent).newState !== 'open') return
  const menu = event.currentTarget as HTMLElement
  const trigger = menu.previousElementSibling as HTMLElement
  const rect = trigger.getBoundingClientRect()
  const width = Math.min(210, window.innerWidth - 24)
  const height = menu.offsetHeight || 180
  menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`
  menu.style.top = `${rect.bottom + height + 6 <= window.innerHeight - 12 ? rect.bottom + 6 : Math.max(12, rect.top - height - 6)}px`
}
function closeRowMenus() {
  screenHost.value?.querySelectorAll<HTMLElement>('.annual-row-options:popover-open').forEach(menu => menu.hidePopover())
}
function closeMenu(event: Event) {
  ;(event.currentTarget as HTMLElement).closest<HTMLElement>('[popover]')?.hidePopover()
}
function editAccount(account: Account, event: Event) {
  closeMenu(event)
  accountEditor.value = { ...account }
}
async function saveAccount(account: Partial<Account>) {
  if (busy.value) return
  busy.value = true
  try {
    await store.saveAccount(account)
    accountEditor.value = null
  } catch {
    error.value = 'Não foi possível salvar o cartão.'
  } finally {
    busy.value = false
  }
}
function moveRow(row: MatrixRow, direction: number, event: Event) {
  closeMenu(event)
  const rows = groups.value.find((group) => group.id === row.group)!.rows.map((item) => item.id)
  const index = rows.indexOf(row.id),
    target = index + direction
  if (target < 0 || target >= rows.length) return
  rows.splice(index, 1)
  rows.splice(target, 0, row.id)
  rowOrder.value = [...rowOrder.value.filter((id) => !rows.includes(id)), ...rows]
}
const dialog = ref<{ type: 'rename' | 'delete' | 'clear'; ids: string[]; message: string } | null>(null)
const renameValue = ref('')
function renameRow(row: MatrixRow, event: Event) {
  closeMenu(event)
  renameValue.value = row.title
  dialog.value = {
    type: 'rename',
    ids: row.entries.map((entry) => entry.id),
    message: `Altera o nome dos ${row.entries.length} lançamentos deste grupo, inclusive fora do período. Outras contas e grupos permanecem separados.`,
  }
}
function requestDeleteRow(row: MatrixRow, event: Event) {
  closeMenu(event)
  dialog.value = {
    type: 'delete',
    ids: row.entries.map((entry) => entry.id),
    message: `Excluir os ${row.entries.length} lançamentos de “${row.title}”, inclusive fora do período? Esta ação não pode ser desfeita.`,
  }
}
function requestDeleteEntry(id: string) {
  if (isNewEntry.value) {
    editorEntry.value = null
    return
  }
  dialog.value = {
    type: 'delete',
    ids: [id],
    message: 'Excluir este lançamento? Esta ação não pode ser desfeita.',
  }
}
async function confirmDialog() {
  const current = dialog.value
  if (!current) return
  if (current.type === 'rename' && !renameValue.value.trim()) return
  const records = store.entries.filter((entry) => current.ids.includes(entry.id))
  const upserts =
    current.type === 'rename'
      ? records.map((entry) => ({ ...entry, title: renameValue.value.trim() }))
      : current.type === 'clear'
        ? records.map((entry) => ({ ...entry, amount: 0 }))
        : []
  if (await persist(upserts, current.type === 'delete' ? current.ids : [])) {
    dialog.value = null
    if (current.type === 'delete') editorEntry.value = null
  }
}
function monthAction(month: string, action: 'view' | 'hide' | 'hidePrevious' | 'clear') {
  if (action === 'view') {
    selectedMonth.value = month
    view.value = 'list'
  }
  if (action === 'hide') hiddenMonths.value = [...new Set([...hiddenMonths.value, month])]
  if (action === 'hidePrevious')
    hiddenMonths.value = [...new Set([...hiddenMonths.value, ...months.value.filter((key) => key < month)])]
  if (action === 'clear') {
    const records = store.entries.filter((entry) => matrixDate(entry, dateMode.value).startsWith(month))
    dialog.value = {
      type: 'clear',
      ids: records.map((entry) => entry.id),
      message: `Zerar os valores dos ${records.length} lançamentos de ${longMonth(month)}, pela data escolhida? Os registros serão preservados.`,
    }
  }
}
function showAllMonths() {
  hiddenMonths.value = hiddenMonths.value.filter((month) => !months.value.includes(month))
}
function escapeScreen() {
  if (expanded.value) expanded.value = false
  else {
    activeCell.value = null
    selection.clear()
  }
}
function canMoveMobile(direction: number) {
  const index = visibleMonths.value.indexOf(mobileMonth.value) + direction
  return index >= 0 && index < visibleMonths.value.length
}
function moveMobileMonth(direction: number) {
  const month = visibleMonths.value[visibleMonths.value.indexOf(mobileMonth.value) + direction]
  if (month) void chooseMobileMonth(month)
}
async function chooseMobileMonth(month: string) {
  if (!months.value.includes(month)) {
    if (windowMode.value === 'year') year.value = Number(month.slice(0, 4))
    else anchorMonth.value = month
  }
  hiddenMonths.value = hiddenMonths.value.filter((hidden) => hidden !== month)
  mobileMonth.value = month
  await nextTick()
  alignMobileMonth()
}
function alignMobileMonth() {
  if (!compact.value || !scrollHost.value) return
  const index = Math.max(0, visibleMonths.value.indexOf(mobileMonth.value))
  const offset = Math.min(index, Math.max(0, visibleMonths.value.length - 2)) * mobileColumnWidth.value
  scrollHost.value.scrollTo({ left: offset, behavior: 'auto' })
}
function onMatrixScroll() {
  closeRowMenus()
  if (!compact.value || !scrollHost.value || !mobileColumnWidth.value) return
  const firstIndex = Math.min(visibleMonths.value.length - 1, Math.round(scrollHost.value.scrollLeft / mobileColumnWidth.value))
  const currentIndex = visibleMonths.value.indexOf(mobileMonth.value)
  if (currentIndex < firstIndex || currentIndex > firstIndex + 1) {
    mobileMonth.value = visibleMonths.value[firstIndex] ?? visibleMonths.value[0] ?? months.value[0]!
  }
}
function toggleMobileSelection() {
  activeCell.value = null
  selection.enabled.value = !selection.enabled.value
  mobileOptionsOpen.value = false
}
function outsideDialog(event: MouseEvent, element: HTMLElement | null) {
  if (!element || event.target !== element) return false
  const rect = element.getBoundingClientRect()
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
}
function dismissDetailBackdrop(event: MouseEvent) {
  if (compact.value && outsideDialog(event, detailHost.value)) activeCell.value = null
}
function dismissSummaryBackdrop(event: MouseEvent) {
  if (outsideDialog(event, summaryDialog.value)) mobileSummaryOpen.value = false
}
watch([activeCell, compact, () => selection.enabled.value], async () => {
  await nextTick()
  if (detailHost.value instanceof HTMLDialogElement && !detailHost.value.open) detailHost.value.showModal()
})
watch(mobileSummaryOpen, async (open) => {
  await nextTick()
  if (open && summaryDialog.value && !summaryDialog.value.open) summaryDialog.value.showModal()
  else if (!open) summaryDialog.value?.close()
})
watch(visibleMonths, async (visible) => {
  if (!visible.includes(mobileMonth.value)) mobileMonth.value = visible[0] ?? months.value[0]!
  await nextTick()
  updateTableHeight()
  alignMobileMonth()
})
watch([startMonth, dateMode], () => {
  activeCell.value = null
  selectedMonth.value = startMonth.value
})
watch(view, () => {
  if (view.value !== 'list') lastMatrixView.value = view.value
  selection.enabled.value = false
  activeCell.value = null
  mobileOptionsOpen.value = false
  mobileSearchOpen.value = false
  mobileSummaryOpen.value = false
})
const preferenceKey = computed(() => `finance-annual-matrix:${store.settings.id}`)
let compactQuery: MediaQueryList | null = null
let screenObserver: ResizeObserver | null = null
function updateTableHeight() {
  if (!scrollHost.value) return
  const navHeight = compact.value && !expanded.value
    ? document.querySelector('.app-mobile-nav')?.getBoundingClientRect().height ?? 56 : 0
  const summaryHeight = compact.value
    ? screenHost.value?.querySelector('.annual-mobile-summary')?.getBoundingClientRect().height ?? 74 : 0
  const selectionHeight = compact.value && selection.enabled.value
    ? screenHost.value?.querySelector('.annual-selection-summary')?.getBoundingClientRect().height ?? 64 : 0
  const rect = scrollHost.value.getBoundingClientRect()
  const previousColumnWidth = mobileColumnWidth.value
  mobileColumnWidth.value = Math.max(76, (scrollHost.value.clientWidth - 124) / 2)
  if (compact.value && Math.abs(previousColumnWidth - mobileColumnWidth.value) > 0.5) nextTick(alignMobileMonth)
  mobileDockStyle.value = {
    '--annual-mobile-bottom': `${navHeight}px`,
    '--annual-mobile-summary-height': `${summaryHeight}px`,
    left: '8px', width: 'calc(100% - 16px)',
  }
  const bottomSpace = compact.value ? navHeight + summaryHeight + selectionHeight + 8 : 30
  const minimumHeight = compact.value ? (mobileOptionsOpen.value ? 1 : 96) : 240
  tableHeight.value = Math.max(minimumHeight, Math.floor(
    (window.visualViewport?.height ?? window.innerHeight) - rect.top - bottomSpace,
  ))
}
watch(scrollHost, (host, previous) => {
  if (previous) screenObserver?.unobserve(previous)
  if (host) screenObserver?.observe(host)
  nextTick(() => { updateTableHeight(); alignMobileMonth() })
})
const syncCompact = () => {
  compact.value = compactQuery?.matches ?? false
  if (!compact.value) mobileSummaryOpen.value = false
  nextTick(() => { updateTableHeight(); alignMobileMonth() })
}
onMounted(() => {
  window.addEventListener('resize', closeRowMenus)
  screenObserver = new ResizeObserver(updateTableHeight)
  if (screenHost.value) screenObserver.observe(screenHost.value)
  if (scrollHost.value) screenObserver.observe(scrollHost.value)
  window.addEventListener('resize', updateTableHeight)
  window.visualViewport?.addEventListener('resize', updateTableHeight)
  watch([expanded, view, mobileOptionsOpen, mobileSearchOpen, () => selection.enabled.value], () => nextTick(updateTableHeight))
  nextTick(updateTableHeight)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  compactQuery = window.matchMedia('(max-width: 767px)')
  syncCompact()
  compactQuery.addEventListener('change', syncCompact)
  watch(
    preferenceKey,
    (key) => {
      try {
        const preferences = JSON.parse(localStorage.getItem(key) ?? '{}')
        hiddenMonths.value = Array.isArray(preferences.hiddenMonths)
          ? preferences.hiddenMonths.filter(
              (value: unknown) => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value),
            )
          : []
        rowOrder.value = Array.isArray(preferences.rowOrder)
          ? preferences.rowOrder.filter((value: unknown) => typeof value === 'string')
          : []
        showMetadata.value = preferences.showMetadata !== false
        view.value = preferences.matrixView === 'matrix' ? 'matrix' : 'simple'
        lastMatrixView.value = view.value
      } catch {
        /* Preferências inválidas não impedem abrir a planilha. */
      }
    },
    { immediate: true },
  )
  watch([hiddenMonths, rowOrder, showMetadata, lastMatrixView], () => {
    try {
      localStorage.setItem(
        preferenceKey.value,
        JSON.stringify({
          hiddenMonths: hiddenMonths.value,
          rowOrder: rowOrder.value,
          showMetadata: showMetadata.value,
          matrixView: lastMatrixView.value,
        }),
      )
    } catch {
      error.value = 'O navegador não permitiu salvar as preferências. Elas valem nesta sessão.'
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', closeRowMenus)
  screenObserver?.disconnect()
  window.removeEventListener('resize', updateTableHeight)
  window.visualViewport?.removeEventListener('resize', updateTableHeight)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  compactQuery?.removeEventListener('change', syncCompact)
})
</script>

<style scoped>
.annual-screen {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  min-width: 0;
  color: var(--text);
}
.annual-screen--expanded {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--bg);
  padding: var(--ds-space-4);
  overflow-y: auto;
}
.annual-toolbar,
.annual-controls,
.annual-context,
.annual-period-nav,
.annual-legend,
.annual-list-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.annual-mobile-actions { display: flex; gap: var(--ds-space-3); }
.annual-toolbar button,
.annual-mobile-toolbar button,
.annual-mobile-month-nav button,
.annual-mobile-totals button,
.annual-controls button,
.annual-detail button,
.annual-selection-summary button,
.annual-context button,
.annual-list-nav button,
.annual-dialog button {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px var(--ds-space-3);
  background: var(--surface2);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.annual-tabs {
  display: flex;
  gap: 4px;
}
.annual-tabs button[aria-pressed='true'],
.annual-toolbar .annual-primary,
.annual-mobile-toolbar .annual-primary {
  background: var(--primary);
  color: var(--on-primary);
}
.annual-toolbar > button[aria-pressed='true'] {
  border-color: var(--primary);
}
.annual-search {
  flex: 1;
  min-width: 180px;
}
.annual-search input {
  width: 100%;
}
.annual-search input,
.annual-controls select,
.annual-controls input:not([type='checkbox']),
.annual-list-nav input,
.annual-dialog input {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  background: var(--surface2);
  padding: 6px 8px;
  font: inherit;
  font-size: 12px;
  min-height: var(--ds-control-height);
}
.annual-controls {
  gap: 8px var(--ds-space-4);
}
.annual-controls .annual-select {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}
.annual-select :deep(> span) {
  font-size: 11px;
  font-weight: 400;
  color: var(--text2);
}
.annual-select :deep(.base-select__trigger) {
  height: var(--ds-control-height);
  padding: 0 8px;
  background: var(--surface2);
  font-size: 12px;
}
.annual-select :deep(.base-select__option) {
  padding: 8px;
  font-size: 12px;
  white-space: nowrap;
}
.annual-select :deep(.base-select__menu) {
  min-width: max-content;
}
.annual-controls label,
.annual-list-nav label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text2);
}
.annual-controls input[type='number'] {
  width: 78px;
}
.annual-controls input[type='checkbox'] {
  accent-color: var(--primary);
}
.annual-context {
  color: var(--text3);
  font-size: 11px;
  gap: 8px var(--ds-space-4);
}
.annual-context strong {
  color: var(--text);
  font-size: 12px;
}
.annual-scroll {
  max-height: max(360px, calc(100dvh - 210px));
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  isolation: isolate;
}
.annual-screen--expanded .annual-scroll {
  max-height: calc(100dvh - 170px);
}
.annual-table {
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  font-size: 12px;
  font-family: var(--ds-font-family-grid);
  font-variant-numeric: tabular-nums;
}
.annual-table th,
.annual-table td {
  padding: 3px 6px;
  border-bottom: 1px solid var(--border);
  text-align: right;
  white-space: nowrap;
  min-width: 72px;
  height: 24px;
  background: var(--surface);
}
.annual-table th {
  font-weight: 600;
}
.annual-table .annual-name {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 188px;
  width: 188px;
  max-width: 188px;
  text-align: left;
  border-right: 1px solid var(--border);
  white-space: normal;
}
.annual-table .annual-day {
  min-width: 38px;
  width: 38px;
  text-align: center;
  color: var(--text3);
  font-size: 11px;
}
.annual-table .annual-limit {
  min-width: 65px;
  width: 65px;
  color: var(--text2);
  font-size: 11px;
}
.annual-table .annual-total {
  position: sticky;
  right: 0;
  z-index: 2;
  min-width: 82px;
  border-left: 1px solid var(--border);
  background: var(--surface2);
  font-weight: 600;
}
.annual-table thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--surface2);
  color: var(--text2);
  font-size: 11px;
}
.annual-table thead .annual-name,
.annual-table thead .annual-total {
  z-index: 7;
}
.annual-month-heading {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1px;
}
.annual-month-heading :deep(.row-trigger) {
  padding: 0 2px;
  font-size: 12px;
}
.annual-coverage {
  display: block;
  font-size: 10px;
  color: var(--warning);
  font-weight: 400;
}
.annual-group th,
.annual-group td {
  background: var(--surface2);
  color: var(--text2);
  font-weight: 600;
}
.annual-group button {
  background: transparent;
  color: inherit;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-align: left;
}
.annual-group button span {
  color: var(--text3);
  font-size: 10px;
}
.annual-group .annual-name {
  min-width: 188px;
  max-width: none;
}
.annual-group .annual-group-add {
  float: right;
  padding: 0 5px;
}
.annual-row-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.annual-row-title {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  text-align: left;
  font: inherit;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  white-space: normal;
  overflow-wrap: anywhere;
}
.annual-row-caption {
  display: block;
  color: var(--text3);
  font-size: 10px;
  font-weight: 400;
}
.annual-row-trigger {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: var(--text3);
  padding: 2px 4px;
}
.annual-row-menu {
  flex-shrink: 0;
}
.annual-row-options {
  position: fixed;
  inset: auto;
  margin: 0;
  width: min(210px, calc(100vw - 24px));
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface2);
  box-shadow: var(--shadow-sm);
}
.annual-row-options:popover-open {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.annual-row-options button {
  font: inherit;
  font-size: 12px;
  padding: 7px;
  color: var(--text);
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
  white-space: normal;
}
.annual-row-options button:hover {
  background: var(--surface);
}
.annual-table .annual-cell {
  padding: 0;
}
.annual-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  width: 100%;
  min-height: 24px;
  padding: 3px 6px;
  background: transparent;
  color: var(--text);
  border: 0;
  font: inherit;
  cursor: pointer;
}
.annual-value sup {
  color: var(--text3);
  font-size: 9px;
}
.annual-value--empty {
  color: var(--text3);
}
.annual-status {
  font-size: 10px;
  color: var(--text3);
}
.annual-status--paid {
  color: var(--success);
}
.annual-status--mixed,
.annual-status--review {
  color: var(--warning);
}
.annual-value:hover {
  background: var(--surface2);
}
.annual-value:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}
.annual-table .annual-cell--active,
.annual-table .annual-cell--selected {
  box-shadow: inset 0 0 0 2px var(--primary);
  background: var(--primary-dim);
}
.annual-selection-mark {
  color: var(--primary);
  font-size: 10px;
}
.annual-table .annual-current {
  background: color-mix(in srgb, var(--primary) 5%, var(--surface));
}
.annual-table thead .annual-current {
  color: var(--primary);
  border-top: 2px solid var(--primary);
}
.annual-table tfoot th,
.annual-table tfoot td {
  position: sticky;
  bottom: var(--annual-footer-offset);
  z-index: 4;
  height: 24px;
  padding: 2px 6px;
  background: var(--surface2);
  border-top: 1px solid var(--border);
  border-bottom: 0;
  font-weight: 600;
}
.annual-table tfoot .annual-name,
.annual-table tfoot .annual-total {
  z-index: 6;
}
.annual-table tfoot .annual-name {
  white-space: nowrap;
}
.annual-table .annual-net th,
.annual-table .annual-net td {
  background: var(--surface);
  font-weight: 700;
}
.annual-table .annual-negative {
  color: var(--danger);
}
.annual-table .annual-positive {
  color: var(--success);
}
.annual-excluded .annual-row-title,
.annual-excluded .annual-value {
  color: var(--text3);
}
.annual-scroll--compact tbody td,
.annual-scroll--compact tbody th {
  padding-top: 2px;
  padding-bottom: 2px;
  height: 23px;
}
.annual-scroll--compact .annual-row-title {
  min-width: 0;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.annual-scroll--compact .annual-row-trigger {
  line-height: 16px;
  padding: 0 4px;
}
.annual-scroll--compact .annual-row-caption {
  line-height: 11px;
}
.annual-scroll--compact .annual-cell {
  padding: 0;
}
.annual-scroll--compact .annual-value {
  min-height: 23px;
}
.annual-empty {
  padding: var(--ds-space-7) !important;
  color: var(--text3);
  white-space: normal !important;
  text-align: center !important;
}
.annual-legend {
  font-size: 10px;
  color: var(--text3);
  gap: 6px var(--ds-space-4);
}
.annual-note {
  color: var(--text3);
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}
.annual-error {
  color: var(--danger);
  font-size: 12px;
}
.annual-selection-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--surface2);
  padding: var(--ds-space-3);
  border: 1px solid var(--primary);
  border-radius: var(--radius-sm);
  font-size: 12px;
}
.annual-detail {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 250;
  width: min(560px, calc(100vw - 40px));
  max-height: min(430px, 60dvh);
  overflow: auto;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: var(--ds-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}
.annual-detail header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--ds-space-3);
}
.annual-detail h3 {
  font-size: 13px;
  color: var(--text);
  margin: 0;
}
.annual-detail p {
  font-size: 12px;
  color: var(--text3);
  margin: 3px 0 0;
}
.annual-card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px var(--ds-space-5);
  font-size: 11px;
  color: var(--text3);
}
.annual-card-info strong {
  display: block;
  font-size: 12px;
  color: var(--text);
}
.annual-card-info small {
  flex-basis: 100%;
  font-size: 11px;
}
.annual-entry-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.annual-entry-list li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px var(--ds-space-4);
  padding: 8px 0;
  border-top: 1px solid var(--border);
  font-size: 11px;
}
.annual-entry-list li > div {
  flex: 1;
  min-width: 160px;
}
.annual-entry-list strong {
  font-weight: 500;
}
.annual-entry-list small {
  display: block;
  color: var(--text3);
  font-size: 11px;
}
.annual-entry-amount {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}
.annual-detail footer,
.annual-dialog footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.annual-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--overlay);
  padding: var(--ds-space-5);
}
.annual-dialog {
  width: min(440px, 100%);
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--ds-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}
.annual-dialog h3 {
  font-size: 16px;
  margin: 0;
}
.annual-dialog p,
.annual-dialog label {
  font-size: 13px;
}
.annual-dialog input {
  width: 100%;
  margin-top: 6px;
}
.annual-dialog footer {
  justify-content: flex-end;
}
.annual-danger {
  color: var(--danger) !important;
}
.annual-mobile-totals:not([open]) { display: none; }
.annual-mobile-totals {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(620px, calc(100vw - 24px));
  max-height: 80dvh;
  overflow: auto;
  padding: var(--ds-space-5);
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
}
.annual-mobile-totals::backdrop { background: var(--overlay); }
.annual-mobile-totals header { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); }
.annual-mobile-totals header button { min-width: 34px; min-height: 34px; font-size: 20px; padding: 4px; }
.annual-mobile-totals h3 { font-size: 16px; }
.annual-mobile-totals table { width: 100%; border-collapse: collapse; margin-block: var(--ds-space-5); font-size: 12px; font-variant-numeric: tabular-nums; }
.annual-mobile-totals th,
.annual-mobile-totals td { padding: var(--ds-space-3); border-bottom: 1px solid var(--border); text-align: right; }
.annual-mobile-totals th:first-child { width: 40%; text-align: left; }
.annual-mobile-totals td { white-space: nowrap; }
.annual-mobile-totals p { color: var(--text3); font-size: 11px; line-height: 1.5; margin-block: var(--ds-space-2); }
@media (min-width: 768px) {
  .annual-screen--simple .annual-table th,
  .annual-screen--simple .annual-table td { min-width: 68px; padding-inline: 4px; }
  .annual-screen--simple .annual-table .annual-name { min-width: 168px; width: 168px; max-width: 168px; }
  .annual-screen--simple .annual-value { padding-inline: 4px; gap: 2px; }
}
@media (max-width: 767px) {
  .annual-mobile-view { flex: 1; max-width: 168px; min-width: 0; margin-right: auto; }
  .annual-mobile-view :deep(.bd-trigger) { height: 34px; padding: 0 8px; gap: 6px; font-size: 12px; }
  .annual-mobile-toolbar,
  .annual-mobile-month-nav {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .annual-mobile-toolbar .annual-tabs { margin-right: auto; }
  .annual-mobile-toolbar > button,
  .annual-mobile-month-nav > button {
    min-width: 32px;
    min-height: 34px;
    padding: 4px 8px;
    font-size: 12px;
    position: relative;
  }
  .annual-mobile-toolbar > button { display: flex; align-items: center; justify-content: center; }
  .annual-mobile-toolbar .annual-primary { min-width: 36px; font-size: 20px; line-height: 1; }
  .annual-mobile-dot { position: absolute; top: 4px; right: 4px; width: 5px; height: 5px; border-radius: 50%; background: var(--primary); }
  .annual-mobile-month { flex: 1; min-width: 0; }
  .annual-mobile-month :deep(.month-picker__trigger) { width: 100%; min-width: 0; min-height: 34px; padding: 4px 8px; font-size: 12px; }
  .annual-mobile-search { display: flex; align-items: center; flex: none; order: 0; }
  .annual-mobile-search input { min-width: 0; }
  .annual-mobile-search button { padding: 4px 8px; border: 0; box-shadow: none; font-size: 20px; }
  .annual-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--ds-space-3);
    padding: var(--ds-space-3);
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: var(--radius-sm);
  }
  .annual-controls .annual-select {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: var(--ds-space-3);
    min-width: 0;
  }
  .annual-controls .annual-select :deep(> div) { min-width: 0; }
  .annual-controls .annual-select :deep(.base-select__trigger) { width: 100%; }
  .annual-period-nav {
    display: grid;
    grid-template-columns: 48px 30px minmax(0, 1fr) 30px;
    gap: var(--ds-space-3);
    min-width: 0;
  }
  .annual-period-label { color: var(--text2); font-size: 11px; }
  .annual-period-nav > button { padding-inline: 0; }
  .annual-period-nav :deep(.month-picker__trigger) { width: 100%; min-width: 0; min-height: 40px; padding: 6px; font-size: 11px; }
  .annual-period-nav :deep(.month-picker) { min-width: 0; }
  .annual-period-nav > label { min-width: 0; }
  .annual-period-nav input[type='number'] { width: 100%; }
  .annual-mobile-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--ds-space-3);
    border-top: 1px solid var(--border);
    padding-top: var(--ds-space-3);
  }
  .annual-mobile-actions button[aria-pressed='true'] { border-color: var(--primary); }
  .annual-mobile-help { width: 100%; font-size: 11px; color: var(--text3); }
  .annual-mobile-help summary { min-height: 28px; padding-block: 4px; cursor: pointer; }
  .annual-mobile-help p { margin-top: 4px; line-height: 1.5; }
  .annual-context { gap: 4px 8px; font-size: 10px; }
  .annual-context strong { font-size: 10px; }
  .annual-context > span { flex: 0 1 auto; }
  .annual-select :deep(.base-select__trigger) { height: var(--ds-control-height); }
  .annual-screen--expanded {
    padding: var(--ds-space-3);
  }
  .annual-toolbar button,
  .annual-controls button,
  .annual-detail button,
  .annual-list-nav button {
    min-height: 40px;
  }
  .annual-controls input:not([type='checkbox']),
  .annual-controls select {
    min-height: 40px;
  }
  .annual-scroll {
    max-height: max(320px, calc(100dvh - 310px));
    scroll-snap-type: x proximity;
    scroll-padding-inline-start: 124px;
    overscroll-behavior-x: contain;
  }
  .annual-table {
    width: var(--annual-mobile-table-width);
    min-width: var(--annual-mobile-table-width);
    table-layout: fixed;
  }
  .annual-table .annual-name,
  .annual-table .annual-group .annual-name {
    width: 124px;
    max-width: 124px;
    min-width: 124px;
  }
  .annual-table .annual-month {
    width: var(--annual-mobile-month-width);
    max-width: var(--annual-mobile-month-width);
    min-width: var(--annual-mobile-month-width);
  }
  .annual-table thead .annual-month { scroll-snap-align: start; }
  .annual-table .annual-total { display: none; }
  .annual-table .annual-mobile-current { background: var(--primary-dim); color: var(--primary); }
  .annual-table tbody .annual-name,
  .annual-table tbody td { height: 36px; padding-block: 2px; }
  .annual-table .annual-group .annual-name { white-space: normal; }
  .annual-group .annual-name > button:first-child { max-width: calc(100% - 26px); font-size: 11px; }
  .annual-group .annual-group-add { min-width: 26px; min-height: 30px; }
  .annual-scroll--compact .annual-row-title {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 14px;
    min-height: 28px;
  }
  .annual-scroll--compact .annual-row-trigger { min-height: 32px; min-width: 26px; padding: 0; }
  .annual-row-options button { min-height: 34px; }
  .annual-month-heading :deep(.row-trigger) { min-width: 26px; min-height: 28px; }
  .annual-scroll--compact .annual-row-caption { font-size: 9px; line-height: 12px; }
  .annual-scroll--compact .annual-value { min-height: 40px; padding-inline: 6px; }
  .annual-mobile-summary {
    position: fixed;
    bottom: var(--annual-mobile-bottom);
    z-index: 160;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-top: 2px solid var(--primary);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    padding: 2px 6px 4px;
  }
  .annual-screen--expanded .annual-mobile-summary { padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px)); }
  .annual-mobile-summary button { background: transparent; border: 0; box-shadow: none; border-radius: 0; color: var(--text); }
  .annual-mobile-summary-title { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 24px; padding: 2px; font-size: 10px; }
  .annual-mobile-summary-title span { font-size: 9px; color: var(--text3); }
  .annual-mobile-summary-values { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .annual-mobile-summary-values button { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; min-height: 40px; padding: 3px 2px; }
  .annual-mobile-summary-values span { font-size: 10px; color: var(--text3); }
  .annual-mobile-summary-values strong { font-size: 12px; font-weight: 750; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .annual-mobile-summary-values button:first-child strong { color: var(--success); }
  .annual-mobile-summary-values button:nth-child(2) strong { color: var(--danger); }
  .annual-mobile-summary-values .annual-negative strong { color: var(--danger); }
  .annual-mobile-summary-values .annual-positive strong { color: var(--success); }
  .annual-selection-summary--mobile { position: fixed; bottom: calc(var(--annual-mobile-bottom) + var(--annual-mobile-summary-height) + 4px); z-index: 170; padding: 6px; font-size: 11px; gap: 4px; }
  .annual-selection-summary--mobile button { min-height: 28px; padding: 4px 6px; }
  dialog.annual-detail:not([open]),
  .annual-mobile-totals:not([open]) { display: none; }
  .annual-detail--mobile,
  .annual-mobile-totals {
    position: fixed;
    inset: auto 0 0;
    margin: 0 auto;
    width: 100%;
    max-width: 767px;
    max-height: 82dvh;
    min-width: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
    background: var(--surface);
    color: var(--text);
    border: 2px solid var(--border);
    border-bottom: 0;
    border-radius: var(--radius) var(--radius) 0 0;
    box-shadow: var(--shadow-lg);
  }
  .annual-detail--mobile::backdrop,
  .annual-mobile-totals::backdrop { background: var(--overlay); }
  .annual-detail--mobile header,
  .annual-mobile-totals header { position: sticky; top: 0; background: var(--surface); display: flex; align-items: center; justify-content: space-between; gap: 8px; z-index: 1; }
  .annual-detail--mobile header button,
  .annual-mobile-totals header button { min-width: 36px; min-height: 36px; padding: 4px 8px; font-size: 20px; }
  .annual-mobile-totals h3 { font-size: 15px; }
  .annual-mobile-totals table { width: 100%; table-layout: fixed; border-collapse: collapse; margin-block: 12px; font-size: 11px; font-variant-numeric: tabular-nums; }
  .annual-mobile-totals th,
  .annual-mobile-totals td { padding: 8px 3px; border-bottom: 1px solid var(--border); text-align: right; }
  .annual-mobile-totals th:first-child { width: 40%; text-align: left; }
  .annual-mobile-totals td { white-space: nowrap; }
  .annual-mobile-totals p { color: var(--text3); font-size: 11px; line-height: 1.5; margin-block: 6px; }
  .annual-detail--mobile footer { position: sticky; bottom: -1px; background: var(--surface); padding-block: 8px; }
  .annual-detail--mobile footer button { min-width: 100px; }
  .annual-card-info { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .annual-card-info small { grid-column: 1 / -1; }
  .annual-detail--mobile .annual-entry-list li > div { min-width: 100%; }
  .annual-detail--mobile .annual-entry-list button { min-height: 34px; }
  .annual-detail--mobile .annual-entry-amount { margin-right: auto; }
  .annual-detail--mobile footer button { font-size: 11px; padding: 6px; }
  .annual-detail--mobile footer button:last-child { flex-basis: 100%; }
  .annual-detail--mobile footer { flex-shrink: 0; }
  .annual-detail footer button { flex: 1; }
}
</style>
