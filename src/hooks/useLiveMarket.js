import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveMarket } from '../services/liveMarketService.js'

export function useLiveMarket(intervalMs = 15000) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [events, setEvents] = useState([])
  const [liquidityEvents, setLiquidityEvents] = useState([])
  const histories = useRef(new Map())
  const telemetry = useRef(new Map())
  const previous = useRef(new Map())
  const controller = useRef(null)

  const refresh = useCallback(async () => {
    controller.current?.abort()
    controller.current = new AbortController()
    try {
      const data = await fetchLiveMarket(controller.current.signal)
      const nextEvents = []
      const nextLiquidityEvents = []
      data.tokens.forEach((token) => {
        const history = histories.current.get(token.address) || []
        histories.current.set(token.address, [...history, token.price].filter(Boolean).slice(-36))
        const tokenTelemetry = telemetry.current.get(token.address) || []
        const previousPoint = tokenTelemetry[tokenTelemetry.length - 1]
        const observedAt = Math.max(Math.floor(Date.now() / 1000), (previousPoint?.time || 0) + 1)
        telemetry.current.set(token.address, [...tokenTelemetry, {
          time: observedAt,
          price: token.price,
          liquidity: token.liquidity,
          volume5m: token.volume5m,
          buys5m: token.buys5m,
          sells5m: token.sells5m,
          heat24h: token.ml?.heat24h || 0,
        }].slice(-240))
        const prior = previous.current.get(token.address)
        if (prior?.price && token.price) {
          const delta = ((token.price / prior.price) - 1) * 100
          if (Math.abs(delta) >= .15) nextEvents.push({ id: `${token.address}-${Date.now()}`, symbol: token.symbol, delta, price: token.price, kind: delta > 0 ? 'impulse' : 'decay', at: new Date().toISOString() })
        }
        if (prior?.liquidity && token.liquidity) {
          const deltaUsd = token.liquidity - prior.liquidity
          const deltaPct = deltaUsd / prior.liquidity * 100
          if (Math.abs(deltaPct) >= .15) nextLiquidityEvents.push({ id: `liq-${token.address}-${Date.now()}`, address: token.address, symbol: token.symbol, deltaUsd, deltaPct, liquidity: token.liquidity, kind: deltaUsd > 0 ? 'inflow' : 'outflow', at: new Date().toISOString() })
        }
      })
      previous.current = new Map(data.tokens.map((token) => [token.address, token]))
      setEvents((current) => [...nextEvents, ...current].slice(0, 24))
      setLiquidityEvents((current) => [...nextLiquidityEvents, ...current].slice(0, 40))
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

  return { ...state, events, liquidityEvents, histories: histories.current, telemetry: telemetry.current, refresh }
}
