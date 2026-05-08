# Módulos do Financeiro Familiar

Documentação de todos os módulos implementados — estado atual, fonte de dados, e funcionalidades.

---

## Módulos com dados reais (concluídos)

### Dashboard
**Arquivo:** `app/features/finance/components/screens/DashboardScreen.vue`

**KPIs (dados reais do store):**
- Receitas do mês → `store.kpis.totalIncome`
- Despesas do mês → `store.kpis.totalExpense`
- Saldo líquido → `store.kpis.net`
- Em aberto → `store.kpis.pendingAmount`
- Próximos 7 dias → `store.kpis.upcoming7Days`
- Uso dos cartões → `store.kpis.cardsUsedPercent`
- Patrimônio líquido → `store.kpis.net` (agregado)

**Ainda com dados mock:**
- Gráfico de fluxo de caixa (CASHFLOW_DATA hardcoded)
- Mini-widgets de orçamentos, metas e vencimentos
- Gráfico de patrimônio (NET_WORTH_TREND hardcoded)

> Será atualizado após a conclusão dos módulos de Orçamentos, Metas e Patrimônio (tarefas #5, #8, #9).

---

### Planilha
**Arquivo:** `app/features/finance/components/FinanceEntryGrid.vue`

Tabela de lançamentos completa. Existia antes do redesign, 100% funcional com dados reais.

---

### Relatórios ✅ (implementado)
**Arquivo:** `app/features/finance/components/screens/RelatoriosScreen.vue`

**Fonte de dados:** `store.entries`, `store.categories`, `store.accounts`

**Funcionalidades:**
- Seletor de período: mês / 3 meses / 6 meses / ano
- KPIs calculados: receita total, despesa total, saldo, taxa de poupança
- Gráfico de barras mensal (receita vs. despesa) usando `buildCashflowSeries`
- Breakdown de despesas por categoria com barras de progresso coloridas (cor da categoria)
- Breakdown por pessoa (agrupa por `account.owner`)
- Tabela de resumo mensal com status (superávit/déficit)
- Exportação para CSV (download direto no browser)

---

### Conciliação ✅ (implementado)
**Arquivo:** `app/features/finance/components/screens/ConciliacaoScreen.vue`

**Fonte de dados:** `store.entries` filtrado por `status = 'pending' | 'review'`

**Funcionalidades:**
- Exibe todos os lançamentos pendentes de confirmação
- Indicadores: total pendente, valor total, confirmados no mês
- Filtro por tipo (receita/despesa) e busca por título
- Destaque visual para lançamentos vencidos (fundo vermelho)
- "Confirmar" individual → chama `store.saveEntriesBatch({ status: 'paid' })`
- "Confirmar tudo" em lote → batch único para todos os pendentes

---

### Planejamento Anual ✅ (implementado)
**Arquivo:** `app/features/finance/components/screens/PlanejamentoScreen.vue`

**Fonte de dados:** `store.entries` agrupados por mês/ano

**Funcionalidades:**
- Navegação entre anos (botões < / >)
- Tabela de 12 meses com: receitas, despesas, saldo mensal, saldo acumulado, status (superávit/déficit)
- Mês atual destacado
- Meses com déficit com fundo vermelho sutil
- KPIs anuais: receita/despesa/saldo projetados (média dos meses com dados × meses restantes) e contagem de meses de risco
- Gráfico de linha do saldo acumulado ao longo do ano

---

## Módulos a implementar (pendentes)

### Alertas (#4)
**Planejado:** Alertas gerados dinamicamente a partir de:
- Entries com vencimento ≤ 3 dias → danger
- Entries com vencimento ≤ 7 dias → warning
- Orçamentos consumidos > 80% → warning, > 100% → danger
- Taxa de poupança < 10% → warning
- Cartão de crédito > 80% do limite → warning

---

### Orçamentos (#5)
**Planejado:**
- Tipo `Budget` já existe em `shared/types.ts` e é carregado no bootstrap
- Precisa: `POST /api/budgets/batch`, `DELETE /api/budgets/:id`
- Store: `saveBudgets`, `deleteBudget`
- Screen: consumo real por categoria (entries do mês vs. limite do orçamento)

---

### Assinaturas (#6)
**Planejado:**
- Usa `FinanceRule` com `frequency: 'monthly'` do store
- Precisa: API CRUD de rules (`POST /api/rules/batch`, `DELETE /api/rules/:id`)
- Screen: lista de assinaturas com custo mensal/anual, próximo débito

---

### Dívidas (#7)
**Planejado:**
- Agrupa `store.entries` onde `installmentTotal > 1` pelo `ruleId`
- Sem novo tipo ou API — tudo derivado de entries existentes
- Screen: agrupamento com parcelas pagas vs. pendentes, total restante

---

### Patrimônio (#8)
**Planejado:**
- Novo tipo: `PatrimonyItem { id, name, kind: 'asset'|'liability', value, category, updatedAt }`
- Repo em-memória + Supabase + API CRUD
- Store: `patrimony[]`, `savePatrimony`, `deletePatrimony`
- Screen: ativos vs. passivos, patrimônio líquido, gráfico de evolução

---

### Metas (#9)
**Planejado:**
- Novo tipo: `FinanceGoal { id, name, targetAmount, currentAmount, deadline, color }`
- Repo em-memória + Supabase + API CRUD
- Store: `goals[]`, `saveGoal`, `deleteGoal`, `contributeGoal`
- Screen: progresso com donut ring, aporte manual, prazo

---

### Cenários (#10)
**Planejado:**
- Simulador sem backend — persiste em `localStorage`
- Campos: renda, despesa fixa, aporte mensal, prazo
- Gráfico de projeção em tempo real
- Lista de cenários salvos para comparação

---

### Dashboard mini-widgets (#11)
**Planejado (após #5, #8, #9):**
- Cashflow chart → `buildCashflowSeries(store.entries)`
- Budget mini → `store.budgets` + `store.entries` do mês
- Goals mini → `store.goals`
- Upcoming → entries pendentes ordenados por vencimento
- Patrimônio → `store.patrimony`

---

## Arquitetura de dados

```
/api/bootstrap (GET)
  → HouseholdSettings, Account[], Category[], FinanceRule[],
    FinanceEntry[], Budget[], FinanceKpis, warnings[]

/api/entries/batch (POST)
  → upserts[] + deletes[] → FinanceEntry[]

/api/settings/theme (POST)      → HouseholdSettings
/api/settings/dashboard (POST)  → HouseholdSettings
/api/import/csv (POST)          → { inserted, warnings }
/api/rules/rebuild (POST)       → { count }
```

## Componentes base criados

| Componente | Descrição |
|---|---|
| `BaseIcon` | SVG icon com 40+ ícones |
| `BaseKpiCard` | Card de KPI com ícone, valor, trend, alerta |
| `BaseProgressBar` | Barra com auto-cor (warning ≥70%, danger ≥90%) |
| `BaseDonutRing` | Donut SVG com label central |
| `BaseBarChart` | Gráfico de barras lado-a-lado (receita/despesa) |
| `BaseLineChart` | Gráfico de linha SVG com ResizeObserver |
| `BaseModal` | Modal com teleport + backdrop blur |
| `BaseAlertBanner` | Banner de alertas com dismiss |
| `BaseEmptyState` | Estado vazio com ícone + mensagem |
