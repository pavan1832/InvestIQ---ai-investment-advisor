import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Lightbulb, RefreshCw, Upload, Copy, CheckCheck } from 'lucide-react'
import { portfolioApi } from '../services/api'

export default function Insights() {
  const [insights, setInsights] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await portfolioApi.getInsights()
      setInsights(data.insights)
    } catch (err: any) {
      if (err.response?.status === 404) setError('no-portfolio')
      else setError(err.response?.data?.detail || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const copy = async () => {
    await navigator.clipboard.writeText(insights)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-brand-400">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Generating AI insights…</span>
      </div>
    </div>
  )

  if (error === 'no-portfolio') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center">
        <Upload className="w-8 h-8 text-brand-400" />
      </div>
      <div>
        <h2 className="font-display text-2xl mb-1">No portfolio found</h2>
        <p className="text-slate-400">Upload a CSV to get AI-powered investment recommendations.</p>
      </div>
      <Link to="/upload" className="btn-primary">Upload Portfolio</Link>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="font-display text-3xl">AI Investment Insights</h1>
            <p className="text-slate-400 text-sm">Powered by LangChain · Gemini 1.5 Flash</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="btn-ghost flex items-center gap-2 text-sm">
            {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="card prose prose-invert prose-sm max-w-none
        prose-headings:font-display prose-headings:text-slate-100
        prose-h2:text-xl prose-h3:text-base
        prose-p:text-slate-300 prose-p:leading-relaxed
        prose-li:text-slate-300
        prose-strong:text-slate-100 prose-strong:font-semibold
        prose-code:text-brand-400 prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-hr:border-surface-border">
        <ReactMarkdown>{insights}</ReactMarkdown>
      </div>

      <p className="text-xs text-slate-600 text-center">
        This analysis is for educational purposes only and does not constitute financial advice.
        Consult a registered advisor before making investment decisions.
      </p>
    </div>
  )
}
