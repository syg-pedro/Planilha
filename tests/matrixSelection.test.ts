import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useMatrixSelection, type MatrixCell } from '../app/features/finance/composables/useMatrixSelection'

function setup() {
  const cells = ref<MatrixCell[]>([
    { kind: 'expense', title: 'Aluguel', month: '2026-09' },
    { kind: 'expense', title: 'Internet', month: '2026-09' },
    { kind: 'expense', title: 'Aluguel', month: '2026-10' },
    { kind: 'expense', title: 'Internet', month: '2026-10' },
    { kind: 'income', title: 'Salário', month: '2026-09' },
  ])
  const amounts = ref([0.1 + 0.2, 100, 0, 50.05, 2000])
  return { cells, amounts, selection: useMatrixSelection(cells, cell => amounts.value[cells.value.indexOf(cell)] ?? 0) }
}

describe('seleção de células da matriz', () => {
  it('soma cinco células, incluindo vazias e receitas, com precisão monetária e valores atualizados', () => {
    const { cells, amounts, selection } = setup()
    cells.value.forEach(selection.toggle)
    expect(selection.count.value).toBe(5)
    expect(selection.sum.value).toBe(2150.35)
    amounts.value[1] = 120
    expect(selection.sum.value).toBe(2170.35)
    selection.toggle(cells.value[0]!)
    expect(selection.count.value).toBe(4)
    expect(selection.sum.value).toBe(2170.05)
  })

  it('seleciona um retângulo em qualquer direção e preserva seleções de outra tabela', () => {
    const { cells, selection } = setup()
    selection.toggle(cells.value[4]!)
    selection.range(cells.value[3]!, cells.value[0]!, selection.selected.value)
    expect(selection.count.value).toBe(5)
    selection.range(cells.value[0]!, cells.value[4]!)
    expect(selection.count.value).toBe(5)
  })

  it('remove células ocultas da seleção e limpa a âncora', async () => {
    const { cells, selection } = setup()
    selection.toggle(cells.value[0]!)
    selection.toggle(cells.value[1]!)
    cells.value = [cells.value[0]!]
    await nextTick()
    expect(selection.count.value).toBe(1)
    expect(selection.sum.value).toBe(0.3)
    expect(selection.anchor.value).toBeNull()
  })

  it('limpa a seleção ao sair do modo de seleção', async () => {
    const { cells, selection } = setup()
    selection.enabled.value = true
    await nextTick()
    selection.toggle(cells.value[0]!)
    selection.enabled.value = false
    await nextTick()
    expect(selection.count.value).toBe(0)
    expect(selection.sum.value).toBe(0)
  })
})
