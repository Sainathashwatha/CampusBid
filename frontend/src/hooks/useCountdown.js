import { useState, useEffect } from 'react'

/*
  useCountdown — ticking live timer for auction end time
  ───────────────────────────────────────────────────────
  Takes an end_time string → returns { hours, minutes, seconds, isEnded, isUrgent }

  setInterval runs every second and recalculates the time left.
  Cleanup clears the interval when component unmounts — no memory leak.

  isUrgent → true when < 5 minutes left (UI turns red)
  isEnded  → true when time reaches 0
*/

export const useCountdown = (endTime) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endTime))

  useEffect(() => {
    if (!endTime) return

    const timer = setInterval(() => {
      const t = getTimeLeft(endTime)
      setTimeLeft(t)
      if (t.total <= 0) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)  // cleanup on unmount
  }, [endTime])

  return timeLeft
}

const getTimeLeft = (endTime) => {
  const total = new Date(endTime) - new Date()

  if (total <= 0) {
    return { total: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true, isUrgent: false }
  }

  const hours   = Math.floor(total / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)

  return {
    total,
    hours,
    minutes,
    seconds,
    isEnded: false,
    isUrgent: total < 5 * 60 * 1000,  // less than 5 minutes
  }
}