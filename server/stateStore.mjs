/**
 * In-memory state with disk persistence.
 * Loads from disk on startup, saves on changes.
 */
import { loadFromDisk, scheduleSave, saveToDisk } from './persistence.mjs'

const state = {
  launches: [],
  walletFlows: {},   // wallet -> [{ mint, symbol, role, timestamp }]
  kolLabels: {},     // wallet -> label string
  tokenCache: {},    // mint -> { data, fetchedAt }
  lastBackfill: 0,
  alerts: [],
  cases: [],
}

export async function loadState() {
  const persisted = await loadFromDisk()
  state.launches = persisted.launches || []
  state.walletFlows = persisted.walletFlows || {}
  state.kolLabels = persisted.kolLabels || {}
  state.tokenCache = persisted.tokenCache || {}
  state.lastBackfill = persisted.lastBackfill || 0
  state.alerts = persisted.alerts || []
  state.cases = persisted.cases || []
  console.log(`[state] Loaded ${state.launches.length} launches from disk`)
  return state
}

export function saveState() {
  scheduleSave(state)
}

export function saveStateImmediate() {
  return saveToDisk(state)
}

export function getState() {
  return state
}

export function getCachedToken(mint) {
  const cached = state.tokenCache[mint]
  if (cached && Date.now() - cached.fetchedAt < 60000) return cached.data
  return null
}

export function setCachedToken(mint, data) {
  state.tokenCache[mint] = { data, fetchedAt: Date.now() }
  // Evict old entries
  const keys = Object.keys(state.tokenCache)
  if (keys.length > 500) {
    const oldest = keys.sort((a, b) => (state.tokenCache[a].fetchedAt || 0) - (state.tokenCache[b].fetchedAt || 0))[0]
    delete state.tokenCache[oldest]
  }
}

export function trackWalletFlow(wallet, mint, symbol, role, timestamp) {
  if (!wallet || !mint) return
  if (!state.walletFlows[wallet]) state.walletFlows[wallet] = []
  // Avoid duplicates
  if (!state.walletFlows[wallet].some((f) => f.mint === mint && f.role === role)) {
    state.walletFlows[wallet].push({ mint, symbol, role, timestamp, observedAt: Date.now() })
    // Keep per wallet max 100 entries
    if (state.walletFlows[wallet].length > 100) {
      state.walletFlows[wallet] = state.walletFlows[wallet].slice(-100)
    }
  }
}
