import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const { login }                 = useAuth()
  const navigate                  = useNavigate()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.register(email, password, fullName || undefined)
      login(data.access_token, data.user)
      navigate('/upload')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl text-white">Vestara</span>
        </div>

        <div className="card">
          <h1 className="font-display text-3xl mb-2">Create account</h1>
          <p className="text-slate-400 mb-8">Start your AI-powered investment journey</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Full Name (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="Jane Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
