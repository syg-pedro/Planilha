export const JAVA_LAB_ORIGIN = 'http://127.0.0.1:8080'
export const JAVA_LAB_PORT = 3100

export const javaLabConfigured = (flag: string | undefined, publicFlag: string | undefined) => {
  if (publicFlag !== undefined) throw new Error('Ative o laboratório somente com NUXT_JAVA_LAB=1, sem NUXT_PUBLIC_JAVA_LAB.')
  return flag === '1'
}

export const javaLabActive = (configured: unknown, development: boolean) => development && configured === true

export const financeStorageKey = (key: string, laboratory: boolean) => laboratory ? `finance-java-lab:${key}` : key

export const assertJavaLabTarget = (target: string) => {
  const url = new URL(target)
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== '8080'
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('O laboratório Java exige o backend local na porta 8080.')
  }
  return JAVA_LAB_ORIGIN
}

export const assertJavaLabDevelopment = (development: boolean) => {
  if (!development) throw new Error('NUXT_JAVA_LAB=1 só pode ser usado no servidor de desenvolvimento.')
}

export const assertJavaLabBrowserOrigin = (origin: string) => {
  const url = new URL(origin)
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== String(JAVA_LAB_PORT)) {
    throw new Error('Abra o laboratório em http://127.0.0.1:3100 usando um perfil de navegador separado.')
  }
}
