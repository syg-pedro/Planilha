import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  LEGACY_ANDROID_WEB_URL,
  PRODUCTION_WEB_URL,
  mobileAllowedOrigins
} from '../shared/deployment'

describe('compatibilidade de autenticação do Android', () => {
  it('permite as origens oficiais e o aplicativo com assets locais', () => {
    const allowed = mobileAllowedOrigins('https://localhost')
    expect(allowed).toContain(PRODUCTION_WEB_URL)
    expect(allowed).toContain(LEGACY_ANDROID_WEB_URL)
    expect(allowed).toContain('https://localhost')
  })

  it('preserva origens adicionais explícitas sem permitir domínios semelhantes', () => {
    const allowed = mobileAllowedOrigins(' https://homologacao.example.test,https://localhost ')
    expect(allowed).toContain('https://homologacao.example.test')
    expect(allowed).not.toContain('https://planilha-mocha.vercel.app.attacker.test')
    expect(allowed).not.toContain('https://attacker.test')
    expect(allowed).not.toContain('null')
    expect(allowed).not.toContain('*')
    expect(new Set(allowed).size).toBe(allowed.length)
  })

  it('encaminha os APKs legados ao ambiente principal e impede cache de API', () => {
    const gateway = JSON.parse(readFileSync(new URL('../deployment/legacy-mobile/vercel.json', import.meta.url), 'utf8'))
    expect(gateway.rewrites).toEqual([{ source: '/:path*', destination: `${PRODUCTION_WEB_URL}/:path*` }])
    expect(gateway.redirects).toBeUndefined()
    expect(gateway.headers).toContainEqual({
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store' },
        { key: 'Vercel-CDN-Cache-Control', value: 'no-store' }
      ]
    })
  })
})
