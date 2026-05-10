<template>
  <div>
    <h1 style="font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 6px">Criar conta</h1>
    <p style="font-size: 13px; color: var(--text3); margin-bottom: 24px">Crie sua conta do Financeiro Familiar</p>

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
            autocomplete="new-password"
            placeholder="••••••••"
            :style="{ ...inputStyle, paddingRight: '44px' }"
          />
          <button type="button" :style="eyeButtonStyle" @click="showPassword = !showPassword">
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

        <!-- Checklist de regras -->
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px">
          <span v-for="rule in passwordRules" :key="rule.key" :style="ruleChipStyle(rule.met)">
            <svg v-if="rule.met" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {{ rule.label }}
          </span>
        </div>
      </div>

      <div>
        <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text2); margin-bottom: 6px">Confirmar senha</label>
        <div style="position: relative">
          <input
            v-model="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="••••••••"
            :style="{ ...inputStyle, paddingRight: '44px', borderColor: confirmMismatch ? 'var(--danger)' : undefined }"
          />
          <button type="button" :style="eyeButtonStyle" @click="showConfirm = !showConfirm">
            <svg v-if="showConfirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <p v-if="confirmMismatch" style="font-size: 12px; color: var(--danger); margin-top: 5px; font-weight: 600">As senhas não coincidem</p>
      </div>

      <div
        v-if="errorMsg"
        style="padding: 10px 14px; border-radius: var(--radius-xs); background: var(--danger-light); border: 1px solid var(--danger); font-size: 13px; color: var(--danger); font-weight: 600"
      >
        {{ errorMsg }}
      </div>

      <div
        v-if="successMsg"
        style="padding: 10px 14px; border-radius: var(--radius-xs); background: var(--success-light, #dcfce7); border: 1px solid var(--success); font-size: 13px; color: var(--success); font-weight: 600"
      >
        {{ successMsg }}
      </div>

      <button
        type="submit"
        :disabled="!canSubmit || loading"
        :style="{
          width: '100%',
          padding: '11px 16px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: canSubmit && !loading ? 'var(--primary)' : 'var(--primary-dim)',
          color: canSubmit && !loading ? '#fff' : 'var(--primary)',
          fontSize: '14px',
          fontWeight: '700',
          cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
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
        {{ loading ? 'Criando conta...' : 'Criar conta' }}
      </button>
    </form>

    <p style="margin-top: 20px; text-align: center; font-size: 13px; color: var(--text3)">
      Já tem conta?
      <a href="/login" style="color: var(--primary); font-weight: 700; text-decoration: none">Entrar</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ layout: 'auth' })

const { signUp } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

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

const passwordRules = computed(() => [
  { key: 'length', label: 'Mín. 8 caracteres', met: password.value.length >= 8 },
  { key: 'upper',  label: 'Letra maiúscula',   met: /[A-Z]/.test(password.value) },
  { key: 'digit',  label: 'Número',            met: /[0-9]/.test(password.value) },
  { key: 'special',label: 'Caractere especial', met: /[^a-zA-Z0-9]/.test(password.value) },
])

const allRulesMet = computed(() => passwordRules.value.every(r => r.met))
const confirmMismatch = computed(() => confirmPassword.value.length > 0 && password.value !== confirmPassword.value)
const canSubmit = computed(() => allRulesMet.value && password.value === confirmPassword.value && email.value.length > 0)

const ruleChipStyle = (met: boolean) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 9px',
  borderRadius: '99px',
  fontSize: '11px',
  fontWeight: '600',
  background: met ? 'var(--success-light, #dcfce7)' : 'var(--surface2)',
  color: met ? 'var(--success, #16a34a)' : 'var(--text3)',
  border: `1px solid ${met ? 'var(--success, #16a34a)' : 'var(--border)'}`,
  transition: 'all .15s',
})

const onSubmit = async () => {
  if (!canSubmit.value) return
  errorMsg.value = null
  successMsg.value = null
  loading.value = true
  try {
    const { error } = await signUp(email.value, password.value)
    if (error) {
      if (error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already been registered')) {
        errorMsg.value = 'Este e-mail já está cadastrado. Faça login.'
      } else {
        errorMsg.value = error
      }
      return
    }
    successMsg.value = 'Conta criada! Verifique seu e-mail para confirmar o cadastro ou faça login.'
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
