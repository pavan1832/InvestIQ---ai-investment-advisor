import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { Upload, AlertTriangle, RefreshCw } from 'lucide-react'
import { portfolioApi, Analysis, HistoryPoint } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import ScoreGauge from '../components/ScoreGauge'

const PALETTE = ['#5b6ef2','#22c55e','#f59e0b','#ec4899','#06b6d4','#a855f7','#f97316','#14b8a6','#ef4444','#84cc16']

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [history, setHistory]   = useState<HistoryPoint[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [a, h] = await Promise.all([
        portfolioApi.getAnalysis(),
        portfolioApi.getHistory(),
      ])
      setAnalysis(a.data)
      setHistory(h.data.history)
    } catch (err: any) {
      if (err.response?.status === 404) setError('no-portfolio')
      else setError(err.response?.data?.detail || 'Failed to load data')
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

  if (error === 'no-portfolio') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center">
        <Upload className="w-8 h-8 text-brand-400" />
      </div>
      <div>
        <h2 className="font-display text-2xl mb-1">No portfolio yet</h2>
        <p className="text-slate-400">Upload a CSV file to get started with AI-powered analysis.</p>
      </div>
      <Link to="/upload" className="btn-primary">Upload Portfolio</Link>
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-3 text-red-400 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      {error}
    </div>
  )

  const sectorData = Object.entries(analysis!.sector_distribution).map(([name, value]) => ({ name, value }))
  const allocData  = Object.entries(analysis!.asset_allocation).map(([name, value]) => ({ name, value }))
  const riskColor  = analysis!.risk_score > 7 ? 'red' : analysis!.risk_score > 4 ? 'amber' : 'green'
  const divColor   = analysis!.diversification_score > 7 ? 'green' : analysis!.diversification_score > 4 ? 'amber' : 'red'

  const base = 8 + (analysis!.risk_score / 10) * 12
  const returns: Record<string, string> = {
    conservative_1y: (base * 0.7).toFixed(1),
    expected_1y:     base.toFixed(1),
    optimistic_1y:   (base * 1.4).toFixed(1),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'Investor'}</span>
          </h1>
          <p className="text-slate-400 mt-1">Here's your portfolio overview</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total value */}
        <div className="card col-span-1">
          <p className="text-sm text-slate-400 mb-1">Total Portfolio Value</p>
          <p className="font-display text-4xl gradient-text">{fmt(analysis!.total_value)}</p>
          <p className="text-xs text-slate-500 mt-2">
            {analysis!.holdings?.length} holdings · {Object.keys(analysis!.sector_distribution).length} sectors
          </p>
        </div>

        {/* Score gauges */}
        <div className="card flex items-center justify-around">
          <ScoreGauge score={analysis!.risk_score} label="Risk Score" color={riskColor} size="lg" />
          <ScoreGauge score={analysis!.diversification_score} label="Diversification" color={divColor} size="lg" />
        </div>

        {/* Est. returns */}
        <div className="card space-y-3">
          <p className="text-sm text-slate-400 font-medium">Est. Annual Returns</p>
          {[
            { label: 'Conservative', key: 'conservative_1y', color: 'text-green-400' },
            { label: 'Expected',     key: 'expected_1y',     color: 'text-brand-400' },
            { label: 'Optimistic',   key: 'optimistic_1y',   color: 'text-amber-400' },
          ].map(({ label, key, color }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{label}</span>
              <span className={`font-mono font-medium ${color}`}>
                {returns[key]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sector pie */}
        <div className="card">
          <h3 className="font-medium mb-4">Sector Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sectorData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                paddingAngle={3}
              >
                {sectorData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#171923', border: '1px solid #232736', borderRadius: 12 }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {sectorData.slice(0, 6).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="text-xs text-slate-400 truncate">{d.name}</span>
                <span className="text-xs text-slate-300 ml-auto">{d.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asset allocation bar */}
        <div className="card">
          <h3 className="font-medium mb-4">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={allocData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232736" horizontal={false} />
              <XAxis type="number" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ background: '#171923', border: '1px solid #232736', borderRadius: 12 }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, 'Allocation']}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {allocData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History chart */}
      {history.length > 1 && (
        <div className="card">
          <h3 className="font-medium mb-4">Portfolio Value History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="val" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5b6ef2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5b6ef2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232736" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#171923', border: '1px solid #232736', borderRadius: 12 }}
                formatter={(v: number) => [fmt(v), 'Value']}
              />
              <Area type="monotone" dataKey="total_value" stroke="#5b6ef2" fill="url(#val)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Holdings table */}
      {analysis!.holdings && analysis!.holdings.length > 0 && (
        <div className="card">
          <h3 className="font-medium mb-4">Holdings</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-surface-border">
                  {['Symbol', 'Sector', 'Asset Class', 'Qty', 'Price', 'Value', 'Weight', 'Beta'].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {[...analysis!.holdings]
                  .sort((a, b) => b.value - a.value)
                  .map(h => (
                    <tr key={h.symbol} className="hover:bg-surface-border/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-brand-400">{h.symbol}</td>
                      <td className="py-2.5 px-3 text-slate-300">{h.sector}</td>
                      <td className="py-2.5 px-3 text-slate-400">{h.asset_class}</td>
                      <td className="py-2.5 px-3 font-mono">{h.quantity}</td>
                      <td className="py-2.5 px-3 font-mono">${h.price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-100">{fmt(h.value)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          h.weight_pct > 20 ? 'bg-red-500/20 text-red-400' :
                          h.weight_pct > 10 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {h.weight_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{h.beta.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
