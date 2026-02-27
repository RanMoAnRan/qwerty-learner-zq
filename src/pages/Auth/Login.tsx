import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { getSupabaseClient, isSupabaseConfigured, toBusinessSession } from '@/utils/supabaseAuth'
import { useAtom } from 'jotai'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [session, setSession] = useAtom(businessSessionAtom)
  const [email, setEmail] = useState(session?.email ?? '')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    const normalizedPassword = password.trim()
    if (!normalizedEmail || !normalizedPassword) {
      setError('请输入邮箱和密码。')
      return
    }
    if (!isSupabaseConfigured()) {
      setError('Supabase 环境变量未配置，无法完成登录。')
      return
    }

    try {
      setError('')
      setIsSubmitting(true)
      const supabase = getSupabaseClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      })
      if (signInError) {
        throw signInError
      }
      const user = data.user
      if (!user) {
        throw new Error('登录成功但未获取到用户信息，请稍后重试。')
      }
      setSession((previous) => toBusinessSession(user, previous))
      navigate('/')
    } catch (err) {
      const signInMessage = err instanceof Error ? err.message : '登录失败，请检查邮箱和密码。'
      setError(signInMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">邮箱登录</h1>
      <p className="mt-2 text-sm text-slate-500">使用邮箱和你设置的密码登录。</p>
      <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="邮箱"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="密码"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '登录中...' : '登录'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        没有账号？
        <Link className="text-indigo-600" to="/sign-up">
          去注册
        </Link>
      </p>
    </main>
  )
}
