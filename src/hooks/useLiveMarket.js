import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveMarket } from '../services/liveMarketService.js'

export function useLiveMarket(intervalMs = 15000) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [events, setEvents] = useState([])
  const histories = useRef(new Map())
  const previous = useRef(new Map())
  const controller = useRef(null)

  const refresh = useCallback(async () => {
    controller.current?.abort()
    controller.current = new AbortController()
    try {
      const data = await fetchLiveMarket(controller.current.signal)
      const nextEvents = []
      data.tokens.forEach((token) => {
        const history = histories.current.get(token.address) || []
        histories.current.set(token.address, [...history, token.price].filter(Boolean).slice(-36))
        const prior = previous.current.get(token.address)
        if (prior?.price && token.price) {
          const delta = ((token.price / prior.price) - 1) * 100
          if (Math.abs(delta) >= .15) nextEvents.push({ id: `${token.address}-${Date.now()}`, symbol: token.symbol, delta, price: token.price, kind: delta > 0 ? 'impulse' : 'decay', at: new Date().toISOString() })
        }
      })
      previous.current = new Map(data.tokens.map((token) => [token.address, token]))
      setEvents((current) => [...nextEvents, ...current].slice(0, 24))
      setState({ data, loading: false, error: '' })
    } catch (error) {
      if (error.name !== 'AbortError') setState((current) => ({ ...current, loading: false, error: error.message || 'Live feed unavailable' }))
    }
  }, [])

  useEffect(() => {
    const safelyRefresh = () => { refresh().catch(() => {}) }
    safelyRefresh()
    if (!intervalMs) return () => controller.current?.abort()
    const timer = window.setInterval(safelyRefresh, intervalMs)
    return () => { window.clearInterval(timer); controller.current?.abort() }
  }, [intervalMs, refresh])

  return { ...state, events, histories: histories.current, refresh }
}
