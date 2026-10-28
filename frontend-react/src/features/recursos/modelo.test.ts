import { describe, expect, it } from 'vitest'
import { corpoFormulario, esquemaFormulario, valoresIniciais } from './modelo'
import type { Account, FinanceRule } from '../../types'

const novos = () => ({ ...valoresIniciais(null, '#123456'), nome: 'Registro fictício' })

describe('formulários de recursos', () => {
  it('limpa dados de cartão ao mudar de tipo e exclui identidade do corpo', () => {
    const conta: Account = { id: 'account-ficticia', householdId: 'familia-ficticia', name: 'Cartão', owner: 'Pessoa',
      type: 'credit_card', limitTotal: 1234.56, closingDay: 28, dueDay: 5, active: false }
    const dados = { ...valoresIniciais(conta, '#123456'), tipo: 'bank' as const }
    expect(corpoFormulario('accounts', dados)).toEqual({ name: 'Cartão', owner: 'Pessoa', type: 'bank',
      limitTotal: null, closingDay: null, dueDay: null, active: false })
  })

  it.each(['0', '0,10', '0.20', '999999999999.99', ''])('aceita limite opcional em centavos: %s', valor => {
    expect(esquemaFormulario('accounts').safeParse({ ...novos(), tipo: 'credit_card', valor,
      diaFechamento: '28', diaVencimento: '5' }).success).toBe(true)
  })

  it.each(['-1', '0.001', '1000000000000', 'NaN', '1e6'])('rejeita preço fora do contrato: %s', valor => {
    expect(esquemaFormulario('wishlist').safeParse({ ...novos(), valor }).success).toBe(false)
  })

  it('aceita vencimento antes do fechamento sem inventar restrição', () => {
    expect(esquemaFormulario('accounts').safeParse({ ...novos(), tipo: 'credit_card',
      diaFechamento: '28', diaVencimento: '5' }).success).toBe(true)
    expect(esquemaFormulario('accounts').safeParse({ ...novos(), tipo: 'credit_card',
      diaFechamento: '1.5', diaVencimento: '32' }).success).toBe(false)
  })

  it('conserva referências e metadados de regra sem enviar campos de leitura', () => {
    const regra: FinanceRule = { id: 'rule-ficticia', householdId: 'familia-ficticia', title: 'Assinatura', description: '',
      amount: 0.1, kind: 'expense', dueDay: 31, frequency: 'monthly', startsAt: '2028-01-01', endsAt: null,
      autoGenerate: true, accountId: 'account-ficticia', categoryId: 'category-ficticia', metadata: { source: 'fixture' } }
    const corpo = corpoFormulario('rules', valoresIniciais(regra, '#123456'))
    expect(corpo).toMatchObject({ amount: 0.1, dueDay: 31, accountId: 'account-ficticia', categoryId: 'category-ficticia', metadata: { source: 'fixture' } })
    expect(corpo).not.toHaveProperty('id')
    expect(corpo).not.toHaveProperty('householdId')
  })

  it('valida objeto JSON e datas reais antes de enviar a recorrência', () => {
    expect(esquemaFormulario('rules').safeParse({ ...novos(), valor: '0,10', inicio: '2028-02-29', metadados: '{"source":"fixture"}' }).success).toBe(true)
    expect(esquemaFormulario('rules').safeParse({ ...novos(), valor: '0,10', inicio: '2027-02-29' }).success).toBe(false)
    expect(esquemaFormulario('rules').safeParse({ ...novos(), valor: '0,10', metadados: '[]' }).success).toBe(false)
    expect(esquemaFormulario('rules').safeParse({ ...novos(), valor: '' }).success).toBe(false)
  })

  it.each(['javascript:alert(1)', 'ftp://example.invalid/produto', 'https://user:pass@example.invalid'])('rejeita endereço inseguro: %s', url => {
    expect(esquemaFormulario('wishlist').safeParse({ ...novos(), url }).success).toBe(false)
  })

  it('conserva links sem carregar imagens e converte campos opcionais em null', () => {
    const corpo = corpoFormulario('wishlist', { ...novos(), url: 'https://example.invalid/produto', imagemUrl: 'https://example.invalid/imagem.png' })
    expect(corpo).toMatchObject({ url: 'https://example.invalid/produto', imageUrl: 'https://example.invalid/imagem.png', price: null, notes: null })
  })

  it('expande a cor de preferência para o contrato da categoria', () => {
    expect(valoresIniciais(null, '#ABC').cor).toBe('#AABBCC')
  })
})
