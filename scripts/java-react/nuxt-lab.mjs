import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const environment = { ...process.env }
for (const key of Object.keys(environment)) {
  if (/SUPABASE|EDIT_KEY|DATA_FILE_PATH|NUXT_PUBLIC_JAVA_LAB|NUXT_PUBLIC_API_BASE_URL|NUXT_DEV_API_PROXY_TARGET|NUXT_PUBLIC_UPDATE_MANIFEST_URL|NUXT_PUBLIC_WEB_VERSION_URL/.test(key)) delete environment[key]
}
environment.NUXT_JAVA_LAB = '1'
environment.NODE_ENV = 'development'
const nuxt = fileURLToPath(new URL('../../node_modules/nuxt/bin/nuxt.mjs', import.meta.url))
const dotenv = fileURLToPath(new URL('../../infra/dev/nuxt-java-lab.env', import.meta.url))
const child = spawn(process.execPath, [nuxt, 'dev', '--dotenv', dotenv, '--host', '127.0.0.1', '--port', '3100'], {
  cwd: root, env: environment, stdio: 'inherit'
})
child.on('error', () => { process.stderr.write('Não foi possível iniciar o Nuxt local. Confira as dependências do projeto.\n'); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
