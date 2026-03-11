import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const navigate                = useNavigate()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      login(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl text-white">Vestara</span>
        </div>

        <div className="card">
          <h1 className="font-display text-3xl mb-2">Welcome back</h1>
          <p className="text-slate-400 mb-8">Sign in to your investment dashboard</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
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
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
