import { defineEventHandler, getHeader, getMethod, setHeader, setResponseStatus } from 'h3'
import { mobileAllowedOrigins } from '../../shared/deployment'

export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin')
  const allowedOrigins = mobileAllowedOrigins(String(useRuntimeConfig(event).mobileAllowedOrigins || ''))

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
