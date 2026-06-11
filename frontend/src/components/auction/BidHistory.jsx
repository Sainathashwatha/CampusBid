import { Badge } from '../ui/index.jsx'

 
export const BidHistory = ({ bids = [] }) => {
  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-2xl mb-2">🏷️</p>
        <p className="text-sm">No bids yet. Be the first!</p>
      </div>
    )
  }

  const formatTime = (ts) =>
    new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
      {bids.map((bid, i) => (
        <div
          key={bid.id}
          className={`flex items-center justify-between py-3 px-1
            ${bid.bid_status === 'won' ? 'bg-yellow-50 rounded-lg' : ''}
            ${bid.bid_status === 'leading' ? 'bg-green-50 rounded-lg' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center
                            justify-center text-primary font-bold text-sm flex-shrink-0">
              {bid.bidder_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {bid.bidder_name}
                {bid.bid_status === 'leading' && (
                  <span className="ml-2 text-xs text-green-600 font-semibold">● Leading</span>
                )}
                {bid.bid_status === 'won' && (
                  <span className="ml-2 text-xs text-yellow-600 font-semibold">🏆 Winner</span>
                )}
              </p>
              <p className="text-xs text-gray-400">{formatTime(bid.created_at)}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-gray-800">
              ₹{bid.amount?.toLocaleString('en-IN')}
            </p>
            <Badge status={bid.bid_status} />
          </div>
        </div>
      ))}
    </div>
  )
}