import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const payload = await request.json()

  // TODO: 1) create order in database
  // TODO: 2) call alipay API
  // TODO: 3) return payment URL or params for client
  return Response.json({
    ok: true,
    provider: 'alipay',
    mock: true,
    payload,
  })
})
