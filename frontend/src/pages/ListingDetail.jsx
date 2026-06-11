import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { listingService } from '../services/listingService.js'
import { bidService } from '../services/bidService.js'
import { useSocket } from '../hooks/useSocket.js'
import { useCountdown } from '../hooks/useCountdown.js'
import { BidBox } from '../components/auction/BidBox.jsx'
import { BidHistory } from '../components/auction/BidHistory.jsx'
import { CountdownTimer } from '../components/auction/CountdownTimer.jsx'
import { Badge, Spinner } from '../components/ui/index.jsx'

 
export const ListingDetail = () => {
  const { id } = useParams()

  const [listing, setListing]       = useState(null)
  const [bids, setBids]             = useState([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [winner, setWinner]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  // Load listing data
  useEffect(() => {
    const load = async () => {
      try {
        const [listingData, bidsData] = await Promise.all([
          listingService.getListing(id),
          bidService.getBidsForListing(id),
        ])
        setListing(listingData.listing)
        setCurrentPrice(listingData.listing.current_price || listingData.listing.starting_price)
        setBids(bidsData.bids)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Socket.io — real-time updates
  useSocket(id, {
    onNewBid: (data) => {
      // Update current price instantly
      setCurrentPrice(data.amount)

      // Prepend new bid to history list
      setBids(prev => [{
        id: data.bidId,
        amount: data.amount,
        bidder_name: data.bidderName,
        status: 'active',
        created_at: data.timestamp,
      }, ...prev.map(b => b.status === 'active' ? { ...b, status: 'outbid' } : b)])
    },

    onAuctionEnded: (data) => {
      setListing(prev => ({ ...prev, status: 'ended' }))
      if (data.winner) setWinner(data.winner)
    },
  })

  const { isEnded } = useCountdown(listing?.end_time)
  const auctionEnded = isEnded || listing?.status === 'ended'

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  if (!listing) {
    return <div className="text-center py-20 text-gray-400">Listing not found</div>
  }

  const images = listing.images?.length > 0 ? listing.images : [null]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Auction ended banner */}
      {auctionEnded && (
        <div className="mb-4 bg-gray-800 text-white rounded-xl p-4 text-center">
          <p className="font-bold text-lg">🏁 Auction Ended</p>
          {winner && (
            <p className="text-sm text-gray-300 mt-1">
              Won by <strong>{winner.name}</strong> for <strong>₹{winner.amount?.toLocaleString('en-IN')}</strong>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left: Images */}
        <div>
          {/* Main image */}
          <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={listing.title}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2
                    ${activeImage === i ? 'border-primary' : 'border-gray-200'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info + Bidding */}
        <div>
          {/* Title + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge status={listing.listing_type} />
            <Badge status={listing.condition} />
            <Badge status={listing.status} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{listing.title}</h1>
          <p className="text-sm text-gray-400 mb-4 capitalize">
            {listing.category}
            {listing.custom_fields?.brand && ` · ${listing.custom_fields.brand}`}
          </p>

          {/* Timer */}
          {listing.listing_type === 'auction' && !auctionEnded && (
            <div className="flex items-center gap-3 mb-4">
              <p className="text-sm text-gray-500">Ends in:</p>
              <CountdownTimer endTime={listing.end_time} />
            </div>
          )}

          {/* Bid box (auction only) */}
          {listing.listing_type === 'auction' && (
            <div className="mb-4">
              <BidBox
                listingId={id}
                currentPrice={currentPrice}
                isEnded={auctionEnded}
                sellerId={listing.seller_id}
                onBidPlaced={(amount) => setCurrentPrice(amount)}
              />
            </div>
          )}

          {/* Fixed/negotiable price */}
          {listing.listing_type !== 'auction' && (
            <div className="border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400">Price</p>
              <p className="text-3xl font-bold text-primary">
                ₹{listing.starting_price?.toLocaleString('en-IN')}
              </p>
              {listing.listing_type === 'negotiable' && (
                <p className="text-xs text-gray-400 mt-1">Price is negotiable — contact seller</p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-1">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
          </div>

          {/* Custom fields */}
          {Object.keys(listing.custom_fields || {}).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Details</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(listing.custom_fields).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 capitalize">{k}</p>
                    <p className="text-sm font-medium text-gray-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Bid History (auctions only) */}
      {listing.listing_type === 'auction' && (
        <div className="mt-8 border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-4">
            Bid History <span className="text-gray-400 font-normal text-sm">({bids.length} bids)</span>
          </h3>
          <BidHistory bids={bids} />
        </div>
      )}

    </div>
  )
}