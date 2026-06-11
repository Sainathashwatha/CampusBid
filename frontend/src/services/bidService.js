import api from './api.js'

export const bidService = {
  // POST /api/bids/:listingId
  placeBid: async (listingId, amount) => {
    const res = await api.post(`/bids/${listingId}`, { amount })
    return res.data
  },

  // GET /api/bids/:listingId — all bids for a listing
  getBidsForListing: async (listingId) => {
    const res = await api.get(`/bids/${listingId}`)
    return res.data  // { bids: [{ amount, bidder_name, status, created_at }] }
  },

  // GET /api/bids/mine — my bid history
  getMyBids: async () => {
    const res = await api.get('/bids/mine')
    return res.data
  },
}