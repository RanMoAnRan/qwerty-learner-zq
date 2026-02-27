import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

type PlanMeta = {
  code: string
  days: number
  amount: number
}

const planMap: Record<string, PlanMeta> = {
  monthly: { code: 'monthly', days: 30, amount: 19 },
  quarterly: { code: 'quarterly', days: 90, amount: 49 },
  yearly: { code: 'yearly', days: 365, amount: 159 },
}

function addDays(baseDate: Date, days: number) {
  const target = new Date(baseDate)
  target.setDate(target.getDate() + days)
  return target.toISOString()
}

function maxDate(now: Date, expiresAt?: string) {
  if (!expiresAt) {
    return now
  }
  const existing = new Date(expiresAt)
  if (Number.isNaN(existing.getTime())) {
    return now
  }
  return existing > now ? existing : now
}

function buildOrderNo() {
  const now = Date.now()
  return `ORD${now}`
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [session, setSession] = useAtom(businessSessionAtom)
  const planCode = searchParams.get('plan') || 'monthly'

  const plan = useMemo(() => {
    return planMap[planCode] ?? planMap.monthly
  }, [planCode])

  const onPay = () => {
    if (!session) {
      navigate('/login')
      return
    }
    const orderNo = buildOrderNo()
    const base = maxDate(new Date(), session.premiumExpiresAt)
    const premiumExpiresAt = addDays(base, plan.days)
    setSession({ ...session, premiumExpiresAt })
    navigate(`/payment/result?status=success&orderNo=${orderNo}&plan=${plan.code}`)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-10">
      <h1 className="text-3xl font-bold">Payment</h1>
      <p className="mt-2 text-sm text-slate-600">Use this page to connect real payment functions later.</p>

      {!session ? (
        <p className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Please{' '}
          <Link className="font-semibold underline" to="/login">
            login
          </Link>{' '}
          first.
        </p>
      ) : null}

      <section className="mt-6 rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <p className="mt-2 text-sm text-slate-600">Plan: {plan.code}</p>
        <p className="mt-1 text-sm text-slate-600">Duration: {plan.days} days</p>
        <p className="mt-1 text-sm text-slate-600">Amount: CNY {plan.amount}</p>
        <Button className="mt-4 w-full" onClick={onPay}>
          Pay Now (Mock)
        </Button>
      </section>

      <div className="mt-4 text-sm text-slate-600">
        Need a different plan?{' '}
        <Link className="text-indigo-600" to="/go-premium">
          Back to premium page
        </Link>
      </div>
    </main>
  )
}
