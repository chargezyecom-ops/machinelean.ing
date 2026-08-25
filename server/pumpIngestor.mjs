import { extractPumpCreateEvents, PUMP_PROGRAM_ID } from '../src/services/pumpEventDecoder.js'

export function createPumpIngestor({ wsUrl, commitment = 'confirmed', onLaunch, onStatus }) {
  let socket
  let reconnectTimer
  let stopped = false
  let attempts = 0

  const connect = () => {
    if (stopped || !wsUrl) return
    onStatus({ state: attempts ? 'reconnecting' : 'connecting', attempts })
    socket = new WebSocket(wsUrl)
    socket.addEventListener('open', () => {
      attempts = 0
      socket.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'logsSubscribe', params: [{ mentions: [PUMP_PROGRAM_ID] }, { commitment }] }))
    })
    socket.addEventListener('message', (message) => {
      try {
        const payload = JSON.parse(message.data)
        if (payload.id === 1 && payload.result) { onStatus({ state: 'live', subscriptionId: payload.result }); return }
        const result = payload.params?.result
        if (!result?.value || result.value.err) return
        extractPumpCreateEvents(result.value.logs).forEach((launch) => onLaunch({ ...launch, signature: result.value.signature, slot: result.context?.slot, observedAt: new Date().toISOString() }))
      } catch (error) { onStatus({ state: 'degraded', error: error.message }) }
    })
    socket.addEventListener('close', () => {
      if (stopped) return
      attempts += 1
      onStatus({ state: 'reconnecting', attempts })
      reconnectTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempts, 5)))
    })
    socket.addEventListener('error', () => onStatus({ state: 'degraded', error: 'Upstream Solana WebSocket error' }))
  }

  return {
    start() { if (!wsUrl) onStatus({ state: 'not_configured' }); else connect() },
    stop() { stopped = true; clearTimeout(reconnectTimer); socket?.close() },
  }
}
