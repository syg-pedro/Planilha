import { defineEventHandler, getHeader, getMethod, setHeader, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin')
  const allowedOrigins = String(useRuntimeConfig(event).mobileAllowedOrigins || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (!origin || !allowedOrigins.includes(origin)) return

  setHeader(event, 'Access-Control-Allow-Origin', origin)
  setHeader(event, 'Vary', 'Origin')
  setHeader(event, 'Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Edit-Key')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
