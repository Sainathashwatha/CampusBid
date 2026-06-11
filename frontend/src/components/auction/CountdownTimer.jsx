import { useCountdown } from '../../hooks/useCountdown.js'

export const CountdownTimer = ({ endTime, compact = false }) => {
  const { hours, minutes, seconds, isEnded, isUrgent } = useCountdown(endTime)

  const pad = (n) => String(n).padStart(2, '0')

  if (isEnded) {
    if (compact) return (
      <span className="text-xs font-bold text-white/80">Ended</span>
    )
    return (
      <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
        <span className="text-slate-400 text-sm">🏁</span>
        <span className="text-sm font-bold text-slate-500">Auction Ended</span>
      </div>
    )
  }

  // Compact version — shown on card image overlay
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${isUrgent ? 'urgent-glow' : ''}`}>
        <span className={`text-xs font-bold font-mono ${isUrgent ? 'text-red-300' : 'text-white'}`}>
          ⏱ {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </div>
    )
  }

  // Full version — shown on detail page
  const segments = [
    { label: 'HRS', value: pad(hours) },
    { label: 'MIN', value: pad(minutes) },
    { label: 'SEC', value: pad(seconds) },
  ]

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 border-2
      ${isUrgent
        ? 'bg-red-50 border-red-200 urgent-glow'
        : 'bg-indigo-50 border-indigo-100'}`}
    >
      <span className="text-sm">{isUrgent ? '🔥' : '⏱'}</span>
      <div className="flex items-center gap-1.5">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className="text-center">
              <div className={`text-xl font-bold font-mono tabular-nums leading-none
                ${isUrgent ? 'text-red-600' : 'text-indigo-700'}`}>
                {seg.value}
              </div>
              <div className="text-[9px] font-bold tracking-widest text-slate-400 mt-0.5">
                {seg.label}
              </div>
            </div>
            {i < 2 && (
              <span className={`text-lg font-bold pb-3 ${isUrgent ? 'text-red-400' : 'text-indigo-300'}`}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}