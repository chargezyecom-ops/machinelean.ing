import { useCallback, useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api'

export function useLiveMarket(intervalMs = 10000) {
  const [launches, setLaunches] = useState([])
  const [narratives, setNarratives] = useState([])
  const [stats, setStats] = useState({ total: 0, volume1h: 0, last1h: 0, last24h: 0, uniqueCreators: 0 })
  const [walletReport, setWalletReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [backfill, setBackfill] = useState({ status: 'idle' })
  const controller = useRef(null)

  const fetchLaunches = useCallback(async () => {
    controller.current?.abort()
    controller.current = new AbortController()
    try {
      const resp = await fetch(`${API_BASE}/v1/launches?enrich=true&limit=50`, { signal: controller.current.signal })
      if (!resp.ok) throw new Error(`API ${resp.status}`)
      const json = await resp.json()
      const data = json.data || []
      setLaunches(data)
      setStats({
        total: json.counts?.total || data.length,
        volume1h: data.reduce((s, l) => s + (l.market?.volume1h || 0), 0),
        last1h: data.filter((l) => Date.now() - (l.timestamp ? l.timestamp * 1000 : 0) < 3600000).length,
        last24h: data.filter((l) => Date.now() - (l.timestamp ? l.timestamp * 1000 : 0) < 86400000).length,
        uniqueCreators: new Set(data.map((l) => l.creator)).size,
      })
      setLoading(false)
      setError('')
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'API unavailable')
        setLoading(false)
      }
    }
  }, [])

  const fetchNarratives = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/v1/narratives`, { signal: AbortSignal.timeout(10000) })
      if (!resp.ok) return
      const json = await resp.json()
      setNarratives(json.narratives || [])
    } catch { /* ignore */ }
  }, [])

  const fetchWalletReport = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/v1/wallets/report`, { signal: AbortSignal.timeout(10000) })
      if (!resp.ok) return
      const json = await resp.json()
      setWalletReport(json.data || null)
    } catch { /* ignore */ }
  }, [])

  const triggerBackfill = useCallback(async (hours = 24) => {
    try {
      const resp = await fetch(`${API_BASE}/v1/backfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      })
      const json = await resp.json()
      setBackfill({ status: 'started', message: json.message })
    } catch (err) {
      setBackfill({ status: 'error', message: err.message })
    }
  }, [])

  useEffect(() => {
    fetchLaunches()
    fetchNarratives()
    fetchWalletReport()
    if (!intervalMs) return
    const timer = window.setInterval(() => {
      fetchLaunches()
      fetchNarratives()
      fetchWalletReport()
    }, intervalMs)
    return () => { window.clearInterval(timer); controller.current?.abort() }
  }, [intervalMs, fetchLaunches, fetchNarratives, fetchWalletReport])

  return { launches, narratives, stats, walletReport, loading, error, backfill, refresh: fetchLaunches, triggerBackfill }
}
