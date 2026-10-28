import { describe, expect, it } from 'vitest'
import {
  assertJavaLabBrowserOrigin,
  assertJavaLabDevelopment,
  assertJavaLabTarget,
  financeStorageKey,
  javaLabActive,
  javaLabConfigured,
  JAVA_LAB_ORIGIN
} from '../shared/javaLab'

describe('isolamento do laboratório Java', () => {
  it('exige ativação explícita e desenvolvimento sem alterar as chaves originais', () => {
    expect(javaLabActive(true, true)).toBe(true)
    expect(javaLabActive(true, false)).toBe(false)
    expect(javaLabActive(false, true)).toBe(false)
    expect(javaLabActive('true', true)).toBe(false)
    expect(javaLabConfigured('1', undefined)).toBe(true)
    expect(javaLabConfigured(undefined, undefined)).toBe(false)
    expect(javaLabConfigured('true', undefined)).toBe(false)
    expect(() => javaLabConfigured(undefined, 'true')).toThrow('NUXT_PUBLIC_JAVA_LAB')
    expect(() => assertJavaLabDevelopment(false)).toThrow('desenvolvimento')
    expect(() => assertJavaLabDevelopment(true)).not.toThrow()
    expect(financeStorageKey('finance-offline-queue', false)).toBe('finance-offline-queue')
    expect(financeStorageKey('finance-offline-queue', true)).toBe('finance-java-lab:finance-offline-queue')
  })

  it('aceita apenas o backend HTTP de loopback na porta 8080', () => {
    expect(assertJavaLabTarget('http://127.0.0.1:8080')).toBe(JAVA_LAB_ORIGIN)
    expect(assertJavaLabTarget('http://localhost:8080')).toBe(JAVA_LAB_ORIGIN)
    for (const target of ['https://example.test', 'http://127.0.0.1:3000', 'https://127.0.0.1:8080',
      'http://user:secret@127.0.0.1:8080', 'http://127.0.0.1:8080/api', 'http://127.0.0.1:8080?token=example']) {
      expect(() => assertJavaLabTarget(target)).toThrow()
    }
  })

  it('exige origem de navegador local exclusiva na porta 3100', () => {
    expect(() => assertJavaLabBrowserOrigin('http://127.0.0.1:3100')).not.toThrow()
    expect(() => assertJavaLabBrowserOrigin('http://localhost:3100')).not.toThrow()
    for (const origin of ['http://127.0.0.1:3000', 'http://localhost:5173', 'https://example.test:3100']) {
      expect(() => assertJavaLabBrowserOrigin(origin)).toThrow('3100')
    }
  })
})
