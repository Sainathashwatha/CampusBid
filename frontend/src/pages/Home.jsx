import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listingService } from '../services/listingService.js'
import { ListingCard } from '../components/auction/ListingCard.jsx'
import { Spinner } from '../components/ui/index.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const CATEGORIES = [
  { value: '', label: 'All', emoji: '🌐' },
  { value: 'electronics', label: 'Electronics', emoji: '💻' },
  { value: 'books', label: 'Books', emoji: '📚' },
  { value: 'clothing', label: 'Clothing', emoji: '👕' },
  { value: 'furniture', label: 'Furniture', emoji: '🪑' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'other', label: 'Other', emoji: '📦' },
]

const SORTS = [
  { value: 'newest', label: '✨ Newest' },
  { value: 'ending_soon', label: '⏰ Ending soon' },
  { value: 'price_low', label: '↑ Price low' },
  { value: 'price_high', label: '↓ Price high' },
]

export const Home = () => {
  const { isAuthenticated } = useAuth()
  const [listings, setListings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters]       = useState({
    category: '', listing_type: '', sort: 'newest', search: '', page: 1,
  })

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await listingService.getListings(filters)
        setListings(data.listings)
        setPagination(data.pagination)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [filters])

  const updateFilter = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Live auctions happening now
            </div>
            <h1 className="text-4xl font-bold mb-3 leading-tight">
              Your College's Own<br />
              <span className="text-indigo-200">Marketplace</span>
            </h1>
            <p className="text-indigo-200 text-base mb-6">
              Buy and sell with your college community. Real-time bidding, trusted sellers, zero middlemen.
            </p>
            <div className="flex gap-3">
              {isAuthenticated ? (
                <Link to="/create"
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
                >
                  + List an Item
                </Link>
              ) : (
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
                >
                  Get Started Free
                </Link>
              )}
              <a href="#listings"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 font-semibold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-all"
              >
                Browse Items ↓
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" id="listings">

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat.value}
              onClick={() => updateFilter('category', cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                ${filters.category === cat.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Search + filters row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-56">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
                         hover:border-slate-300 bg-white transition-all"
            />
          </div>

          <select value={filters.listing_type}
            onChange={(e) => updateFilter('listing_type', e.target.value)}
            className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700
                       hover:border-slate-300 transition-all cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="auction">⚡ Auction</option>
            <option value="fixed">🏷 Fixed Price</option>
            <option value="negotiable">💬 Negotiable</option>
          </select>

          <select value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700
                       hover:border-slate-300 transition-all cursor-pointer"
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-400 font-medium">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl font-bold text-slate-700 mb-2">No listings found</p>
            <p className="text-slate-400 text-sm mb-6">Try changing your filters or be the first to sell!</p>
            {isAuthenticated && (
              <Link to="/create"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                + Post First Item
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{pagination.total}</span> listings
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map(listing => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
                      ${filters.page === p
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}