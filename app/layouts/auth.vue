<template>
  <div
    :style="{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }"
  >
    <div
      :style="{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }"
    >
      <div
        :style="{
          padding: '28px 32px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }"
      >
        <div
          style="width: 36px; height: 36px; border-radius: 10px; background: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <p style="font-size: 10px; color: var(--text3); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase">Financeiro</p>
          <p style="font-size: 16px; font-weight: 800; color: var(--text); line-height: 1.2">Familiar</p>
        </div>
      </div>
      <div style="padding: 28px 32px">
        <slot />
      </div>
    </div>
  </div>
</template>
