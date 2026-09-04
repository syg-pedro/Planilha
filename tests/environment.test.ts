import { describe, expect, it } from 'vitest'
import { validateHomologation } from '../shared/environment'

const homol = {
  environment: 'homol', webUrl: 'https://finance-homol.example.com', projectRef: 'abcdefghijklmnopqrst',
  supabaseUrl: 'https://abcdefghijklmnopqrst.supabase.co', publicSupabaseUrl: 'https://abcdefghijklmnopqrst.supabase.co',
  serviceKey: 'test-server-key', anonKey: 'test-public-key',
}
describe('isolamento de homologação', () => {
  it('permite banco compartilhado somente com autorização explícita e preserva a API homol', () => {
    const shared = { ...homol, projectRef: 'whltzvaqakgvqfylciot',
      supabaseUrl: 'https://whltzvaqakgvqfylciot.supabase.co', publicSupabaseUrl: 'https://whltzvaqakgvqfylciot.supabase.co' }
    expect(() => validateHomologation(shared)).toThrow()
    expect(() => validateHomologation({ ...shared, allowSharedProductionDatabase: true })).not.toThrow()
    expect(() => validateHomologation({ ...shared, allowSharedProductionDatabase: true, apiBaseUrl: 'https://planilha-cyan.vercel.app' })).toThrow()
  })
  it('preserva configuração atual de produção e exige credenciais em homol', () => {
    expect(() => validateHomologation({ environment: 'production' })).not.toThrow()
    expect(() => validateHomologation(homol)).not.toThrow()
    expect(() => validateHomologation({ ...homol, serviceKey: '' })).toThrow()
  })
  it('recusa banco e destinos de produção', () => {
    expect(() => validateHomologation({ ...homol, projectRef: 'whltzvaqakgvqfylciot' })).toThrow()
    expect(() => validateHomologation({ ...homol, webUrl: 'https://planilha-cyan.vercel.app' })).toThrow()
    expect(() => validateHomologation({ ...homol, apiBaseUrl: 'https://planilha-mocha.vercel.app' })).toThrow()
  })
  it('recusa mistura de autenticação e backend e URLs inseguras', () => {
    expect(() => validateHomologation({ ...homol, publicSupabaseUrl: 'https://whltzvaqakgvqfylciot.supabase.co' })).toThrow()
    expect(() => validateHomologation({ ...homol, webUrl: 'http://finance-homol.example.com' })).toThrow()
    expect(() => validateHomologation({ ...homol, webUrl: 'https://user:password@finance-homol.example.com' })).toThrow()
  })
})
