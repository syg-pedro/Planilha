import { describe, expect, it } from 'vitest'
import { parseDadosText } from '../shared/parser'
import { DEFAULT_DADOS_TEXT } from '../shared/defaultDadosText'

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

describe('parseDadosText — default data bug fixes', () => {
  const result = parseDadosText(DEFAULT_DADOS_TEXT)

  // Bug: parseDay preferia o primeiro "dia N" encontrado na linha, que no caso de
  // "fecha dia 28 vence dia 05" retornava 28 (fechamento) em vez de 5 (vencimento).
  it('Nubank: dueDay=5, closingDay=28', () => {
    const acc = result.accounts.find((a) => a.name === 'Nubank Pedro')
    expect(acc?.dueDay).toBe(5)
    expect(acc?.closingDay).toBe(28)
  })

  it('Will Juli: dueDay=7, closingDay=30', () => {
    const acc = result.accounts.find((a) => a.name === 'Will Juli')
    expect(acc?.dueDay).toBe(7)
    expect(acc?.closingDay).toBe(30)
  })

  it('Itau Juli: dueDay=18, closingDay=12', () => {
    const acc = result.accounts.find((a) => a.name === 'Itau Juli')
    expect(acc?.dueDay).toBe(18)
    expect(acc?.closingDay).toBe(12)
  })

  // Bug: parcela "ago 56,88 assinaturas mensais" era descartada porque o regex
  // exigia o número no final da string e "mensais" estava depois do valor.
  it('Itau Juli: parcela de agosto gerada mesmo com texto após o valor', () => {
    const acc = result.accounts.find((a) => a.name === 'Itau Juli')
    const entries = result.entries.filter((e) => e.accountId === acc?.id && e.origin === 'manual')
    expect(entries.some((e) => e.dueDate.includes('-08-'))).toBe(true)
  })
})
