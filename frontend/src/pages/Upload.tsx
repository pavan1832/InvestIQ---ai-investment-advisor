import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { portfolioApi } from '../services/api'

const SAMPLE_CSV = `symbol,quantity,price
RELIANCE,50,2900.50
TCS,30,4200.00
HDFCBANK,100,1650.75
INFY,80,1850.25
HINDUNILVR,40,2450.00
ICICIBANK,120,1100.50
TATAMOTORS,200,850.25
SUNPHARMA,60,1350.00
WIPRO,150,560.75
ZOMATO,500,195.50`

export default function UploadPortfolio() {
  const [file, setFile]         = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus]     = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const pick = (f: File) => {
    if (!f.name.endsWith('.csv')) { setMessage('Only CSV files are accepted.'); return }
    setFile(f); setMessage(''); setStatus('idle')
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pick(f)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) pick(f)
  }

  const submit = async () => {
    if (!file) return
    setStatus('uploading'); setMessage('')
    try {
      await portfolioApi.upload(file)
      setStatus('success')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Upload failed. Please check your CSV format.')
    }
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'sample_portfolio.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Upload Portfolio</h1>
        <p className="text-slate-400 mt-1">Upload a CSV with your stock holdings to get AI-powered insights.</p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          dragging ? 'border-brand-500 bg-brand-600/10' : 'border-surface-border hover:border-brand-600/50 hover:bg-surface-card'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onChange} />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-brand-400" />
            <div>
              <p className="font-medium text-slate-100">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus('idle') }}
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-slate-500" />
            <div>
              <p className="font-medium text-slate-300">Drop your CSV here or click to browse</p>
              <p className="text-sm text-slate-500 mt-1">Max 10 MB · .csv files only</p>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      {status === 'success' && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Portfolio uploaded and analysed! Redirecting to dashboard…
        </div>
      )}
      {status === 'error' && message && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          onClick={submit}
          disabled={!file || status === 'uploading' || status === 'success'}
        >
          <Upload className="w-4 h-4" />
          {status === 'uploading' ? 'Analysing…' : 'Upload & Analyse'}
        </button>
        <button className="btn-ghost" onClick={downloadSample}>Download Sample CSV</button>
      </div>

      {/* Format guide */}
      <div className="card">
        <h3 className="font-medium mb-3">CSV Format Requirements</h3>
        <div className="text-sm text-slate-400 space-y-2">
          <p>Your CSV must have these columns (any order, case-insensitive):</p>
          <div className="font-mono text-xs bg-surface rounded-lg p-3 space-y-1">
            <p><span className="text-brand-400">symbol</span> — Stock ticker (e.g. RELIANCE, TCS, AAPL)</p>
            <p><span className="text-brand-400">quantity</span> — Number of shares held</p>
            <p><span className="text-brand-400">price</span> — Current price per share</p>
          </div>
          <p>Column aliases accepted: <span className="font-mono text-slate-300">ticker, qty, shares, cost, nav</span></p>
        </div>
      </div>
    </div>
  )
}
