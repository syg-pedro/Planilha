<template>
  <div>
    <h1 style="font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 6px">Entrar</h1>
    <p style="font-size: 13px; color: var(--text3); margin-bottom: 24px">Acesse sua conta do Financeiro Familiar</p>

    <form style="display: flex; flex-direction: column; gap: 16px" @submit.prevent="onSubmit">
      <div>
        <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text2); margin-bottom: 6px">E-mail</label>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="seu@email.com"
          required
          :style="inputStyle"
        />
      </div>

      <div>
        <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text2); margin-bottom: 6px">Senha</label>
        <div style="position: relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            required
            :style="{ ...inputStyle, paddingRight: '44px' }"
          />
          <button
            type="button"
            :style="eyeButtonStyle"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <label style="display: inline-flex; align-items: center; gap: 8px; width: fit-content; color: var(--text2); font-size: 12px; font-weight: 600; cursor: pointer">
        <input v-model="rememberUser" type="checkbox" style="width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer" />
        Lembrar neste aparelho
      </label>

      <div v-if="recentUsers.length" style="display: flex; flex-direction: column; gap: 7px">
        <p style="margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text3)">Usuários recentes</p>
        <div style="display: flex; flex-wrap: wrap; gap: 7px">
          <div v-for="recentUser in recentUsers" :key="recentUser.email" style="display: inline-flex; align-items: center; max-width: 100%; border: 1px solid var(--border); border-radius: var(--radius-xs); background: var(--surface2); overflow: hidden">
            <button
              type="button"
              :aria-label="`Usar ${recentUser.email}`"
              style="max-width: 220px; padding: 7px 9px; border: 0; background: transparent; color: var(--text); font: inherit; font-size: 12px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer"
              @click="selectRecentUser(recentUser.email)"
            >
              {{ recentUser.email }}
            </button>
            <button
              type="button"
              :aria-label="`Remover ${recentUser.email}`"
              style="padding: 7px 8px; border: 0; border-left: 1px solid var(--border); background: transparent; color: var(--text3); font: inherit; font-weight: 800; cursor: pointer"
              @click="removeRecentUser(recentUser.email)"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="errorMsg"
        style="padding: 10px 14px; border-radius: var(--radius-xs); background: var(--danger-light); border: 1px solid var(--danger); font-size: 13px; color: var(--danger); font-weight: 600"
      >
        {{ errorMsg }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        :style="{
          width: '100%',
          padding: '11px 16px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: loading ? 'var(--primary-dim)' : 'var(--primary)',
          color: loading ? 'var(--primary)' : '#fff',
          fontSize: '14px',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background .15s',
          fontFamily: 'inherit',
        }"
      >
        <svg v-if="loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 0.8s linear infinite">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <p style="margin-top: 20px; text-align: center; font-size: 13px; color: var(--text3)">
      Não tem conta?
      <a href="/signup" style="color: var(--primary); font-weight: 700; text-decoration: none">Criar conta</a>
    </p>
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

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-xs)',
  border: '1.5px solid var(--border)',
  background: 'var(--surface2)',
  color: 'var(--text)',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const eyeButtonStyle = {
  position: 'absolute' as const,
  right: '0',
  top: '0',
  bottom: '0',
  width: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text3)',
}

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

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg) }
  to   { transform: rotate(360deg) }
}
</style>
