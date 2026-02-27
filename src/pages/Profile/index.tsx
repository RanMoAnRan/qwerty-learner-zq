import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { getSupabaseClient, isSupabaseConfigured, toBusinessSession } from '@/utils/supabaseAuth'
import { useAtom } from 'jotai'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function isNoRowsError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''
  return code === 'PGRST116'
}

export default function ProfilePage() {
  const [session, setSession] = useAtom(businessSessionAtom)
  const [email, setEmail] = useState(session?.email ?? '')
  const [displayName, setDisplayName] = useState(session?.displayName ?? '')
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const isLogin = Boolean(session?.userId)
  const profileDefaultName = useMemo(() => {
    const trimmedEmail = email.trim()
    return trimmedEmail.includes('@') ? trimmedEmail.split('@')[0] : ''
  }, [email])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoadError('Supabase 环境变量未配置，无法加载个人资料。')
      setIsLoading(false)
      return
    }

    if (!isLogin) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      try {
        setLoadError('')
        setIsLoading(true)
        const supabase = getSupabaseClient()
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          throw userError || new Error('当前登录状态已失效，请重新登录。')
        }

        const user = userData.user
        const nextEmail = (user.email || session?.email || '').trim()
        const metadataDisplayName = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim() : ''
        const nextDisplayName = metadataDisplayName || session?.displayName || nextEmail.split('@')[0] || ''
        const metadataAvatarUrl = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url.trim() : ''

        if (isMounted) {
          setEmail(nextEmail)
          setDisplayName(nextDisplayName)
          setAvatarUrl(metadataAvatarUrl)
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError && !isNoRowsError(profileError)) {
          throw profileError
        }

        if (isMounted) {
          setNickname((profile?.nickname || nextDisplayName || '').trim())
          if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url.trim())
          }
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : '加载个人资料失败。'
          setLoadError(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [isLogin, session?.displayName, session?.email])

  const onSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isLogin) {
      setProfileError('请先登录后再修改个人信息。')
      return
    }
    if (!isSupabaseConfigured()) {
      setProfileError('Supabase 环境变量未配置，无法保存个人资料。')
      return
    }

    const normalizedEmail = email.trim()
    const normalizedDisplayName = displayName.trim()
    const normalizedNickname = nickname.trim()
    const normalizedAvatarUrl = avatarUrl.trim()

    if (!normalizedDisplayName) {
      setProfileError('显示名称不能为空。')
      return
    }
    if (normalizedDisplayName.length > 40) {
      setProfileError('显示名称最多 40 个字符。')
      return
    }
    if (normalizedNickname.length > 40) {
      setProfileError('昵称最多 40 个字符。')
      return
    }
    if (normalizedAvatarUrl && !/^https?:\/\//i.test(normalizedAvatarUrl)) {
      setProfileError('头像地址需要以 http:// 或 https:// 开头。')
      return
    }

    try {
      setIsSavingProfile(true)
      setProfileError('')
      setProfileMessage('')

      const supabase = getSupabaseClient()
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw userError || new Error('当前登录状态已失效，请重新登录。')
      }

      const { data: updateUserData, error: updateUserError } = await supabase.auth.updateUser({
        data: {
          display_name: normalizedDisplayName,
          avatar_url: normalizedAvatarUrl || null,
        },
      })
      if (updateUserError) {
        throw updateUserError
      }

      const { error: profileUpsertError } = await supabase.from('profiles').upsert(
        {
          id: userData.user.id,
          email: normalizedEmail,
          nickname: normalizedNickname || normalizedDisplayName,
          avatar_url: normalizedAvatarUrl || null,
        },
        { onConflict: 'id' },
      )
      if (profileUpsertError) {
        throw profileUpsertError
      }

      const latestUser = updateUserData.user || userData.user
      setSession((previous) => toBusinessSession(latestUser, previous))
      setProfileMessage('个人信息已更新。')
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请稍后重试。'
      setProfileError(message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const onChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isLogin) {
      setPasswordError('请先登录后再修改密码。')
      return
    }
    if (!isSupabaseConfigured()) {
      setPasswordError('Supabase 环境变量未配置，无法修改密码。')
      return
    }

    const normalizedNewPassword = newPassword.trim()
    const normalizedConfirmPassword = confirmPassword.trim()

    if (!normalizedNewPassword || !normalizedConfirmPassword) {
      setPasswordError('请完整填写新密码和确认密码。')
      return
    }
    if (normalizedNewPassword.length < 6) {
      setPasswordError('新密码长度至少 6 位。')
      return
    }
    if (normalizedNewPassword !== normalizedConfirmPassword) {
      setPasswordError('两次输入的新密码不一致。')
      return
    }

    try {
      setIsChangingPassword(true)
      setPasswordError('')
      setPasswordMessage('')

      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password: normalizedNewPassword })
      if (error) {
        throw error
      }

      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('密码修改成功。')
    } catch (error) {
      const message = error instanceof Error ? error.message : '密码修改失败，请稍后重试。'
      setPasswordError(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!isLogin) {
    return (
      <main className="mx-auto flex h-full w-full max-w-xl flex-col justify-center px-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">个人资料</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">登录后可修改个人信息和密码。</p>
        <div className="mt-6">
          <Link className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300" to="/login">
            去登录
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="h-full overflow-auto px-6 py-7">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">个人资料</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">在这里管理你的个人信息与登录密码。</p>
        </div>

        <section className="bg-white/85 rounded-2xl border border-slate-200/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">个人信息</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">显示名称会同步到账号资料。</p>
          {loadError ? <p className="mt-3 text-sm text-red-500">{loadError}</p> : null}
          <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSaveProfile}>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">邮箱（只读）</span>
              <input
                className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                value={email}
                disabled
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">显示名称</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder={profileDefaultName || '请输入显示名称'}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isLoading}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">昵称</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                disabled={isLoading}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">头像 URL（可选）</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="https://example.com/avatar.png"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                disabled={isLoading}
              />
            </label>
            {profileError ? <p className="text-sm text-red-500 md:col-span-2">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm text-emerald-600 md:col-span-2">{profileMessage}</p> : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={isLoading || isSavingProfile}>
                {isSavingProfile ? '保存中...' : '保存个人信息'}
              </Button>
            </div>
          </form>
        </section>

        <section className="bg-white/85 rounded-2xl border border-slate-200/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">修改密码</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">密码至少 6 位，修改后下次登录使用新密码。</p>
          <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onChangePassword}>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">新密码</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                type="password"
                placeholder="至少 6 位"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">确认新密码</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                type="password"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
            {passwordError ? <p className="text-sm text-red-500 md:col-span-2">{passwordError}</p> : null}
            {passwordMessage ? <p className="text-sm text-emerald-600 md:col-span-2">{passwordMessage}</p> : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? '修改中...' : '修改密码'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
