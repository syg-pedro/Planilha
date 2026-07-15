import type { OnboardingState } from './types'

export const ONBOARDING_VERSION = 1 as const

export const createDefaultOnboardingState = (): OnboardingState => ({
  version: ONBOARDING_VERSION,
  status: 'new',
  completedSteps: [],
  updatedAt: new Date().toISOString(),
})

export const normalizeOnboardingKey = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('pt-BR')
  .replace(/\s+/g, ' ')

export const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)
