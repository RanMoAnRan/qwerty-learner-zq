import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { getSupabaseClient, isSupabaseConfigured } from '@/utils/supabaseAuth'
import { cn } from '@/utils/ui'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

type PlanMeta = {
  code: string
  name: string
  days: number
  amount: number
}

const planMap: Record<string, PlanMeta> = {
  monthly: { code: 'monthly', name: '月度会员', days: 30, amount: 19 },
  quarterly: { code: 'quarterly', name: '季度会员', days: 90, amount: 49 },
  yearly: { code: 'yearly', name: '年度会员', days: 365, amount: 159 },
}

type CreatePaymentResponse = {
  ok: boolean
  provider: 'alipay'
  orderNo: string
  planCode: string
  amount: number
  orderStatus: string
  qrCode?: string
  payUrl?: string
  premiumExpiresAt?: string | null
  mock?: boolean
  error?: string
}

type OrderStatusResponse = {
  ok: boolean
  orderNo: string
  orderStatus: string
  amount: number
  premiumExpiresAt?: string | null
  paidAt?: string | null
  error?: string
}

function buildQrImageSrc(qrCode: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`
}

function formatOrderStatus(status: string) {
  if (status === 'pending') return '待支付'
  if (status === 'paid') return '已支付'
  if (status === 'closed') return '已关闭'
  if (status === 'failed') return '支付失败'
  return status
}

function getPlanMeta(planCode: string) {
  return planMap[planCode] ?? planMap.monthly
}

type PaidResult = {
  orderNo: string
  planCode: string
  premiumExpiresAt?: string | null
}

type PaymentCheckoutProps = {
  planCode: string
  embedded?: boolean
  showBackLink?: boolean
  navigateOnPaid?: boolean
  className?: string
  onPaid?: (result: PaidResult) => void
  onRequireLogin?: () => void
}

export function PaymentCheckout({
  planCode,
  embedded = false,
  showBackLink = true,
  navigateOnPaid = true,
  className,
  onPaid,
  onRequireLogin,
}: PaymentCheckoutProps) {
  const [session, setSession] = useAtom(businessSessionAtom)
  const navigate = useNavigate()

  const plan = useMemo(() => {
    return getPlanMeta(planCode)
  }, [planCode])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [orderNo, setOrderNo] = useState('')
  const [orderStatus, setOrderStatus] = useState<'idle' | 'pending' | 'paid' | 'closed' | 'failed'>('idle')
  const [payUrl, setPayUrl] = useState('')
  const [qrCode, setQrCode] = useState('')

  const updatePremiumExpires = useCallback(
    (premiumExpiresAt?: string | null) => {
      if (!session || !premiumExpiresAt) {
        return
      }
      setSession((previous) => {
        if (!previous) {
          return previous
        }
        return { ...previous, premiumExpiresAt }
      })
    },
    [session, setSession],
  )

  const queryOrderStatus = useCallback(async (targetOrderNo: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase 环境变量未配置，无法查询订单。')
    }
    const supabase = getSupabaseClient()
    const { data, error: invokeError } = await supabase.functions.invoke<OrderStatusResponse>('alipay-payment', {
      body: {
        action: 'status',
        orderNo: targetOrderNo,
      },
    })
    if (invokeError) {
      throw invokeError
    }
    if (!data || !data.ok) {
      throw new Error(data?.error || '查询订单状态失败。')
    }
    return data
  }, [])

  const handlePaid = useCallback(
    (targetOrderNo: string, premiumExpiresAt?: string | null) => {
      updatePremiumExpires(premiumExpiresAt)
      setOrderStatus('paid')
      onPaid?.({
        orderNo: targetOrderNo,
        planCode: plan.code,
        premiumExpiresAt,
      })
      if (!navigateOnPaid) {
        setMessage('支付成功，会员已开通。')
        return
      }
      const search = new URLSearchParams({
        status: 'success',
        orderNo: targetOrderNo,
        plan: plan.code,
      })
      if (premiumExpiresAt) {
        search.set('expiresAt', premiumExpiresAt)
      }
      navigate(`/payment/result?${search.toString()}`)
    },
    [navigate, navigateOnPaid, onPaid, plan.code, updatePremiumExpires],
  )

  const refreshOrderStatus = useCallback(
    async (targetOrderNo: string) => {
      const data = await queryOrderStatus(targetOrderNo)
      if (data.orderStatus === 'paid') {
        handlePaid(targetOrderNo, data.premiumExpiresAt)
        return
      }
      if (data.orderStatus === 'closed') {
        setOrderStatus('closed')
        setMessage('订单已关闭，请重新发起支付。')
        return
      }
      if (data.orderStatus === 'failed') {
        setOrderStatus('failed')
        setMessage('订单支付失败，请重新发起支付。')
        return
      }
      setOrderStatus('pending')
    },
    [handlePaid, queryOrderStatus],
  )

  useEffect(() => {
    if (!orderNo || orderStatus !== 'pending') {
      return
    }
    const timer = window.setInterval(() => {
      void refreshOrderStatus(orderNo).catch((queryError) => {
        const message = queryError instanceof Error ? queryError.message : '查询订单状态失败。'
        setError(message)
      })
    }, 3000)
    return () => window.clearInterval(timer)
  }, [orderNo, orderStatus, refreshOrderStatus])

  const onPay = async () => {
    if (!session) {
      if (onRequireLogin) {
        onRequireLogin()
      } else {
        navigate('/login')
      }
      return
    }
    if (!isSupabaseConfigured()) {
      setError('Supabase 环境变量未配置，无法发起支付。')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setMessage('')
      const supabase = getSupabaseClient()
      const { data, error: invokeError } = await supabase.functions.invoke<CreatePaymentResponse>('alipay-payment', {
        body: {
          action: 'create',
          planCode: plan.code,
        },
      })
      if (invokeError) {
        throw invokeError
      }
      if (!data || !data.ok) {
        throw new Error(data?.error || '创建订单失败。')
      }

      setOrderNo(data.orderNo)
      setPayUrl(data.payUrl || '')
      setQrCode(data.qrCode || '')

      if (data.orderStatus === 'paid') {
        handlePaid(data.orderNo, data.premiumExpiresAt)
        return
      }

      setOrderStatus('pending')
      setMessage('订单已创建，请在支付宝完成支付。')
    } catch (payError) {
      const message = payError instanceof Error ? payError.message : '支付请求失败，请稍后重试。'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onManualCheck = async () => {
    if (!orderNo) {
      return
    }
    try {
      setIsChecking(true)
      setError('')
      await refreshOrderStatus(orderNo)
    } catch (queryError) {
      const message = queryError instanceof Error ? queryError.message : '查询订单状态失败。'
      setError(message)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {!session ? (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          请先
          <Link className="font-semibold underline" to="/login">
            登录
          </Link>
          后再支付。
        </p>
      ) : null}

      <section className="mt-4 rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-semibold">订单信息</h2>
        <p className="mt-2 text-sm text-slate-600">套餐：{plan.name}</p>
        <p className="mt-1 text-sm text-slate-600">套餐编码：{plan.code}</p>
        <p className="mt-1 text-sm text-slate-600">时长：{plan.days} 天</p>
        <p className="mt-1 text-sm text-slate-600">金额：¥{plan.amount}</p>
        <Button className="mt-4 w-full" onClick={onPay} disabled={!session || isSubmitting}>
          {isSubmitting ? '下单中...' : '发起支付宝支付'}
        </Button>
      </section>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-emerald-600">{message}</p> : null}

      {orderNo ? (
        <section className="mt-4 rounded-xl border border-slate-200 p-4">
          <h2 className="text-base font-semibold">支付订单</h2>
          <p className="mt-2 text-sm text-slate-600">订单号：{orderNo}</p>
          <p className="mt-1 text-sm text-slate-600">状态：{formatOrderStatus(orderStatus)}</p>
          {qrCode ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              <img className="h-56 w-56 rounded border border-slate-200" src={buildQrImageSrc(qrCode)} alt="支付宝支付二维码" />
              {payUrl ? (
                <a className="text-sm font-medium text-indigo-600 underline" href={payUrl} target="_blank" rel="noreferrer">
                  打开支付宝支付链接
                </a>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4">
            <Button onClick={onManualCheck} disabled={isChecking}>
              {isChecking ? '查询中...' : '我已支付，刷新状态'}
            </Button>
          </div>
        </section>
      ) : null}

      {showBackLink && !embedded ? (
        <div className="mt-4 text-sm text-slate-600">
          套餐不合适？{' '}
          <Link className="text-indigo-600" to="/go-premium">
            返回会员中心重新选择
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams()
  const planCode = searchParams.get('plan') || 'monthly'

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-10">
      <h1 className="text-3xl font-bold">支付宝开通会员</h1>
      <p className="mt-2 text-sm text-slate-600">下单后请使用支付宝扫码支付，系统会自动确认到账。</p>
      <PaymentCheckout planCode={planCode} />
    </main>
  )
}
