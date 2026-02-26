import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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

export default function ShareLandingPage() {
  const { resourceType = 'dict', token = '' } = useParams()
  const [session, setSession] = useAtom(businessSessionAtom)
  const [message, setMessage] = useState('Redeem this shared token to unlock 3 premium days (mock).')

  const onRedeem = () => {
    if (!token) {
      setMessage('Invalid token.')
      return
    }
    if (!session) {
      setMessage('Please login before redeeming.')
      return
    }

    const key = `share_redeem_${token}`
    const redeemedBy = localStorage.getItem(key)
    if (redeemedBy) {
      setMessage('This token has already been redeemed.')
      return
    }

    const base = maxDate(new Date(), session.premiumExpiresAt)
    const premiumExpiresAt = addDays(base, 3)
    setSession({ ...session, premiumExpiresAt })
    localStorage.setItem(key, session.userId)
    setMessage('Redeem successful: premium extended by 3 days (mock).')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10">
      <h1 className="text-3xl font-bold">Share Landing</h1>
      <p className="mt-2 text-sm text-slate-600">Resource type: {resourceType}</p>
      <p className="mt-1 text-sm text-slate-600">Token: {token || '-'}</p>

      <section className="mt-6 rounded-xl border border-slate-200 p-4">
        <p className="text-sm text-slate-700">{message}</p>
        <Button className="mt-4" onClick={onRedeem}>Redeem</Button>
      </section>

      <div className="mt-6 text-sm">
        {!session ? (
          <Link className="text-indigo-600" to="/login">Go login</Link>
        ) : (
          <Link className="text-indigo-600" to="/go-premium">Check premium status</Link>
        )}
      </div>
    </main>
  )
}
