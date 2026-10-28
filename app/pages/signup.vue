<template>
  <div>
    <h1 class="text-xl font-semibold text-highlighted">Criar conta</h1>
    <p class="mb-6 mt-1 text-sm text-muted">Crie sua conta da Planilha</p>
    <form class="space-y-4" @submit.prevent="onSubmit">
      <UFormField label="E-mail" required><UInput v-model="email" type="email" autocomplete="email" placeholder="seu@email.com" required class="w-full" icon="i-lucide-mail" :ui="{ base: 'finance-control' }" /></UFormField>
      <UFormField label="Senha" required>
        <UInput v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Crie uma senha" required class="w-full" :ui="{ base: 'finance-control', trailing: 'pe-1' }">
          <template #trailing><UButton color="neutral" variant="link" size="sm" :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showPassword = !showPassword" /></template>
        </UInput>
      </UFormField>
      <div class="flex flex-wrap gap-2" aria-label="Regras da senha">
        <UBadge v-for="rule in passwordRules" :key="rule.key" :color="rule.met ? 'success' : 'neutral'" variant="subtle" :icon="rule.met ? 'i-lucide-check' : 'i-lucide-minus'">{{ rule.label }}</UBadge>
      </div>
      <UFormField label="Confirmar senha" required :error="confirmMismatch ? 'As senhas precisam ser iguais.' : undefined">
        <UInput v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" autocomplete="new-password" placeholder="Repita a senha" required class="w-full" :ui="{ base: 'finance-control', trailing: 'pe-1' }">
          <template #trailing><UButton color="neutral" variant="link" size="sm" :icon="showConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'" :aria-label="showConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'" @click="showConfirm = !showConfirm" /></template>
        </UInput>
      </UFormField>
      <UAlert v-if="errorMsg" color="error" variant="subtle" :description="errorMsg" role="alert" />
      <UAlert v-if="successMsg" color="success" variant="subtle" icon="i-lucide-circle-check" :description="successMsg" role="status" />
      <UButton type="submit" :loading="loading" :disabled="!canSubmit" block class="finance-control">{{ loading ? 'Criando conta…' : 'Criar conta' }}</UButton>
    </form>
    <p class="mt-5 text-center text-sm text-muted">Já tem conta? <ULink to="/login" class="font-medium">Entrar</ULink></p>
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

const passwordRules = computed(() => [
  { key: 'length', label: 'Mín. 8 caracteres', met: password.value.length >= 8 },
  { key: 'upper',  label: 'Letra maiúscula',   met: /[A-Z]/.test(password.value) },
  { key: 'digit',  label: 'Número',            met: /[0-9]/.test(password.value) },
  { key: 'special',label: 'Caractere especial', met: /[^a-zA-Z0-9]/.test(password.value) },
])

const allRulesMet = computed(() => passwordRules.value.every(r => r.met))
const confirmMismatch = computed(() => confirmPassword.value.length > 0 && password.value !== confirmPassword.value)
const canSubmit = computed(() => allRulesMet.value && password.value === confirmPassword.value && email.value.length > 0)

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
    if (import.meta.dev && useRuntimeConfig().public.javaLab) {
      await navigateTo('/')
      return
    }
    successMsg.value = 'Conta criada! Verifique seu e-mail para confirmar o cadastro ou faça login.'
  } finally {
    loading.value = false
  }
}

</script>
