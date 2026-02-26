import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { useAtomValue } from 'jotai'
import { Link, useNavigate } from 'react-router-dom'

type Plan = {
  code: string
  name: string
  days: number
  price: number
}

const plans: Plan[] = [
  { code: 'monthly', name: 'Monthly', days: 30, price: 19 },
  { code: 'quarterly', name: 'Quarterly', days: 90, price: 49 },
  { code: 'yearly', name: 'Yearly', days: 365, price: 159 },
]

function formatExpire(expiresAt?: string) {
  if (!expiresAt) {
    return 'Not premium'
  }
  return new Date(expiresAt).toLocaleDateString()
}

export default function PremiumPage() {
  const session = useAtomValue(businessSessionAtom)
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Go Premium</h1>
      <p className="mt-2 text-sm text-slate-600">This page is the secondary-development scaffold for subscription checkout.</p>

      {session ? (
        <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm">
          Signed in as <span className="font-semibold">{session.displayName}</span> ({session.email}), premium until{' '}
          <span className="font-semibold">{formatExpire(session.premiumExpiresAt)}</span>
        </p>
      ) : (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Please <Link className="font-semibold underline" to="/login">login</Link> before purchasing premium.
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <section className="rounded-xl border border-slate-200 p-4" key={plan.code}>
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{plan.days} days</p>
            <p className="mt-4 text-2xl font-bold">CNY {plan.price}</p>
            <Button className="mt-4 w-full" onClick={() => navigate(`/payment?plan=${plan.code}`)}>
              Continue
            </Button>
          </section>
        ))}
      </div>
    </main>
  )
}
