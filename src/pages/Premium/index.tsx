import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaymentCheckout } from '@/pages/Payment'
import { businessSessionAtom } from '@/store/businessAtom'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import IconCheck from '~icons/tabler/check'
import IconCrown from '~icons/tabler/crown'

type Plan = {
  code: string
  name: string
  subtitle: string
  days: number
  price: number
  originalPrice: number
  badge?: string
  description: string
  features: string[]
  accent: 'sky' | 'emerald' | 'amber'
}

const plans: Plan[] = [
  {
    code: 'monthly',
    name: '月度会员',
    subtitle: '适合先体验',
    days: 30,
    price: 19,
    originalPrice: 29,
    description: '轻量解锁全部会员功能，适合短期冲刺练习。',
    features: ['完整词库与文章练习', '打字进度统计', '跨端同步学习记录'],
    accent: 'sky',
  },
  {
    code: 'quarterly',
    name: '季度会员',
    subtitle: '性价比优选',
    days: 90,
    price: 49,
    originalPrice: 87,
    badge: '推荐',
    description: '学习节奏更稳定，适合持续提升打字和词汇效率。',
    features: ['全部会员功能', '优先体验新功能', '阶段学习数据复盘'],
    accent: 'emerald',
  },
  {
    code: 'yearly',
    name: '年度会员',
    subtitle: '长期成长计划',
    days: 365,
    price: 159,
    originalPrice: 348,
    description: '长期使用成本最低，适合把日常训练变成稳定习惯。',
    features: ['全部会员功能', '年度成长轨迹', '专属会员活动权益'],
    accent: 'amber',
  },
]

function formatExpire(expiresAt?: string) {
  if (!expiresAt) {
    return '未开通'
  }
  return new Date(expiresAt).toLocaleDateString()
}

function getAccentClass(accent: Plan['accent'], isRecommended: boolean) {
  if (accent === 'emerald') {
    return isRecommended
      ? 'border-emerald-300 bg-emerald-50/60 shadow-emerald-100/80 dark:border-emerald-500/50 dark:bg-emerald-500/10'
      : 'border-emerald-200/80 bg-white dark:border-emerald-700/40 dark:bg-slate-900'
  }
  if (accent === 'amber') {
    return 'border-amber-200/80 bg-white dark:border-amber-700/40 dark:bg-slate-900'
  }
  return 'border-sky-200/80 bg-white dark:border-sky-700/40 dark:bg-slate-900'
}

export default function PremiumPage() {
  const session = useAtomValue(businessSessionAtom)
  const navigate = useNavigate()
  const loginPath = '/login?redirect=%2Fgo-premium'
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('monthly')
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)
  const [paySuccessMessage, setPaySuccessMessage] = useState('')

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0]
  }, [selectedPlanCode])

  const openPayDialog = (planCode: string) => {
    if (!session) {
      navigate(loginPath)
      return
    }
    setSelectedPlanCode(planCode)
    setPaySuccessMessage('')
    setIsPayDialogOpen(true)
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-y-auto px-4 py-8 md:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-7 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
        <div className="pointer-events-none absolute -right-20 -top-16 h-44 w-44 rounded-full bg-sky-100/80 blur-3xl dark:bg-sky-500/20" />
        <div className="dark:bg-emerald-500/15 pointer-events-none absolute -bottom-16 left-20 h-40 w-40 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <IconCrown className="h-3.5 w-3.5" />
            会员中心
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">选择适合你的会员套餐</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">解锁完整练习功能、进度统计和长期学习数据，按你的节奏持续提升。</p>
        </div>
      </section>

      {session ? (
        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          当前账号：<span className="font-semibold">{session.displayName}</span>（{session.email}），会员到期时间：
          <span className="font-semibold"> {formatExpire(session.premiumExpiresAt)}</span>
        </p>
      ) : (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-500/10 dark:text-amber-300">
          购买前请先{' '}
          <Link className="font-semibold underline" to={loginPath}>
            登录账号
          </Link>
          。
        </p>
      )}
      {paySuccessMessage ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          {paySuccessMessage}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <section
            className={`relative rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:shadow-none ${getAccentClass(
              plan.accent,
              Boolean(plan.badge),
            )}`}
            key={plan.code}
          >
            {plan.badge && (
              <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
                {plan.badge}
              </span>
            )}
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{plan.subtitle}</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.days} 天会员时长</p>

            <div className="mt-4">
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                ¥{plan.price}
                <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">/ {plan.days}天</span>
              </p>
              <p className="mt-1 text-sm text-slate-400 line-through dark:text-slate-500">原价 ¥{plan.originalPrice}</p>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300" key={feature}>
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button className="mt-5 w-full" onClick={() => openPayDialog(plan.code)}>
              立即开通
            </Button>
          </section>
        ))}
      </div>

      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>支付宝开通会员</DialogTitle>
            <DialogDescription>
              当前套餐：{selectedPlan.name}（{selectedPlan.days} 天，¥{selectedPlan.price}）
            </DialogDescription>
          </DialogHeader>
          <PaymentCheckout
            embedded
            showBackLink={false}
            navigateOnPaid={false}
            planCode={selectedPlan.code}
            onPaid={(result) => {
              setIsPayDialogOpen(false)
              setPaySuccessMessage(
                `支付成功，订单 ${result.orderNo} 已完成。会员到期：${formatExpire(result.premiumExpiresAt ?? session?.premiumExpiresAt)}`,
              )
            }}
            onRequireLogin={() => {
              setIsPayDialogOpen(false)
              navigate(loginPath)
            }}
          />
        </DialogContent>
      </Dialog>
    </main>
  )
}
