import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { randomUUID } from 'node:crypto'
import { terminalFeatures } from '../src/data/terminalFeatures.js'
import { createPumpIngestor } from './pumpIngestor.mjs'
import { loadState, saveState } from './stateStore.mjs'

const port = Number(process.env.PORT || 8787)
const host = process.env.HOST || '127.0.0.1'
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((value) => value.trim())
const state = await loadState()
const streamClients = new Set()
const socialCache = new Map()
let pumpStatus = { state: process.env.SOLANA_WS_URL ? 'starting' : 'not_configured' }
let persistTimer

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' }, bodyLimit: 1_000_000 })
await app.register(cors, { origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) })
await app.register(websocket)

const metadata = (status = 'observed', sources = []) => ({ observed_at: new Date().toISOString(), source: sources, freshness_ms: 0, data_status: status, confidence: status === 'abstain' ? 0 : 1, evidence_refs: [] })
const schedulePersist = () => { clearTimeout(persistTimer); persistTimer = setTimeout(() => saveState(state).catch((error) => app.log.error(error)), 150) }
const broadcast = (event) => {
  const payload = JSON.stringify(event)
  streamClients.forEach((client) => { if (client.readyState === 1) client.send(payload) })
}
const storeLaunch = (launch) => {
  const id = `${launch.signature}:${launch.mint}`
  if (state.launches.some((item) => item.id === id)) return
  const stored = { ...launch, id }
  state.launches.unshift(stored)
  state.launches = state.launches.slice(0, 2000)
  schedulePersist()
  broadcast({ type: 'launch.created', data: stored })
}
const abstain = (adapter, detail) => ({ ...metadata('abstain'), adapter, reason: detail })

app.get('/api/health', async () => ({ ok: true, service: 'hypegraph-api', version: '0.3.0', pump: pumpStatus, counts: { launches: state.launches.length, alerts: state.alerts.length, cases: state.cases.length }, ...metadata('observed', ['hypegraph-api']) }))
app.get('/api/v1/features', async () => ({ data: terminalFeatures, ...metadata('derived', ['hypegraph-feature-registry']) }))
app.get('/api/v1/launches', async (request) => ({ data: state.launches.slice(0, Math.min(500, Number(request.query.limit || 100))), pump: pumpStatus, ...metadata('observed', ['pump-program-logs']) }))
app.get('/api/v1/stream', { websocket: true }, (socket, request) => { const origin = request.headers.origin; if (origin && !allowedOrigins.includes(origin)) { socket.close(1008, 'Origin not allowed'); return }; streamClients.add(socket); socket.send(JSON.stringify({ type: 'system.ready', data: { pump: pumpStatus } })); socket.on('close', () => streamClients.delete(socket)) })

app.get('/api/v1/wallets/:address/profile', async () => abstain('wallet-indexer', 'Transaction-level wallet history is not configured'))
app.get('/api/v1/creators/:address/lineage', async () => abstain('entity-graph', 'Creator funding edges are not configured'))
app.get('/api/v1/tokens/:mint/snipers', async () => abstain('slot-indexer', 'First-slot token balance deltas are not configured'))
app.get('/api/v1/embeddings/narratives', async () => abstain('model-gateway', 'Multimodal embedding endpoint is not configured'))
app.get('/api/v1/cohorts/convergence', async () => abstain('wallet-indexer', 'Performance-ranked cohorts are not configured'))
app.get('/api/v1/tokens/:mint/lifecycle', async (request) => {
  const launch = state.launches.find((item) => item.mint === request.params.mint)
  return launch ? { data: { stage: 'bonding', launch }, ...metadata('observed', ['pump-program-logs']) } : abstain('pump-indexer', 'Mint not found in retained launch stream')
})
app.get('/api/v1/graph/temporal', async () => abstain('entity-graph', 'Temporal graph database is not configured'))
app.get('/api/v1/entities/:id/impact', async () => abstain('social-indexer', 'Timestamped social events are not configured'))
app.get('/api/v1/tokens/:mint/integrity', async () => abstain('transaction-indexer', 'Counterparty-level swap data is not configured'))
app.get('/api/v1/tokens/:mint/socials', async (request, reply) => {
  if (!process.env.X_BEARER_TOKEN) return { data: null, configured: false, ...abstain('x-recent-search', 'Set X_BEARER_TOKEN to activate verified recent social mentions') }
  const mint = String(request.params.mint || '')
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return reply.code(400).send({ error: 'invalid_mint' })
  const symbol = String(request.query.symbol || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16)
  const cacheKey = `${mint}:${symbol}`
  const cached = socialCache.get(cacheKey)
  if (cached && Date.now() - cached.at < 60_000) return cached.payload
  const query = [`"${mint}"`, symbol ? `"$${symbol}"` : ''].filter(Boolean).join(' OR ')
  const params = new URLSearchParams({ query: `(${query}) lang:en -is:retweet`, max_results: '25', 'tweet.fields': 'created_at,public_metrics,author_id', expansions: 'author_id', 'user.fields': 'username,name,verified,public_metrics' })
  const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`, Accept: 'application/json' } })
  if (!response.ok) return reply.code(502).send({ error: 'social_source_failed', upstreamStatus: response.status })
  const result = await response.json()
  const authors = new Map((result.includes?.users || []).map((item) => [item.id, item]))
  const posts = (result.data || []).map((post) => ({ id: post.id, createdAt: post.created_at, text: post.text, metrics: post.public_metrics || {}, author: authors.get(post.author_id) ? { username: authors.get(post.author_id).username, name: authors.get(post.author_id).name, verified: Boolean(authors.get(post.author_id).verified), followers: Number(authors.get(post.author_id).public_metrics?.followers_count) || 0 } : null }))
  const payload = { data: { mentions: posts.length, engagement: posts.reduce((sum, post) => sum + Number(post.metrics.like_count || 0) + Number(post.metrics.retweet_count || 0) + Number(post.metrics.reply_count || 0) + Number(post.metrics.quote_count || 0), 0), verifiedAuthors: posts.filter((post) => post.author?.verified).length, posts }, configured: true, ...metadata('observed', ['x-recent-search']) }
  socialCache.set(cacheKey, { at: Date.now(), payload })
  return payload
})

app.get('/api/v1/alerts', async () => ({ data: state.alerts, ...metadata('observed', ['hypegraph-state']) }))
app.post('/api/v1/alerts', async (request, reply) => { const body = request.body || {}; const item = { id: randomUUID(), createdAt: new Date().toISOString(), token: String(body.token || '').slice(0, 32), feature: String(body.feature || '').slice(0, 64), threshold: Math.max(0, Math.min(100, Number(body.threshold) || 0)) }; state.alerts.unshift(item); state.alerts = state.alerts.slice(0, 500); schedulePersist(); reply.code(201); return { data: item, ...metadata('observed', ['hypegraph-state']) } })
app.delete('/api/v1/alerts/:id', async (request, reply) => { const before = state.alerts.length; state.alerts = state.alerts.filter((item) => item.id !== request.params.id); if (state.alerts.length === before) return reply.code(404).send({ error: 'not_found' }); schedulePersist(); return reply.code(204).send() })
app.get('/api/v1/cases', async () => ({ data: state.cases, ...metadata('observed', ['hypegraph-state']) }))
app.post('/api/v1/cases', async (request, reply) => { const body = request.body || {}; const item = { id: randomUUID(), createdAt: new Date().toISOString(), token: String(body.token || '').slice(0, 32), feature: String(body.feature || '').slice(0, 64), note: String(body.note || '').slice(0, 4000) }; state.cases.unshift(item); state.cases = state.cases.slice(0, 500); schedulePersist(); reply.code(201); return { data: item, ...metadata('observed', ['hypegraph-state']) } })
app.delete('/api/v1/cases/:id', async (request, reply) => { const before = state.cases.length; state.cases = state.cases.filter((item) => item.id !== request.params.id); if (state.cases.length === before) return reply.code(404).send({ error: 'not_found' }); schedulePersist(); return reply.code(204).send() })
app.post('/api/v1/replay', async (request) => { const beforeSlot = Number(request.body?.beforeSlot || Number.MAX_SAFE_INTEGER); return { data: state.launches.filter((item) => Number(item.slot) <= beforeSlot).slice(0, 500), ...metadata('observed', ['pump-program-logs']) } })

app.post('/api/v1/models/survival', async () => abstain('model-gateway', 'Calibrated survival model is not configured'))
app.post('/api/v1/copilot/query', async (request) => {
  if (process.env.MODEL_GATEWAY_URL && process.env.MODEL_GATEWAY_KEY) {
    const response = await fetch(process.env.MODEL_GATEWAY_URL, { method: 'POST', headers: { Authorization: `Bearer ${process.env.MODEL_GATEWAY_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) })
    if (!response.ok) throw new Error(`Model gateway responded ${response.status}`)
    return { ...(await response.json()), ...metadata('model', ['model-gateway']) }
  }
  return { answer: 'The local HypeGraph API is online. A model gateway is required for grounded natural-language synthesis.', ...metadata('abstain', ['hypegraph-api']) }
})
const withoutSecret = (item) => { const safe = { ...item }; delete safe.secret; return safe }
app.get('/api/v1/webhooks', async () => ({ data: state.webhooks.map(withoutSecret), ...metadata('observed', ['hypegraph-state']) }))
app.post('/api/v1/webhooks', async (request, reply) => { const body = request.body || {}; const item = { id: randomUUID(), createdAt: new Date().toISOString(), active: true, url: String(body.url || '').slice(0, 2048), events: Array.isArray(body.events) ? body.events.map(String).slice(0, 20) : [] }; state.webhooks.unshift(item); state.webhooks = state.webhooks.slice(0, 100); schedulePersist(); reply.code(201); return { data: withoutSecret(item), ...metadata('observed', ['hypegraph-state']) } })
app.post('/api/v1/webhooks/test', async () => ({ delivered: false, ...abstain('webhook-worker', 'Outbound webhook delivery is disabled until WEBHOOK_SIGNING_SECRET is configured') }))

app.setErrorHandler((error, _request, reply) => { app.log.error(error); reply.code(error.statusCode || 500).send({ error: 'request_failed', message: error.message }) })

const ingestor = createPumpIngestor({ wsUrl: process.env.SOLANA_WS_URL, commitment: process.env.PUMP_COMMITMENT || 'confirmed', onLaunch: storeLaunch, onStatus: (next) => { pumpStatus = { ...next, observedAt: new Date().toISOString() }; broadcast({ type: 'system.pump_status', data: pumpStatus }) } })
ingestor.start()

const shutdown = async () => { ingestor.stop(); clearTimeout(persistTimer); await saveState(state); await app.close() }
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await app.listen({ port, host })
