interface ScoreGaugeProps {
  score: number     // 0–10
  label: string
  color?: 'blue' | 'green' | 'amber' | 'red'
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = {
  blue:  { stroke: '#5b6ef2', text: 'text-brand-400', bg: 'bg-brand-600/20' },
  green: { stroke: '#22c55e', text: 'text-green-400',  bg: 'bg-green-600/20' },
  amber: { stroke: '#f59e0b', text: 'text-amber-400',  bg: 'bg-amber-600/20' },
  red:   { stroke: '#ef4444', text: 'text-red-400',    bg: 'bg-red-600/20'   },
}

export default function ScoreGauge({ score, label, color = 'blue', size = 'md' }: ScoreGaugeProps) {
  const { stroke, text } = COLORS[color]
  const r  = size === 'lg' ? 44 : size === 'sm' ? 28 : 36
  const cx = size === 'lg' ? 56 : size === 'sm' ? 36 : 46
  const sw = size === 'lg' ? 8 : size === 'sm' ? 5 : 6
  const viewBox = `0 0 ${cx * 2} ${cx * 2}`
  const circumference = 2 * Math.PI * r
  const arc = circumference * 0.75   // 270° arc
  const offset = arc - (score / 10) * arc
  const wh = size === 'lg' ? 'w-28 h-28' : size === 'sm' ? 'w-18 h-18' : 'w-24 h-24'
  const fontSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${wh}`}>
        <svg viewBox={viewBox} className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#232736" strokeWidth={sw}
            strokeDasharray={`${arc} ${circumference - arc}`} strokeLinecap="round" />
          {/* Fill */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={stroke} strokeWidth={sw}
            strokeDasharray={`${arc} ${circumference - arc}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-semibold ${fontSize} ${text}`}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  )
}
