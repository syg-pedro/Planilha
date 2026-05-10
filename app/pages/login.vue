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
import { ref } from 'vue'

definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

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
