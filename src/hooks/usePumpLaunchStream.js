import { useEffect, useMemo, useRef, useState } from 'react'

const MAX_LAUNCHES = 200

export function usePumpLaunchStream() {
  const [launches, setLaunches] = useState([])
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState('')
  const [backfillProgress, setBackfillProgress] = useState(null)
  const seen = useRef(new Set())

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return undefined
    if (typeof WebSocket === 'undefined') { setStatus('unsupported'); return undefined }

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api'
    const wsUrl = apiBase.replace(/^http/, 'ws') + '/v1/stream'

    let socket
    let reconnectTimer
    let cancelled = false
    let attempts = 0

    const connect = () => {
      if (cancelled) return
      setStatus(attempts ? 'reconnecting' : 'connecting')
      socket = new WebSocket(wsUrl)

      socket.addEventListener('open', () => {
        attempts = 0
        setError('')
      })

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data)

          if (payload.type === 'system.ready') {
            setStatus(payload.data?.pump?.state === 'live' ? 'live' : 'connecting')
            return
          }

          if (payload.type === 'system.pump_status') {
            setStatus(payload.data?.state === 'live' ? 'live' : payload.data?.state || 'connecting')
            return
          }

          if (payload.type === 'launch.created' && payload.data) {
            const launch = payload.data
            const id = launch.id || `${launch.signature}:${launch.mint}`
            if (seen.current.has(id)) return
            seen.current.add(id)
            setLaunches((current) => [{ ...launch, id }, ...current].slice(0, MAX_LAUNCHES))
            return
          }

          if (payload.type === 'backfill.progress') {
            setBackfillProgress(payload.data)
            return
          }

          if (payload.type === 'backfill.complete') {
            setBackfillProgress({ ...payload.data, phase: 'complete' })
            // Refresh launches
            fetch(`${apiBase}/v1/launches?limit=200`).then((r) => r.json()).then((json) => {
              if (json.data) {
                setLaunches(json.data)
              }
            }).catch(() => {})
            return
          }
        } catch { /* ignore */ }
      })

      socket.addEventListener('error', () => setError('WebSocket unavailable'))
      socket.addEventListener('close', () => {
        if (cancelled) return
        attempts += 1
        setStatus('reconnecting')
        reconnectTimer = window.setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempts, 5)))
      })
    }

    connect()

    return () => {
      cancelled = true
      clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [])

  const stats = useMemo(() => {
    const now = Date.now()
    const lastMinute = launches.filter((l) => {
      const ts = l.timestamp ? l.timestamp * 1000 : new Date(l.observedAt).getTime()
      return now - ts < 60000
    })
    return {
      session: launches.length,
      perMinute: lastMinute.length,
      mayhem: launches.filter((l) => l.isMayhemMode).length,
      cashback: launches.filter((l) => l.isCashbackEnabled).length,
    }
  }, [launches])

  return { launches, status, error, stats, backfillProgress }
}

