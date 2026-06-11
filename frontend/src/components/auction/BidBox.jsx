import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { bidService } from '../../services/bidService.js'
import { Button } from '../ui/index.jsx'
import { Link } from 'react-router-dom'

export const BidBox = ({ listingId, currentPrice, isEnded, sellerId, onBidPlaced }) => {
  const { user, isAuthenticated } = useAuth()
  const [amount, setAmount]   = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const isSeller = user?.id === sellerId
  const minBid   = (currentPrice || 0) + 1

  const handleBid = async () => {
    setError('')
    setSuccess('')
    const bidAmount = Number(amount)

    if (!bidAmount || bidAmount <= 0) return setError('Enter a valid amount')
    if (bidAmount <= currentPrice) return setError(`Must exceed ₹${currentPrice?.toLocaleString('en-IN')}`)

    setLoading(true)
    try {
      await bidService.placeBid(listingId, bidAmount)
      setSuccess(`✓ Bid of ₹${bidAmount.toLocaleString('en-IN')} placed!`)
      setAmount('')
      if (onBidPlaced) onBidPlaced(bidAmount)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center bg-slate-50">
      <p className="text-2xl mb-2">🔒</p>
      <p className="text-sm font-semibold text-slate-700 mb-1">Login to place a bid</p>
      <p className="text-xs text-slate-400 mb-4">Join your college marketplace</p>
      <Link to="/login">
        <Button className="w-full">Login to Bid</Button>
      </Link>
    </div>
  )

  if (isSeller) return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center bg-slate-50">
      <p className="text-2xl mb-2">🏷️</p>
      <p className="text-sm font-semibold text-slate-600">This is your listing</p>
      <p className="text-xs text-slate-400 mt-1">You cannot bid on your own items</p>
    </div>
  )

  if (isEnded) return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center bg-slate-50">
      <p className="text-2xl mb-2">🏁</p>
      <p className="text-sm font-semibold text-slate-600">Auction has ended</p>
    </div>
  )

  return (
    <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-lg shadow-indigo-100">

      {/* Current price display */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Current Highest Bid</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-800">₹</span>
          <span className="text-4xl font-bold text-slate-800 tabular-nums">
            {currentPrice?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Bid input */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={minBid.toLocaleString('en-IN')}
            onKeyDown={(e) => e.key === 'Enter' && handleBid()}
            className="w-full border-2 border-slate-200 rounded-xl pl-8 pr-3 py-3 text-sm font-semibold
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
                       hover:border-slate-300 transition-all bg-white"
          />
        </div>
        <Button onClick={handleBid} loading={loading} disabled={loading} className="px-5 py-3 text-sm">
          {loading ? 'Placing...' : '⚡ Bid Now'}
        </Button>
      </div>

      {/* Quick bid buttons */}
      <div className="flex gap-2 mb-3">
        {[100, 500, 1000].map(inc => (
          <button key={inc} onClick={() => setAmount(String(currentPrice + inc))}
            className="flex-1 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200
                       rounded-lg py-1.5 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
          >
            +₹{inc.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      {error   && <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">⚠ {error}</p>}
      {success && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">{success}</p>}

      <p className="text-[10px] text-slate-400 text-center mt-3">
        Rate limited · 5 bids per 10 seconds per user
      </p>
    </div>
  )
}