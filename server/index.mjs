import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { createPumpIngestor } from './pumpIngestor.mjs'
import { loadState, saveState, saveStateImmediate, getState, getCachedToken, setCachedToken, trackWalletFlow } from './stateStore.mjs'
import { backfillPumpLaunches } from './backfillService.mjs'
import { fetchTokenMarketData, fetchBatchMarketData } from './enrichmentService.mjs'
import { analyzeNarratives, analyzeWalletPatterns } from './narrativeService.mjs'
import { isKnownKOL, getKOLLabel } from './kolWallets.mjs'
import { getTokenHolders, analyzeHolderConcentration, buildWalletReport } from './walletTracker.mjs'

const port = Number(process.env.PORT || 8787)
const host = process.env.HOST || '127.0.0.1'
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((v) => v.trim())
const state = await loadState()
const streamClients = new Set()
let pumpStatus = { state: process.env.SOLANA_WS_URL ? 'starting' : 'not_configured' }
let backfillState = { status: 'idle', progress: null }

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' }, bodyLimit: 1_000_000 })
await app.register(cors, { origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) })
await app.register(websocket)

const meta = (status = 'observed', sources = []) => ({ observed_at: new Date().toISOString(), source: sources, data_status: status, confidence: status === 'abstain' ? 0 : 1 })
const broadcast = (event) => { const p = JSON.stringify(event); streamClients.forEach((c) => { if (c.readyState === 1) c.send(p) }) }

const storeLaunch = (launch) => {
  const id = `${launch.signature}:${launch.mint}`
  if (state.launches.some((l) => l.id === id)) return
  const kolLabel = getKOLLabel(launch.creator)
  const stored = { ...launch, id, isKOL: isKnownKOL(launch.creator), kolLabel }
  state.launches.unshift(stored)
  state.launches = state.launches.slice(0, 500)

  // Track creator wallet flow
  trackWalletFlow(launch.creator, launch.mint, launch.symbol, 'creator', launch.timestamp)
  if (kolLabel) {
    state.kolLabels[launch.creator] = kolLabel
  }

  saveState()
  broadcast({ type: 'launch.created', data: stored })
}

// === ROUTES ===

app.get('/api/health', async () => ({
  ok: true, service: 'ml-engine-api', version: '2.0.0', pump: pumpStatus,
  backfill: backfillState,
  counts: { launches: state.launches.length, wallets: Object.keys(state.walletFlows).length },
  ...meta('observed', ['ml-engine-api']),
}))

// Backfill last 24h
app.post('/api/v1/backfill', async (request, reply) => {
  if (backfillState.status === 'running') {
    return reply.code(409).send({ error: 'backfill_already_running', progress: backfillState.progress })
  }
  const hours = Number(request.body?.hours) || 24
  backfillState = { status: 'running', progress: { phase: 'starting', message: `Starting backfill of last ${hours}h...` } }
  broadcast({ type: 'backfill.started', data: { hours } })

  backfillPumpLaunches(hours, (progress) => {
    backfillState.progress = progress
    broadcast({ type: 'backfill.progress', data: progress })
  }).then((launches) => {
    let added = 0
    for (const launch of launches) {
      const id = `${launch.signature}:${launch.mint}`
      if (!state.launches.some((l) => l.id === id)) {
        const kolLabel = getKOLLabel(launch.creator)
        state.launches.unshift({ ...launch, id, isKOL: isKnownKOL(launch.creator), kolLabel })
        trackWalletFlow(launch.creator, launch.mint, launch.symbol, 'creator', launch.timestamp)
        if (kolLabel) state.kolLabels[launch.creator] = kolLabel
        added++
      }
    }
    state.launches.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    state.launches = state.launches.slice(0, 500)
    state.lastBackfill = Date.now()
    saveState()
    backfillState = { status: 'complete', progress: { phase: 'complete', message: `Backfill complete: ${added} new / ${launches.length} total`, found: launches.length, added } }
    broadcast({ type: 'backfill.complete', data: { found: launches.length, added } })
  }).catch((error) => {
    backfillState = { status: 'error', progress: { phase: 'error', message: error.message } }
    broadcast({ type: 'backfill.error', data: { error: error.message } })
  })
  return { status: 'started', message: `Backfill started for last ${hours}h.` }
})

// Get launches
app.get('/api/v1/launches', async (request) => {
  const limit = Math.min(500, Number(request.query.limit || 100))
  const launches = state.launches.slice(0, limit)
  if (request.query.enrich === 'true') {
    const mints = launches.map((l) => l.mint)
    const marketData = await fetchBatchMarketData(mints)
    return {
      data: launches.map((l) => ({ ...l, market: marketData.get(l.mint) || null })),
      pump: pumpStatus,
      counts: { total: state.launches.length },
      ...meta('observed', ['pump-program-logs', 'dexscreener']),
    }
  }
  return { data: launches, pump: pumpStatus, counts: { total: state.launches.length }, ...meta('observed', ['pump-program-logs']) }
})

// Token market data
app.get('/api/v1/tokens/:mint/market', async (request, reply) => {
  const mint = request.params.mint
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return reply.code(400).send({ error: 'invalid_mint' })
  const data = await fetchTokenMarketData(mint)
  if (!data) return reply.code(404).send({ error: 'not_found', ...meta('abstain', ['dexscreener']) })
  return { data, ...meta('observed', ['dexscreener']) }
})

// Batch market data
app.get('/api/v1/tokens/batch/market', async (request) => {
  const mints = String(request.query.mints || '').split(',').filter(Boolean).slice(0, 30)
  if (!mints.length) return { data: {}, ...meta('observed', []) }
  const results = await fetchBatchMarketData(mints)
  const data = {}
  for (const [mint, market] of results) { if (market) data[mint] = market }
  return { data, ...meta('observed', ['dexscreener']) }
})

// Token holders
app.get('/api/v1/tokens/:mint/holders', async (request, reply) => {
  const mint = request.params.mint
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return reply.code(400).send({ error: 'invalid_mint' })
  const concentration = await analyzeHolderConcentration(mint)
  if (!concentration) return reply.code(404).send({ error: 'no_holders_found', ...meta('abstain') })
  return { data: concentration, ...meta('observed', ['solana-rpc']) }
})

// Narratives
app.get('/api/v1/narratives', async () => {
  const recent = state.launches.slice(0, 500)
  const mints = recent.map((l) => l.mint)
  const marketData = await fetchBatchMarketData(mints)
  const enriched = recent.map((l) => ({ ...l, ...(marketData.get(l.mint) || {}) })).filter((t) => t.mint)
  const narratives = analyzeNarratives(enriched)
  const walletAnalysis = analyzeWalletPatterns(recent)
  return {
    narratives,
    walletAnalysis,
    stats: { totalLaunches: state.launches.length, enriched: enriched.filter((t) => t.price > 0).length, totalVolume: enriched.reduce((s, t) => s + (t.volume1h || 0), 0) },
    ...meta('derived', ['pump-program-logs', 'dexscreener']),
  }
})

// Wallet report (smart money, sniper cohorts, KOL leaderboard)
app.get('/api/v1/wallets/report', async () => {
  const report = buildWalletReport(state)
  return { data: report, ...meta('derived', ['pump-program-logs']) }
})

// Wallet patterns (legacy route)
app.get('/api/v1/wallets/patterns', async () => {
  const analysis = analyzeWalletPatterns(state.launches.slice(0, 500))
  return { data: analysis, ...meta('derived', ['pump-program-logs']) }
})

// KOL leaderboard
app.get('/api/v1/kol/leaderboard', async () => {
  const kolLaunches = state.launches.filter((l) => l.isKOL)
  const kolStats = new Map()
  for (const launch of kolLaunches) {
    const wallet = launch.creator
    if (!kolStats.has(wallet)) {
      kolStats.set(wallet, { wallet, label: launch.kolLabel || 'TRACKED', launches: [], totalVolume: 0 })
    }
    const stat = kolStats.get(wallet)
    stat.launches.push({ mint: launch.mint, symbol: launch.symbol, timestamp: launch.timestamp })
  }
  const leaderboard = [...kolStats.values()].sort((a, b) => b.launches.length - a.launches.length)
  return { data: leaderboard, ...meta('derived', ['pump-program-logs']) }
})

// Live stats summary
app.get('/api/v1/stats', async () => {
  const now = Date.now()
  const last1h = state.launches.filter((l) => now - (l.timestamp ? l.timestamp * 1000 : 0) < 3600000)
  const last24h = state.launches.filter((l) => now - (l.timestamp ? l.timestamp * 1000 : 0) < 86400000)
  return {
    data: {
      totalLaunches: state.launches.length,
      last1h: last1h.length,
      last24h: last24h.length,
      uniqueCreators: new Set(state.launches.map((l) => l.creator)).size,
      kolLaunches: state.launches.filter((l) => l.isKOL).length,
      mayhemCount: state.launches.filter((l) => l.isMayhemMode).length,
      lastBackfill: state.lastBackfill,
    },
    ...meta('observed', ['pump-program-logs']),
  }
})

// WebSocket stream
app.get('/api/v1/stream', { websocket: true }, (socket, request) => {
  const origin = request.headers.origin
  if (origin && !allowedOrigins.includes(origin)) { socket.close(1008, 'Origin not allowed'); return }
  streamClients.add(socket)
  socket.send(JSON.stringify({ type: 'system.ready', data: { pump: pumpStatus, backfill: backfillState, counts: { launches: state.launches.length } } }))
  socket.on('close', () => streamClients.delete(socket))
})

app.setErrorHandler((error, _request, reply) => { app.log.error(error); reply.code(error.statusCode || 500).send({ error: 'request_failed', message: error.message }) })

const ingestor = createPumpIngestor({ wsUrl: process.env.SOLANA_WS_URL, commitment: process.env.PUMP_COMMITMENT || 'confirmed', onLaunch: storeLaunch, onStatus: (next) => { pumpStatus = { ...next, observedAt: new Date().toISOString() }; broadcast({ type: 'system.pump_status', data: pumpStatus }) } })

// Auto-backfill on startup if data is stale (>1h)
const STALE_THRESHOLD = 60 * 60 * 1000
if (state.launches.length === 0 || Date.now() - (state.lastBackfill || 0) > STALE_THRESHOLD) {
  console.log('[server] Data is stale or empty, triggering auto-backfill...')
  setTimeout(async () => {
    try {
      backfillState = { status: 'running', progress: { phase: 'auto-backfill', message: 'Auto-backfilling last 24h on startup...' } }
      broadcast({ type: 'backfill.started', data: { hours: 24, auto: true } })
      const launches = await backfillPumpLaunches(24, (progress) => {
        backfillState.progress = progress
        broadcast({ type: 'backfill.progress', data: progress })
      })
      let added = 0
      for (const launch of launches) {
        const id = `${launch.signature}:${launch.mint}`
        if (!state.launches.some((l) => l.id === id)) {
          const kolLabel = getKOLLabel(launch.creator)
          state.launches.unshift({ ...launch, id, isKOL: isKnownKOL(launch.creator), kolLabel })
          trackWalletFlow(launch.creator, launch.mint, launch.symbol, 'creator', launch.timestamp)
          added++
        }
      }
      state.launches.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      state.launches = state.launches.slice(0, 500)
      state.lastBackfill = Date.now()
      saveState()
      backfillState = { status: 'complete', progress: { phase: 'complete', message: `Auto-backfill: ${added} new / ${launches.length} total`, found: launches.length, added } }
      console.log(`[server] Auto-backfill complete: ${added} new launches added`)
      broadcast({ type: 'backfill.complete', data: { found: launches.length, added } })
    } catch (err) {
      console.error('[server] Auto-backfill failed:', err.message)
      backfillState = { status: 'error', progress: { phase: 'error', message: err.message } }
    }
  }, 2000) // Wait 2s for WebSocket to be ready
}

ingestor.start()

const shutdown = async () => {
  ingestor.stop()
  await saveStateImmediate()
  await app.close()
  console.log('[server] Shutdown complete, state saved')
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await app.listen({ port, host })
console.log(`[server] ML ENGINE API running on http://${host}:${port}`)
