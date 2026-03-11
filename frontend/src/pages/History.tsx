import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import { History as HistoryIcon, RefreshCw } from 'lucide-react'
import { portfolioApi, HistoryPoint } from '../services/api'

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export default function History() {
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await portfolioApi.getHistory()
      setHistory(data.history)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
            <HistoryIcon className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="font-display text-3xl">Portfolio History</h1>
            <p className="text-slate-400 text-sm">{history.length} snapshots recorded</p>
          </div>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          No history yet. Upload a portfolio to start tracking.
        </div>
      ) : (
        <>
          {/* Value chart */}
          <div className="card">
            <h3 className="font-medium mb-4">Portfolio Value Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b6ef2" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#5b6ef2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232736" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  contentStyle={{ background: '#171923', border: '1px solid #232736', borderRadius: 12 }}
                  formatter={(v: number) => [fmt(v), 'Value']}
                />
                <Area type="monotone" dataKey="total_value" stroke="#5b6ef2" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Scores chart */}
          <div className="card">
            <h3 className="font-medium mb-4">Risk & Diversification Scores</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232736" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#171923', border: '1px solid #232736', borderRadius: 12 }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Line type="monotone" dataKey="risk_score" stroke="#ef4444" name="Risk Score" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="diversification_score" stroke="#22c55e" name="Diversification" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card">
            <h3 className="font-medium mb-4">Snapshot Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-surface-border">
                    {['Date', 'Total Value', 'Risk Score', 'Diversification'].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {[...history].reverse().map((h, i) => (
                    <tr key={i} className="hover:bg-surface-border/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{h.date}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-100">{fmt(h.total_value)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono ${h.risk_score > 7 ? 'text-red-400' : h.risk_score > 4 ? 'text-amber-400' : 'text-green-400'}`}>
                          {h.risk_score?.toFixed(2) ?? '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono ${h.diversification_score > 7 ? 'text-green-400' : h.diversification_score > 4 ? 'text-amber-400' : 'text-red-400'}`}>
                          {h.diversification_score?.toFixed(2) ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
