import { Link, useSearchParams } from 'react-router-dom'

function formatExpiresAt(expiresAt: string | null) {
  if (!expiresAt) {
    return '-'
  }
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleString()
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status') || 'unknown'
  const orderNo = searchParams.get('orderNo') || '-'
  const plan = searchParams.get('plan') || '-'
  const expiresAt = searchParams.get('expiresAt')

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-10">
      <h1 className="text-3xl font-bold">支付结果</h1>
      <p className="mt-6 text-sm">
        状态：<span className="font-semibold">{status}</span>
      </p>
      <p className="mt-1 text-sm">
        订单号：<span className="font-semibold">{orderNo}</span>
      </p>
      <p className="mt-1 text-sm">
        套餐：<span className="font-semibold">{plan}</span>
      </p>
      <p className="mt-1 text-sm">
        会员到期：<span className="font-semibold">{formatExpiresAt(expiresAt)}</span>
      </p>
      <div className="mt-6 flex gap-3 text-sm">
        <Link className="text-indigo-600" to="/go-premium">
          返回会员中心
        </Link>
        <Link className="text-indigo-600" to="/">
          返回首页
        </Link>
      </div>
    </main>
  )
}
