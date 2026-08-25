import { useEffect, useMemo, useRef, useState } from 'react'
import { extractPumpCreateEvents, PUMP_PROGRAM_ID } from '../services/pumpEventDecoder.js'

const DEFAULT_WS_URL = 'wss://api.mainnet-beta.solana.com'
const MAX_LAUNCHES = 60

export function usePumpLaunchStream() {
  const [launches, setLaunches] = useState([])
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState('')
  const seen = useRef(new Set())
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const apiEnabled = import.meta.env.VITE_RESEARCH_API_ENABLED === 'true' && Boolean(apiBaseUrl)
  const apiStreamUrl = apiEnabled ? `${apiBaseUrl.replace(/^http/, 'ws')}/v1/stream` : ''
  const wsUrl = apiStreamUrl || import.meta.env.VITE_SOLANA_WS_URL || DEFAULT_WS_URL
  const commitment = import.meta.env.VITE_PUMP_COMMITMENT || 'confirmed'

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return undefined
    if (typeof WebSocket === 'undefined') { setStatus('unsupported'); return undefined }
    let socket
    let reconnectTimer
    let cancelled = false
    let attempts = 0
    const controller = new AbortController()

    const hydrateRecentLaunches = async () => {
      if (!apiEnabled) return
      try {
        const response = await fetch(`${apiBaseUrl}/v1/launches?limit=24`, { signal: controller.signal })
        if (!response.ok) return
        const payload = await response.json()
        if (cancelled || !Array.isArray(payload.data)) return
        const incoming = payload.data.flatMap((launch) => {
          const id = launch.id || `${launch.signature}:${launch.mint}`
          if (seen.current.has(id)) return []
          seen.current.add(id)
          return [{ ...launch, id }]
        })
        if (incoming.length) setLaunches((current) => [...incoming, ...current].slice(0, MAX_LAUNCHES))
      } catch (cause) {
        if (!(cause instanceof Error && cause.name === 'AbortError')) setError('Unable to preload recent creation events')
      }
    }

    const connect = () => {
      if (cancelled) return
      setStatus(attempts ? 'reconnecting' : 'connecting')
      socket = new WebSocket(wsUrl)
      socket.addEventListener('open', () => {
        attempts = 0
        setError('')
        if (apiEnabled) { setStatus('live'); return }
        socket.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'logsSubscribe',
          params: [{ mentions: [PUMP_PROGRAM_ID] }, { commitment }],
        }))
      })
      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (apiEnabled) {
            if (payload.type === 'system.ready' || payload.type === 'system.pump_status') { setStatus(payload.data?.state === 'live' ? 'live' : payload.data?.state || 'connecting'); return }
            if (payload.type !== 'launch.created' || !payload.data) return
            const launch = payload.data
            const id = launch.id || `${launch.signature}:${launch.mint}`
            if (seen.current.has(id)) return
            seen.current.add(id)
            setLaunches((current) => [{ ...launch, id }, ...current].slice(0, MAX_LAUNCHES))
            return
          }
          if (payload.id === 1 && payload.result) { setStatus('live'); return }
          const result = payload.params?.result
          if (!result?.value || result.value.err) return
          const decoded = extractPumpCreateEvents(result.value.logs)
          if (!decoded.length) return
          const observedAt = new Date().toISOString()
          const incoming = decoded.flatMap((launch) => {
            const id = `${result.value.signature}:${launch.mint}`
            if (seen.current.has(id)) return []
            seen.current.add(id)
            return [{ ...launch, id, signature: result.value.signature, slot: result.context?.slot, observedAt }]
          })
          if (incoming.length) setLaunches((current) => [...incoming, ...current].slice(0, MAX_LAUNCHES))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Invalid Pump event')
        }
      })
      socket.addEventListener('error', () => setError('Solana WebSocket unavailable'))
      socket.addEventListener('close', () => {
        if (cancelled) return
        attempts += 1
        setStatus('reconnecting')
        reconnectTimer = window.setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempts, 5)))
      })
    }

    hydrateRecentLaunches()
    connect()
    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [apiBaseUrl, apiEnabled, commitment, wsUrl])

  const stats = useMemo(() => {
    const now = Date.now()
    const lastMinute = launches.filter((launch) => now - new Date(launch.observedAt).getTime() < 60000)
    return {
      session: launches.length,
      perMinute: lastMinute.length,
      mayhem: launches.filter((launch) => launch.isMayhemMode).length,
      cashback: launches.filter((launch) => launch.isCashbackEnabled).length,
    }
  }, [launches])

  return { launches, status, error, stats, wsUrl, commitment }
}
