import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { getSupabaseClient, isSupabaseConfigured, toBusinessSession } from '@/utils/supabaseAuth'
import { useAtom } from 'jotai'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

function resolveSafeRedirectPath(value: string | null | undefined, fallback = '/go-premium') {
  const normalized = (value || '').trim()
  if (!normalized) {
    return fallback
  }
  if (!normalized.startsWith('/') || normalized.startsWith('//')) {
    return fallback
  }
  return normalized
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : ''
  }
  return ''
}

function isRateLimitError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code ?? '').toLowerCase() : ''
  const errorCode =
    typeof error === 'object' && error !== null && 'error_code' in error
      ? String((error as { error_code?: unknown }).error_code ?? '').toLowerCase()
      : ''
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: unknown }).status) : NaN

  return (
    message.includes('rate limit') ||
    message.includes('ratelimit') ||
    message.includes('too many requests') ||
    code.includes('rate_limit') ||
    errorCode.includes('rate_limit') ||
    status === 429
  )
}

function isEmailExistsError(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('email_exists') || normalized.includes('already registered') || normalized.includes('duplicate')
}

export default function SignUpPage() {
  const [, setSession] = useAtom(businessSessionAtom)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectPath = resolveSafeRedirectPath(searchParams.get('redirect'), '/go-premium')
  const loginPath = `/login?redirect=${encodeURIComponent(redirectPath)}`

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    const normalizedPassword = password.trim()
    const normalizedConfirmPassword = confirmPassword.trim()

    if (!normalizedEmail || !normalizedPassword || !normalizedConfirmPassword) {
      setError('请完整填写邮箱和密码。')
      return
    }
    if (normalizedPassword.length < 6) {
      setError('密码长度至少 6 位。')
      return
    }
    if (normalizedPassword !== normalizedConfirmPassword) {
      setError('两次输入的密码不一致。')
      return
    }
    if (!isSupabaseConfigured()) {
      setError('Supabase 环境变量未配置，无法完成注册。')
      return
    }

    try {
      setError('')
      setMessage('')
      setIsSubmitting(true)
      const supabase = getSupabaseClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
      })
      if (signUpError) {
        throw signUpError
      }
      const user = data.user
      if (!user) {
        throw new Error('注册成功但未获取到用户信息，请稍后重试。')
      }

      // 若项目开启了“邮箱确认后才能登录”，signUp 可能不会返回 session，此处尝试主动登录一次。
      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        })
        if (signInError || !signInData.user) {
          throw signInError || new Error('注册成功，但自动登录失败。请前往登录页手动登录。')
        }
        setSession((previous) => toBusinessSession(signInData.user, previous))
        navigate(redirectPath)
        return
      }

      setSession((previous) => toBusinessSession(user, previous))
      navigate(redirectPath)
    } catch (err) {
      const signUpMessage = getErrorMessage(err) || '注册失败，请检查邮箱和密码后重试。'
      if (isRateLimitError(err)) {
        try {
          const supabase = getSupabaseClient()
          const { error: registerFallbackError } = await supabase.rpc('register_user_with_password', {
            p_email: normalizedEmail,
            p_password: normalizedPassword,
          })

          if (registerFallbackError && !isEmailExistsError(registerFallbackError.message)) {
            throw registerFallbackError
          }

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: normalizedPassword,
          })
          if (signInError || !signInData.user) {
            throw signInError || new Error('注册成功，但自动登录失败。请前往登录页登录。')
          }
          setSession((previous) => toBusinessSession(signInData.user, previous))
          setMessage('已通过备用通道完成注册并自动登录。')
          navigate(redirectPath)
          return
        } catch {
          setError('注册请求过于频繁，且备用注册失败。请稍后重试或联系管理员。')
          return
        }
      } else {
        setError(signUpMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">邮箱注册</h1>
      <p className="mt-2 text-sm text-slate-500">使用邮箱和密码直接注册。</p>
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
          placeholder="设置密码（至少 6 位）"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="确认密码"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '注册中...' : '完成注册并设置密码'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        已有账号？
        <Link className="text-indigo-600" to={loginPath}>
          去登录
        </Link>
      </p>
    </main>
  )
}
