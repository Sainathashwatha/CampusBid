import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Input, ErrorMsg } from '../components/ui/index.jsx'

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">

    {/* Background decoration */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
    </div>

    <div className="relative w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-900">
            CA
          </div>
          <span className="text-white font-bold text-xl">Campus Auction</span>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>

        {children}

        <div className="mt-5 text-center text-sm text-slate-500">{footer}</div>
      </div>
    </div>
  </div>
)

// ── Login ─────────────────────────────────────────────────────────
export const Login = () => {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back 👋"
      subtitle="Login to your campus account"
      footer={<>New here? <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Create account →</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Email" name="email" type="email"
          value={form.email} onChange={handleChange}
          placeholder="ravi@college.edu" required />
        <Input label="Password" name="password" type="password"
          value={form.password} onChange={handleChange}
          placeholder="••••••••" required />
        <ErrorMsg message={error} />
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl
                     hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200
                     active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging in...</> : 'Login →'}
        </button>
      </form>
    </AuthLayout>
  )
}

// ── Register ──────────────────────────────────────────────────────
export const Register = () => {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Join Campus Auction 🎓"
      subtitle="Buy and sell with your college community"
      footer={<>Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Login →</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full Name" name="name"
          value={form.name} onChange={handleChange}
          placeholder="Ravi Kumar" required />
        <Input label="Email" name="email" type="email"
          value={form.email} onChange={handleChange}
          placeholder="ravi@college.edu" required />
        <Input label="Password" name="password" type="password"
          value={form.password} onChange={handleChange}
          placeholder="Min 6 characters" required />
        <ErrorMsg message={error} />
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl
                     hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200
                     active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</> : 'Create Account →'}
        </button>
        <p className="text-xs text-slate-400 text-center">
          By signing up you agree to keep it respectful 🙏
        </p>
      </form>
    </AuthLayout>
  )
}