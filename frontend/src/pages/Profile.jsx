import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listingService } from '../services/listingService.js'
import { bidService } from '../services/bidService.js'
import { Badge, Spinner } from '../components/ui/index.jsx'

export const Profile = () => {
  const { user } = useAuth()
  const [tab, setTab]           = useState('listings')
  const [listings, setListings] = useState([])
  const [bids, setBids]         = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [listingsData, bidsData] = await Promise.all([
          listingService.getMyListings(),
          bidService.getMyBids(),
        ])
        setListings(listingsData.listings)
        setBids(bidsData.bids)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{user?.name}</h1>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['listings', 'bids'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2.5 text-sm font-medium capitalize transition-all
              ${tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            My {t} {t === 'listings' ? `(${listings.length})` : `(${bids.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : tab === 'listings' ? (

        /* My Listings */
        listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium mb-2">No listings yet</p>
            <Link to="/create" className="text-primary text-sm hover:underline">
              Post your first item →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {listings.map(l => (
              <Link key={l._id} to={`/listings/${l._id}`}
                className="flex items-center justify-between py-4 hover:bg-gray-50 rounded-lg px-2 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {l.images?.[0]
                      ? <img src={l.images[0]} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center">📦</div>
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{l.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{l.category} · {l.listing_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    ₹{(l.current_price || l.starting_price)?.toLocaleString('en-IN')}
                  </p>
                  <Badge status={l.status} />
                </div>
              </Link>
            ))}
          </div>
        )

      ) : (

        /* My Bids */
        bids.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="font-medium">No bids placed yet</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {bids.map(bid => (
              <Link key={bid.id} to={`/listings/${bid.listing_id}`}
                className="flex items-center justify-between py-4 hover:bg-gray-50 rounded-lg px-2 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    Listing #{bid.listing_id.slice(-6)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Auction {bid.auction_status} · Current: ₹{bid.current_price?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">
                    Your bid: ₹{bid.amount?.toLocaleString('en-IN')}
                  </p>
                  <Badge status={bid.bid_status} />
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}