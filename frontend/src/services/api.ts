import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, full_name }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  me: () => api.get<User>('/auth/me'),
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export interface Holding {
  symbol: string
  quantity: number
  price: number
  sector: string
  asset_class: string
  beta: number
  value: number
  weight_pct: number
}

export interface Analysis {
  portfolio_id: string
  total_value: number
  risk_score: number
  diversification_score: number
  sector_distribution: Record<string, number>
  asset_allocation: Record<string, number>
  holdings: Holding[]
  created_at: string
}

export interface HistoryPoint {
  date: string
  total_value: number
  risk_score: number
  diversification_score: number
}

export const portfolioApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<{ portfolio_id: string; analysis: Analysis & { ai_insights: string } }>('/portfolio/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAnalysis: () => api.get<Analysis>('/portfolio/analysis'),

  getInsights: () => api.get<{ insights: string }>('/portfolio/ai-recommendations'),

  getHistory: () => api.get<{ history: HistoryPoint[] }>('/portfolio/history'),
}
