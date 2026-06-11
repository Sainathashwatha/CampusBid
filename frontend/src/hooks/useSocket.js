import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

/*
  useSocket — custom hook for real-time auction updates
  ───────────────────────────────────────────────────────
  WHY a custom hook?
  The socket logic (connect, join room, listen, cleanup) is the same
  for every auction page. Extract it once, use it everywhere.

  HOW IT WORKS:
  ─────────────
  1. Component mounts → hook connects to Socket.io server
  2. Hook emits JOIN_AUCTION with listingId → joins room on backend
  3. Backend Redis pub/sub fires (when a bid is placed)
  4. Socket.io receives NEW_BID or AUCTION_ENDED event
  5. onNewBid / onAuctionEnded callbacks fire → component updates state
  6. Component unmounts → hook disconnects cleanly (no memory leaks)

  useRef for socket:
  → useRef persists the socket across renders without causing re-renders
  → If we used useState, setting the socket would re-render and reconnect
*/

export const useSocket = (listingId, { onNewBid, onAuctionEnded } = {}) => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!listingId) return

    // Connect to backend Socket.io server
    const socket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket'],  // skip long-polling, use WS directly
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id)
      // Tell backend "I am watching this listing — put me in its room"
      socket.emit('JOIN_AUCTION', listingId)
    })

    /*
      NEW_BID: someone just placed a bid on this listing
      Data: { type, listingId, bidId, amount, bidderId, bidderName, timestamp }
    */
    socket.on('NEW_BID', (data) => {
      console.log('💰 New bid received:', data)
      if (onNewBid) onNewBid(data)
    })

    /*
      AUCTION_ENDED: BullMQ worker just closed this auction
      Data: { type, listingId, winner: { name, amount } | null }
    */
    socket.on('AUCTION_ENDED', (data) => {
      console.log('🏁 Auction ended:', data)
      if (onAuctionEnded) onAuctionEnded(data)
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    // Cleanup: runs when component unmounts or listingId changes
    return () => {
      socket.emit('LEAVE_AUCTION', listingId)  // leave the room politely
      socket.disconnect()
    }
  }, [listingId])  // re-run if listingId changes

  return socketRef
}