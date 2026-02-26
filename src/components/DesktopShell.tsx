import logo from '@/assets/logo.svg'
import SettingsDialog from '@/components/SettingsDialog'
import { type ComponentType, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import IconBook2 from '~icons/tabler/book-2'
import IconBook from '~icons/tabler/book'
import IconBooks from '~icons/tabler/books'
import IconChartBar from '~icons/tabler/chart-bar'
import IconCircleX from '~icons/tabler/circle-x'
import IconCrown from '~icons/tabler/crown'
import IconHome from '~icons/tabler/home'
import IconSettings from '~icons/tabler/settings'

type NavItem = {
  to: string
  label: string
  hint: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { to: '/', label: '主页', hint: 'Typing', icon: IconHome },
  { to: '/gallery', label: '词库', hint: 'Dictionary', icon: IconBooks },
  { to: '/article', label: '文章', hint: 'Article', icon: IconBook },
  { to: '/article-gallery', label: '文章库', hint: 'Article Gallery', icon: IconBook2 },
  { to: '/error-book', label: '错题本', hint: 'Review', icon: IconCircleX },
  { to: '/analysis', label: '数据统计', hint: 'Analytics', icon: IconChartBar },
]

export default function DesktopShell() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_10%_0%,#dbeafe_0,#e0e7ff_38%,#f8fafc_75%)] p-3 text-slate-800 transition-colors dark:bg-[radial-gradient(circle_at_10%_0%,#0b1220_0,#111827_45%,#020617_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/20" />
      <div className="pointer-events-none absolute -bottom-24 right-8 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />

      <aside className="relative z-10 flex w-[216px] shrink-0 flex-col rounded-[28px] border border-indigo-100 bg-white/82 p-4 text-slate-700 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:shadow-[0_28px_72px_-44px_rgba(2,6,23,0.9)]">
        <div className="flex items-center gap-3 rounded-2xl border border-white/90 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-900/80">
          <img alt="QL" className="h-10 w-10 rounded-xl bg-white p-1.5" src={logo} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">QL</p>
          </div>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded-2xl border px-2.5 py-2.5 transition-all duration-200 ${
                    isActive
                      ? 'border-indigo-200 bg-indigo-100 text-indigo-700 shadow-[0_12px_24px_-16px_rgba(99,102,241,0.65)] dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:text-indigo-200 dark:shadow-[0_16px_28px_-20px_rgba(79,70,229,0.9)]'
                      : 'border-transparent text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80'
                  }`
                }
                end={item.to === '/'}
                key={item.to}
                to={item.to}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/30 dark:group-hover:text-indigo-200">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{item.label}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.hint}</span>
                </span>
              </NavLink>
            )
          })}
          <button
            className={`group flex items-center gap-2.5 rounded-2xl border px-2.5 py-2.5 text-left transition-all duration-200 ${
              isSettingsOpen
                ? 'border-indigo-200 bg-indigo-100 text-indigo-700 shadow-[0_12px_24px_-16px_rgba(99,102,241,0.65)] dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:text-indigo-200 dark:shadow-[0_16px_28px_-20px_rgba(79,70,229,0.9)]'
                : 'border-transparent text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80'
            }`}
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="打开设置对话框"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/30 dark:group-hover:text-indigo-200">
              <IconSettings className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">设置</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Settings</span>
            </span>
          </button>
        </nav>

        <NavLink
          className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100 dark:hover:bg-amber-500/25"
          to="/go-premium"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
            <IconCrown className="h-4 w-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold">会员中心</span>
            <span className="text-[11px] text-amber-700/85 dark:text-amber-100/80">Go Premium</span>
          </span>
        </NavLink>
      </aside>

      <main className="relative z-10 ml-3 min-w-0 flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-white/78 shadow-[0_35px_90px_-55px_rgba(15,23,42,0.85)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/65 dark:shadow-[0_35px_90px_-55px_rgba(2,6,23,1)]">
        <div className="h-full w-full overflow-hidden p-4">
          <div className="h-full overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-white via-white to-indigo-50/70 dark:border-slate-700/60 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/70">
            <Outlet />
          </div>
        </div>
      </main>

      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
