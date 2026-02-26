import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status') || 'unknown'
  const orderNo = searchParams.get('orderNo') || '-'
  const plan = searchParams.get('plan') || '-'

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-10">
      <h1 className="text-3xl font-bold">Payment Result</h1>
      <p className="mt-6 text-sm">Status: <span className="font-semibold">{status}</span></p>
      <p className="mt-1 text-sm">Order No: <span className="font-semibold">{orderNo}</span></p>
      <p className="mt-1 text-sm">Plan: <span className="font-semibold">{plan}</span></p>
      <div className="mt-6 flex gap-3 text-sm">
        <Link className="text-indigo-600" to="/">Back home</Link>
        <Link className="text-indigo-600" to="/go-premium">Premium center</Link>
      </div>
    </main>
  )
}
