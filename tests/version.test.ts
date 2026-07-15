import { describe, expect, it } from 'vitest'
import { isVersionNewer } from '#shared/version'

describe('isVersionNewer', () => {
  it('identifica uma atualizacao de APK mais recente', () => {
    expect(isVersionNewer('1.1.0', '1.0.0')).toBe(true)
    expect(isVersionNewer('v2.0.0', '1.9.9')).toBe(true)
  })

  it('nao sugere instalar a mesma versao ou uma versao antiga', () => {
    expect(isVersionNewer('1.1.0', '1.1.0')).toBe(false)
    expect(isVersionNewer('1.0.9', '1.1.0')).toBe(false)
  })
})
