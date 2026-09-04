import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(event => {
  if (event.path.startsWith('/api/')) setHeader(event, 'Cache-Control', 'private, no-store')
})
