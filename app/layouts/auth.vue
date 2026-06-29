<template>
  <div class="auth-shell">
    <div class="auth-shell__shape auth-shell__shape--one" aria-hidden="true" />
    <div class="auth-shell__shape auth-shell__shape--two" aria-hidden="true" />
    <div class="auth-card">
      <div class="auth-card__header">
        <div class="auth-card__logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <p class="auth-card__eyebrow">Financeiro</p>
          <p class="auth-card__brand">Familiar</p>
        </div>
      </div>
      <div class="auth-card__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  overflow: hidden;
  padding: 32px 18px;
  background: var(--bg);
}

.auth-shell__shape {
  position: absolute;
  border: 3px solid var(--border);
  box-shadow: var(--shadow-md);
  pointer-events: none;
}

.auth-shell__shape--one {
  top: 8%;
  left: 8%;
  width: 110px;
  height: 110px;
  background: var(--accent);
  transform: rotate(-11deg);
}

.auth-shell__shape--two {
  right: 7%;
  bottom: 9%;
  width: 140px;
  height: 78px;
  background: var(--primary);
  transform: rotate(8deg);
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 430px;
  overflow: hidden;
  background: var(--surface);
  border: 3px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
}

.auth-card__header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 28px;
  background: var(--accent);
  border-bottom: 3px solid var(--border);
}

.auth-card__logo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: var(--primary);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
}

.auth-card__eyebrow {
  color: var(--text2);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.auth-card__brand {
  color: var(--text);
  font-family: var(--ds-font-family-display);
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
}

.auth-card__body {
  padding: 28px 32px 32px;
}

.auth-card__body :deep(input:not([type='checkbox']):not([type='radio'])) {
  min-height: 42px;
  background: var(--surface) !important;
  border: 2px solid var(--border) !important;
  border-radius: var(--radius-sm) !important;
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
  font-weight: 650;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.auth-card__body :deep(input:not([type='checkbox']):not([type='radio']):focus) {
  box-shadow: 4px 4px 0 var(--primary);
  transform: translate(-1px, -1px);
}

.auth-card__body :deep(button[type='submit']) {
  min-height: 42px;
  border: 2px solid var(--border) !important;
  border-radius: var(--radius-sm) !important;
  box-shadow: 4px 4px 0 var(--ds-shadow-color);
  font-weight: 800 !important;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear !important;
}

.auth-card__body :deep(button[type='submit']:not(:disabled):active) {
  box-shadow: 1px 1px 0 var(--ds-shadow-color);
  transform: translate(3px, 3px);
}

@media (max-width: 600px) {
  .auth-shell__shape {
    opacity: 0.45;
  }

  .auth-card__body {
    padding: 24px 20px 26px;
  }
}
</style>
