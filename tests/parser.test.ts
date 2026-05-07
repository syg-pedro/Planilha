import { describe, expect, it } from 'vitest'
import { parseDadosText } from '../shared/parser'

const sample = `receitas
salario de Pedro - dia 15 entra 1000 reais, dia 30 1000
Juli minha esposa recebe 1100 quinto dia util
recebo 800 reais de vale refeicao no flash
internet 99 por mes
energia esta por volta de 260 mes
aluguel + agua + condominio 1700
Sicredi vence 25 de maio fechamento 11 de maio - limite total 1050
mai 2026 R$ 484,75 - jun 47,82 - jul 47,82
`

describe('parseDadosText', () => {
  it('creates baseline settings, rules and entries', () => {
    const parsed = parseDadosText(sample)

    expect(parsed.settings.horizonMonths).toBe(18)
    expect(parsed.rules.length).toBeGreaterThan(4)
    expect(parsed.entries.length).toBeGreaterThan(10)
    expect(parsed.accounts.some((account) => account.name.includes('Sicredi'))).toBe(true)
  })
})
