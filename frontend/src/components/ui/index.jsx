// ── Button ────────────────────────────────────────────────────────
export const Button = ({
  children, onClick, type = 'button',
  variant = 'primary', disabled = false, loading = false, className = '',
}) => {
  const base = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-md shadow-indigo-200',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
    danger:  'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-md shadow-red-200',
    ghost:   'text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
    amber:   'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-md shadow-amber-200',
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? <><Spinner size="sm" />{children}</> : children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────
export const Input = ({
  label, name, type = 'text', value, onChange,
  placeholder, error, required = false, className = '',
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label htmlFor={name} className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      id={name} name={name} type={type} value={value}
      onChange={onChange} placeholder={placeholder}
      className={`border-2 rounded-xl px-4 py-2.5 text-sm bg-white transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
        ${error
          ? 'border-red-300 focus:ring-red-400 bg-red-50'
          : 'border-slate-200 hover:border-slate-300 focus:border-indigo-400'}`}
    />
    {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
  </div>
)

// ── Badge ─────────────────────────────────────────────────────────
export const Badge = ({ status }) => {
  const styles = {
    active:      'bg-emerald-100 text-emerald-700 border border-emerald-200',
    ended:       'bg-slate-100 text-slate-500 border border-slate-200',
    sold:        'bg-blue-100 text-blue-700 border border-blue-200',
    cancelled:   'bg-red-100 text-red-600 border border-red-200',
    won:         'bg-amber-100 text-amber-700 border border-amber-200',
    lost:        'bg-slate-100 text-slate-500 border border-slate-200',
    outbid:      'bg-orange-100 text-orange-600 border border-orange-200',
    leading:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
    fixed:       'bg-violet-100 text-violet-700 border border-violet-200',
    negotiable:  'bg-sky-100 text-sky-700 border border-sky-200',
    auction:     'bg-indigo-100 text-indigo-700 border border-indigo-200',
    closing:     'bg-red-100 text-red-600 border border-red-200',
    new:         'bg-emerald-100 text-emerald-700 border border-emerald-200',
    like_new:    'bg-teal-100 text-teal-700 border border-teal-200',
    good:        'bg-blue-100 text-blue-700 border border-blue-200',
    fair:        'bg-amber-100 text-amber-700 border border-amber-200',
    electronics: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    books:       'bg-amber-100 text-amber-700 border border-amber-200',
    clothing:    'bg-pink-100 text-pink-700 border border-pink-200',
    furniture:   'bg-orange-100 text-orange-700 border border-orange-200',
    sports:      'bg-emerald-100 text-emerald-700 border border-emerald-200',
    other:       'bg-slate-100 text-slate-600 border border-slate-200',
  }

  const icons = {
    active: '●', ended: '■', won: '🏆', leading: '↑',
    outbid: '↓', auction: '⚡', fixed: '🏷', negotiable: '💬',
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styles[status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
      {icons[status] && <span className="text-[10px]">{icons[status]}</span>}
      {status?.replace('_', ' ')}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4 border', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-2' }
  return (
    <div className={`${sizes[size]} border-slate-200 border-t-indigo-600 rounded-full animate-spin flex-shrink-0`} />
  )
}

// ── Error message ─────────────────────────────────────────────────
export const ErrorMsg = ({ message }) =>
  message ? (
    <div className="bg-red-50 border-2 border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
      <span>⚠</span> {message}
    </div>
  ) : null