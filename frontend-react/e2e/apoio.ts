import { randomUUID } from 'node:crypto'
import { test as base, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

export type SessaoTeste = { accessToken: string; family: { id: string; name: string }; email: string; password: string }

export function observar(page: Page, falhas: string[]) {
  page.on('pageerror', erro => falhas.push(`Página: ${erro.message}`))
  page.on('console', mensagem => {
    if (mensagem.type() !== 'error') return
    if (/401/.test(mensagem.text()) && /\/api\/auth\/refresh(?:\?|$)/.test(mensagem.location().url)) return
    falhas.push(`Console: ${mensagem.text()}`)
  })
  page.on('requestfailed', requisicao => {
    const erro = requisicao.failure()?.errorText ?? ''
    if (erro !== 'net::ERR_ABORTED') falhas.push(`Rede: ${requisicao.method()} ${new URL(requisicao.url()).pathname} ${erro}`)
  })
  page.on('response', resposta => {
    if (resposta.status() >= 500 && new URL(resposta.url()).pathname.startsWith('/api/')) {
      falhas.push(`API: ${resposta.status()} ${new URL(resposta.url()).pathname}`)
    }
  })
}

export const test = base.extend<{ falhas: string[] }>({
  falhas: [async ({ page }, usar, informacoes) => {
    const falhas: string[] = []
    observar(page, falhas)
    await usar(falhas)
    if (falhas.length) await informacoes.attach('falhas-browser', { body: JSON.stringify(falhas, null, 2), contentType: 'application/json' })
    if (informacoes.status === informacoes.expectedStatus) expect(falhas, 'Erros inesperados no navegador ou na API').toEqual([])
  }, { auto: true }]
})
export { expect }

export async function cadastrar(page: Page): Promise<SessaoTeste> {
  const sufixo = randomUUID()
  const email = `familia-${sufixo}@example.test`
  const password = `FinanceiroTeste!${sufixo.slice(0, 8)}`
  await page.goto('/cadastro')
  await page.getByLabel('Seu nome', { exact: true }).fill('Pessoa fictícia')
  await page.getByLabel('Nome da família', { exact: true }).fill(`Família fictícia ${sufixo.slice(0, 8)}`)
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  const resposta = page.waitForResponse(resposta => new URL(resposta.url()).pathname === '/api/auth/register' && resposta.request().method() === 'POST')
  await page.getByRole('button', { name: 'Criar minha conta', exact: true }).click()
  const resultado = await resposta
  expect(resultado.status()).toBe(201)
  const sessao = await resultado.json() as Omit<SessaoTeste, 'email' | 'password'>
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect(page.getByRole('heading', { name: 'Um olhar para o seu mês.', exact: true })).toBeVisible()
  return { ...sessao, email, password }
}

export const autorizacao = (sessao: SessaoTeste) => ({ Authorization: `Bearer ${sessao.accessToken}`, 'X-Requested-With': 'FinanceiroLab' })
export const hoje = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date())

export async function selecionar(page: Page, escopo: Page | Locator, titulo: string, opcao: string) {
  const tituloEscapado = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  await escopo.getByRole('button', { name: new RegExp(`(?:^|\\s)${tituloEscapado}$`) }).click()
  await page.getByRole('option', { name: opcao, exact: true }).click()
}

export async function salvar(page: Page, dialogo: Locator, rota: string, metodo = 'POST', botao = 'Salvar') {
  const resposta = page.waitForResponse(resposta => new URL(resposta.url()).pathname === rota && resposta.request().method() === metodo)
  await dialogo.getByRole('button', { name: botao, exact: true }).click()
  const resultado = await resposta
  expect(resultado.status()).toBe(metodo === 'POST' ? 201 : 200)
  await expect(dialogo).toBeHidden()
  return resultado.json() as Promise<{ id: string }>
}

export async function criarConta(page: Page, nome: string, cartao = false) {
  await page.goto('/contas')
  await page.getByRole('button', { name: 'Adicionar conta', exact: true }).click()
  const dialogo = page.getByRole('dialog', { name: 'Adicionar conta', exact: true })
  await dialogo.getByLabel('Nome', { exact: true }).fill(nome)
  await dialogo.getByLabel('Responsável', { exact: true }).fill('Pessoa fictícia')
  if (cartao) {
    await selecionar(page, dialogo, 'Tipo de conta', 'Cartão de crédito')
    await dialogo.getByLabel('Limite do cartão (R$)', { exact: true }).fill('500,00')
    await dialogo.getByLabel('Dia do fechamento', { exact: true }).fill('28')
    await dialogo.getByLabel('Dia do vencimento', { exact: true }).fill('5')
  }
  const criada = await salvar(page, dialogo, '/api/accounts')
  await expect(page.getByRole('row').filter({ hasText: nome })).toBeVisible()
  return criada
}

export async function prepararConta(page: Page, sessao: SessaoTeste, nome: string) {
  const resposta = await page.request.post('/api/accounts', { headers: autorizacao(sessao), data: { name: nome, type: 'bank' } })
  expect(resposta.status()).toBe(201)
  return resposta.json() as Promise<{ id: string }>
}

export async function prepararLancamento(page: Page, sessao: SessaoTeste, dados: Record<string, unknown>) {
  const resposta = await page.request.post('/api/entries', { headers: autorizacao(sessao), data: {
    title: 'Lançamento fictício', amount: 10, kind: 'expense', dueDate: hoje(), ...dados
  } })
  expect(resposta.status()).toBe(201)
  return resposta.json() as Promise<{ id: string }>
}
