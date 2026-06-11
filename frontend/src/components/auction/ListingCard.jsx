import { Link } from 'react-router-dom'
import { Badge } from '../ui/index.jsx'
import { CountdownTimer } from './CountdownTimer.jsx'

const CATEGORY_EMOJI = {
  electronics: '💻', books: '📚', clothing: '👕',
  furniture: '🪑', sports: '⚽', other: '📦'
}

export const ListingCard = ({ listing }) => {
  const {
    _id, title, images, category, condition,
    listing_type, starting_price, current_price, status, end_time,
  } = listing

  const displayPrice = current_price || starting_price
  const hasBids = current_price && current_price > starting_price

  return (
    <Link to={`/listings/${_id}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-hover">

        {/* Image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {images?.[0] ? (
            <img src={images[0]} alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <span className="text-4xl">{CATEGORY_EMOJI[category] || '📦'}</span>
              <span className="text-xs text-slate-400 font-medium capitalize">{category}</span>
            </div>
          )}

          {/* Top overlays */}
          <div className="absolute inset-x-0 top-0 p-2.5 flex items-start justify-between">
            <Badge status={listing_type} />
            {status !== 'active' && <Badge status={status} />}
          </div>

          {/* Gradient overlay at bottom */}
          {listing_type === 'auction' && status === 'active' && end_time && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
              <CountdownTimer endTime={end_time} compact />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge status={condition} />
          </div>

          <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                {listing_type === 'auction' ? (hasBids ? 'Current bid' : 'Starting bid') : 'Price'}
              </p>
              <p className="text-xl font-bold text-slate-800">
                ₹<span className="tabular-nums">{displayPrice?.toLocaleString('en-IN')}</span>
              </p>
            </div>

            {hasBids && listing_type === 'auction' && (
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-xs font-semibold">Live</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </Link>
  )
}