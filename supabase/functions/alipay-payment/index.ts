import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[]
type JsonObject = { [key: string]: JsonValue }

type PaymentAction = 'create' | 'status'

type PlanRecord = {
  id: string
  code: string
  name: string
  price_cny: number
  duration_days: number
}

type OrderRecord = {
  id: string
  order_no: string
  user_id: string
  plan_id: string
  channel: string
  amount: number
  status: string
  created_at: string
  paid_at: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY。')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

function jsonResponse(data: JsonObject, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  })
}

function normalizePem(pem: string) {
  return pem.replace(/\\n/g, '\n').trim()
}

function getPemContent(pem: string) {
  return normalizePem(pem)
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
}

function fromBase64(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function signRsa2(content: string, privateKeyPem: string) {
  const keyData = fromBase64(getPemContent(privateKeyPem))
  const cryptoKey = await crypto.subtle.importKey('pkcs8', keyData.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(content))
  return toBase64(new Uint8Array(signature))
}

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function buildSignContent(params: Record<string, string>) {
  return Object.keys(params)
    .filter((key) => key !== 'sign' && key !== 'sign_type' && params[key] !== undefined && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
}

function getAuthorizationToken(request: Request) {
  const authorization = request.headers.get('Authorization') ?? ''
  if (!authorization.startsWith('Bearer ')) {
    return ''
  }
  return authorization.slice('Bearer '.length).trim()
}

async function requireUserId(request: Request) {
  const token = getAuthorizationToken(request)
  if (!token) {
    throw new Error('未登录，无法创建订单。')
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    throw new Error('登录态失效，请重新登录。')
  }
  return data.user.id
}

function generateOrderNo() {
  const now = Date.now()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ALI${now}${random}`
}

function parsePlanCode(value: unknown) {
  const code = typeof value === 'string' ? value.trim() : ''
  if (!code) {
    return 'monthly'
  }
  return code
}

async function getPlan(planCode: string) {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('id, code, name, price_cny, duration_days')
    .eq('code', planCode)
    .eq('is_active', true)
    .single<PlanRecord>()
  if (error || !data) {
    throw new Error(`套餐不可用：${planCode}`)
  }
  return data
}

function getAlipayEnv() {
  const mockMode = (Deno.env.get('ALIPAY_MOCK') ?? '').toLowerCase() === 'true'
  const appId = Deno.env.get('ALIPAY_APP_ID') ?? ''
  const privateKey = Deno.env.get('ALIPAY_PRIVATE_KEY') ?? ''
  const gateway = Deno.env.get('ALIPAY_GATEWAY') || 'https://openapi.alipay.com/gateway.do'
  return {
    mockMode,
    appId,
    privateKey,
    gateway,
  }
}

async function callAlipayApi(params: { method: string; bizContent: JsonObject }) {
  const { appId, privateKey, gateway } = getAlipayEnv()
  if (!appId || !privateKey) {
    throw new Error('支付宝参数未配置，请设置 ALIPAY_APP_ID 和 ALIPAY_PRIVATE_KEY。')
  }

  const requestParams: Record<string, string> = {
    app_id: appId,
    method: params.method,
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: formatTimestamp(),
    version: '1.0',
    biz_content: JSON.stringify(params.bizContent),
  }

  const signContent = buildSignContent(requestParams)
  const sign = await signRsa2(signContent, privateKey)
  const formData = new URLSearchParams({ ...requestParams, sign })

  const response = await fetch(gateway, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`支付宝网关请求失败：HTTP ${response.status}`)
  }

  const json = (await response.json()) as Record<string, unknown>
  const responseKey = `${params.method.replace(/\./g, '_')}_response`
  const data = json[responseKey] as Record<string, unknown> | undefined
  if (!data) {
    throw new Error('支付宝返回格式异常。')
  }

  if (String(data.code ?? '') !== '10000') {
    const errorMessage = String(data.sub_msg ?? data.msg ?? '支付宝返回失败')
    throw new Error(errorMessage)
  }

  return data
}

async function markOrderPaid(args: { orderNo: string; providerTxnId: string; paidAmount: number; rawPayload: JsonObject }) {
  const { data, error } = await supabaseAdmin.rpc('mark_order_paid', {
    p_order_no: args.orderNo,
    p_provider: 'alipay',
    p_provider_txn_id: args.providerTxnId,
    p_paid_amount: args.paidAmount,
    p_raw_payload: args.rawPayload,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : null
  return {
    premiumExpiresAt: (row?.premium_expires_at as string | undefined) ?? null,
    alreadyPaid: Boolean(row?.already_paid),
  }
}

function parsePaidAmount(totalAmount: unknown) {
  const value = Number(totalAmount)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('支付宝返回金额异常。')
  }
  if (!Number.isInteger(value)) {
    throw new Error('当前仅支持整数金额（单位元）。')
  }
  return value
}

async function createOrder(request: Request, payload: Record<string, unknown>) {
  const userId = await requireUserId(request)
  const planCode = parsePlanCode(payload.planCode)
  const plan = await getPlan(planCode)
  const orderNo = generateOrderNo()

  const { data: createdOrder, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_no: orderNo,
      user_id: userId,
      plan_id: plan.id,
      channel: 'alipay',
      amount: plan.price_cny,
      status: 'pending',
    })
    .select('id, order_no, user_id, plan_id, channel, amount, status, created_at, paid_at')
    .single<OrderRecord>()

  if (orderError || !createdOrder) {
    throw new Error(orderError?.message || '创建订单失败。')
  }

  const { mockMode } = getAlipayEnv()
  if (mockMode) {
    const paid = await markOrderPaid({
      orderNo,
      providerTxnId: `MOCK_${orderNo}`,
      paidAmount: plan.price_cny,
      rawPayload: { mock: true, order_no: orderNo },
    })
    return jsonResponse({
      ok: true,
      provider: 'alipay',
      orderNo,
      planCode: plan.code,
      amount: plan.price_cny,
      orderStatus: 'paid',
      premiumExpiresAt: paid.premiumExpiresAt,
      mock: true,
    })
  }

  try {
    const alipayResponse = await callAlipayApi({
      method: 'alipay.trade.precreate',
      bizContent: {
        out_trade_no: orderNo,
        total_amount: String(plan.price_cny),
        subject: `Qwerty Learner ${plan.name}`,
        timeout_express: '15m',
      },
    })

    const qrCode = String(alipayResponse.qr_code ?? '')
    if (!qrCode) {
      throw new Error('支付宝未返回支付二维码。')
    }

    return jsonResponse({
      ok: true,
      provider: 'alipay',
      orderNo,
      planCode: plan.code,
      amount: plan.price_cny,
      orderStatus: 'pending',
      qrCode,
      payUrl: qrCode,
    })
  } catch (error) {
    await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', createdOrder.id)
    throw error
  }
}

async function refreshPendingOrder(order: OrderRecord) {
  const alipayResponse = await callAlipayApi({
    method: 'alipay.trade.query',
    bizContent: {
      out_trade_no: order.order_no,
    },
  })

  const tradeStatus = String(alipayResponse.trade_status ?? '')
  if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
    const paidAmount = parsePaidAmount(alipayResponse.total_amount)
    const paid = await markOrderPaid({
      orderNo: order.order_no,
      providerTxnId: String(alipayResponse.trade_no ?? `ALI_${order.order_no}`),
      paidAmount,
      rawPayload: alipayResponse as JsonObject,
    })
    return {
      orderStatus: 'paid',
      premiumExpiresAt: paid.premiumExpiresAt,
    }
  }

  if (tradeStatus === 'TRADE_CLOSED') {
    await supabaseAdmin.from('orders').update({ status: 'closed' }).eq('id', order.id)
    return {
      orderStatus: 'closed',
      premiumExpiresAt: null,
    }
  }

  return {
    orderStatus: order.status,
    premiumExpiresAt: null,
  }
}

async function getOrderStatus(request: Request, payload: Record<string, unknown>) {
  const userId = await requireUserId(request)
  const orderNo = typeof payload.orderNo === 'string' ? payload.orderNo.trim() : ''
  if (!orderNo) {
    return jsonResponse({ ok: false, error: '缺少 orderNo。' }, 400)
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, user_id, plan_id, channel, amount, status, created_at, paid_at')
    .eq('order_no', orderNo)
    .eq('user_id', userId)
    .single<OrderRecord>()

  if (orderError || !order) {
    return jsonResponse({ ok: false, error: '订单不存在。' }, 404)
  }

  let orderStatus = order.status
  let premiumExpiresAt: string | null = null

  if (order.status === 'pending') {
    const { mockMode } = getAlipayEnv()
    if (mockMode) {
      const paid = await markOrderPaid({
        orderNo,
        providerTxnId: `MOCK_${orderNo}`,
        paidAmount: order.amount,
        rawPayload: { mock: true, order_no: orderNo },
      })
      orderStatus = 'paid'
      premiumExpiresAt = paid.premiumExpiresAt
    } else {
      const refreshed = await refreshPendingOrder(order)
      orderStatus = refreshed.orderStatus
      premiumExpiresAt = refreshed.premiumExpiresAt
    }
  }

  if (!premiumExpiresAt && orderStatus === 'paid') {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('end_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('end_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    premiumExpiresAt = subscription?.end_at ?? null
  }

  return jsonResponse({
    ok: true,
    orderNo: order.order_no,
    orderStatus,
    amount: order.amount,
    premiumExpiresAt,
    paidAt: order.paid_at,
  })
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const action = (typeof payload.action === 'string' ? payload.action : 'create') as PaymentAction

    if (action === 'status') {
      return await getOrderStatus(request, payload)
    }

    return await createOrder(request, payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : '支付请求失败。'
    return jsonResponse({ ok: false, error: message }, 400)
  }
})
