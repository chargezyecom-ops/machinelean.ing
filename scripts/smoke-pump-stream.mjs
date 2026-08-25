import { extractPumpCreateEvents, PUMP_PROGRAM_ID } from '../src/services/pumpEventDecoder.js'

const wsUrl = process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com'
const timeoutMs = Math.max(5000, Number(process.env.PUMP_SMOKE_TIMEOUT_MS || 30000))
const socket = new WebSocket(wsUrl)
let transactionsObserved = 0

const timeout = setTimeout(() => {
  process.stdout.write(`${JSON.stringify({ transactionsObserved, launch: null, reason: 'No CreateEvent inside observation window' })}\n`)
  socket.close()
  process.exitCode = 1
}, timeoutMs)

socket.addEventListener('open', () => socket.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'logsSubscribe',
  params: [{ mentions: [PUMP_PROGRAM_ID] }, { commitment: 'confirmed' }],
})))

socket.addEventListener('message', (message) => {
  const payload = JSON.parse(message.data)
  const result = payload.params?.result
  if (!result?.value?.logs) return
  transactionsObserved += 1
  const events = extractPumpCreateEvents(result.value.logs)
  if (!events.length) return
  clearTimeout(timeout)
  process.stdout.write(`${JSON.stringify({ transactionsObserved, signature: result.value.signature, launch: events[0] })}\n`)
  socket.close()
})

socket.addEventListener('error', () => {
  clearTimeout(timeout)
  process.stderr.write('Solana WebSocket connection failed\n')
  process.exitCode = 2
})
