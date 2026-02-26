import { Button } from '@/components/ui/button'
import { businessSessionAtom } from '@/store/businessAtom'
import { useAtom } from 'jotai'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function buildUserId() {
  return `user_${Date.now().toString(36)}`
}

export default function SignUpPage() {
  const [, setSession] = useAtom(businessSessionAtom)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    const finalName = displayName.trim() || email.split('@')[0] || 'qwerty_user'
    setError('')
    setSession({
      userId: buildUserId(),
      email: email.trim(),
      displayName: finalName,
    })
    navigate('/go-premium')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <p className="mt-2 text-sm text-slate-500">Create account for syncing progress and premium.</p>
      <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button type="submit">Create account</Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have account? <Link className="text-indigo-600" to="/login">Login</Link>
      </p>
    </main>
  )
}
