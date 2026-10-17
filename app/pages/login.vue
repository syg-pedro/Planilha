<template>
  <div>
    <h1 class="text-xl font-semibold text-highlighted">Entrar</h1>
    <p class="mb-6 mt-1 text-sm text-muted">Acesse sua conta da Planilha</p>
    <form class="space-y-4" @submit.prevent="onSubmit">
      <UFormField label="E-mail" required><UInput v-model="email" type="email" autocomplete="email" placeholder="seu@email.com" required class="w-full" icon="i-lucide-mail" :ui="{ base: 'finance-control' }" /></UFormField>
      <UFormField label="Senha" required>
        <UInput v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Sua senha" required class="w-full" :ui="{ base: 'finance-control', trailing: 'pe-1' }">
          <template #trailing><UButton color="neutral" variant="link" size="sm" :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showPassword = !showPassword" /></template>
        </UInput>
      </UFormField>
      <UCheckbox v-model="rememberUser" label="Lembrar neste aparelho" />
      <div v-if="recentUsers.length" class="space-y-2">
        <p class="text-xs font-medium text-muted">Usuários recentes</p>
        <div class="flex flex-wrap gap-2">
          <UFieldGroup v-for="recentUser in recentUsers" :key="recentUser.email" class="max-w-full">
            <UButton color="neutral" variant="outline" class="min-w-0 max-w-60" :aria-label="`Usar ${recentUser.email}`" @click="selectRecentUser(recentUser.email)"><span class="truncate">{{ recentUser.email }}</span></UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-x" :aria-label="`Remover ${recentUser.email}`" @click="removeRecentUser(recentUser.email)" />
          </UFieldGroup>
        </div>
      </div>
      <UAlert v-if="errorMsg" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="errorMsg" role="alert" />
      <UButton type="submit" :loading="loading" block class="finance-control">{{ loading ? 'Entrando…' : 'Entrar' }}</UButton>
    </form>
    <p class="mt-5 text-center text-sm text-muted">Não tem conta? <ULink to="/signup" class="font-medium">Criar conta</ULink></p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'

type RecentUser = {
  email: string
  lastUsedAt: number
  password?: string
}

const RECENT_USERS_KEY = 'finance-recent-users'
const SECURE_RECENT_USERS_KEY = 'finance-secure-recent-users'
const REMEMBERED_EMAIL_KEY = 'finance-remembered-email'

definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const rememberUser = ref(true)
const recentUsers = ref<RecentUser[]>([])

const isNativePlatform = Capacitor.isNativePlatform()

const parseRecentUsers = (raw: string | null): RecentUser[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is RecentUser => typeof item?.email === 'string' && item.email.length > 0 && typeof item.lastUsedAt === 'number')
      .slice(0, 3)
  } catch {
    return []
  }
}

const readRecentUsers = async (): Promise<RecentUser[]> => {
  if (!process.client) return []
  if (isNativePlatform) {
    try {
      const stored = await SecureStorage.getItem(SECURE_RECENT_USERS_KEY)
      return parseRecentUsers(stored)
    } catch {
      return []
    }
  }
  return parseRecentUsers(localStorage.getItem(RECENT_USERS_KEY))
}

const persistRecentUser = async (currentEmail: string, currentPassword: string) => {
  if (!process.client || !rememberUser.value) return

  const normalizedEmail = currentEmail.trim().toLowerCase()
  const nextUsers = [
    { email: normalizedEmail, password: currentPassword, lastUsedAt: Date.now() },
    ...recentUsers.value.filter((item) => item.email !== normalizedEmail)
  ].slice(0, 3)

  recentUsers.value = nextUsers
  if (isNativePlatform) {
    await SecureStorage.set(SECURE_RECENT_USERS_KEY, nextUsers)
    return
  }

  // No navegador mantemos apenas o e-mail. Senhas ficam restritas ao Android KeyStore.
  const publicUsers = nextUsers.map(({ email: savedEmail, lastUsedAt }) => ({ email: savedEmail, lastUsedAt }))
  localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(publicUsers))
  localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail)
}

const selectRecentUser = (recentEmail: string) => {
  const recentUser = recentUsers.value.find((item) => item.email === recentEmail)
  email.value = recentEmail
  password.value = recentUser?.password ?? ''
  errorMsg.value = null
}

const removeRecentUser = async (recentEmail: string) => {
  recentUsers.value = recentUsers.value.filter((item) => item.email !== recentEmail)
  if (isNativePlatform) {
    await SecureStorage.set(SECURE_RECENT_USERS_KEY, recentUsers.value)
    return
  }
  localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(recentUsers.value))
  if (localStorage.getItem(REMEMBERED_EMAIL_KEY) === recentEmail) {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY)
  }
}

onMounted(async () => {
  recentUsers.value = await readRecentUsers()
  const rememberedEmail = isNativePlatform ? recentUsers.value[0]?.email : localStorage.getItem(REMEMBERED_EMAIL_KEY)
  if (rememberedEmail) {
    email.value = rememberedEmail
  }
})

const onSubmit = async () => {
  errorMsg.value = null
  loading.value = true
  try {
    const { error } = await signIn(email.value, password.value)
    if (error) {
      errorMsg.value = error === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos'
        : error
      return
    }
    await persistRecentUser(email.value, password.value)
    await navigateTo('/')
  } finally {
    loading.value = false
  }
}
</script>
