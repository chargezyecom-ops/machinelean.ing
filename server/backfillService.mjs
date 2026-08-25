/**
 * Pump.fun backfill service.
 * Fetches historical creation events from the last N hours via Helius RPC.
 * Uses getSignaturesForAddress + getTransaction to reconstruct history.
 */
import { extractPumpCreateEvents, PUMP_PROGRAM_ID } from '../src/services/pumpEventDecoder.js'

const HELIUS_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const MAX_PAGES = Number(process.env.PUMP_BACKFILL_MAX_PAGES) || 20
const PAGE_SIZE = Number(process.env.PUMP_BACKFILL_PAGE_SIZE) || 1000
const BATCH_SIZE = Number(process.env.PUMP_BACKFILL_BATCH_SIZE) || 5
const REQUEST_DELAY = Number(process.env.PUMP_BACKFILL_REQUEST_DELAY_MS) || 350

async function rpcCall(method, params = []) {
  const response = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`RPC ${method} failed: ${response.status}`)
  const result = await response.json()
  if (result.error) throw new Error(`RPC error: ${result.error.message || JSON.stringify(result.error)}`)
  return result.result
}

/**
 * Fetch all signatures for the Pump program in the last N hours.
 */
async function fetchRecentSignatures(hours = 24, onProgress) {
  const signatures = []
  let before = null
  const cutoff = Date.now() - hours * 3600 * 1000
  let pageCount = 0

  while (pageCount < MAX_PAGES) {
    const params = { limit: PAGE_SIZE, commitment: 'confirmed' }
    if (before) params.before = before

    onProgress?.({ phase: 'signatures', message: `Fetching page ${pageCount + 1}/${MAX_PAGES}...`, processed: signatures.length })

    let result
    try {
      result = await rpcCall('getSignaturesForAddress', [PUMP_PROGRAM_ID, params])
    } catch (err) {
      onProgress?.({ phase: 'signatures', message: `RPC error on page ${pageCount + 1}: ${err.message}. Continuing...` })
      break
    }
    if (!result || !result.length) break

    let hitCutoff = false
    for (const sig of result) {
      if (sig.blockTime && sig.blockTime * 1000 < cutoff) {
        hitCutoff = true
        break
      }
      if (!sig.err) {
        signatures.push(sig)
      }
    }

    if (hitCutoff) break
    before = result[result.length - 1]?.signature
    pageCount++

    // Rate limit
    await new Promise((r) => setTimeout(r, REQUEST_DELAY))
  }

  onProgress?.({ phase: 'signatures', message: `Fetched ${signatures.length} signatures from ${pageCount} pages`, total: signatures.length })
  return signatures
}

/**
 * Fetch full transaction and extract CreateEvent.
 */
async function fetchAndDecode(signature) {
  try {
    const tx = await rpcCall('getTransaction', [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }])
    if (!tx || !tx.meta || tx.meta.err) return null

    const logs = tx.meta.logMessages || []
    const events = extractPumpCreateEvents(logs)

    if (!events.length) return null

    return {
      ...events[0],
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime,
      observedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Backfill the last N hours of Pump.fun launches.
 * Returns an array of decoded CreateEvent objects.
 */
export async function backfillPumpLaunches(hours = 24, onProgress) {
  onProgress?.({ phase: 'signatures', message: `Fetching signatures from last ${hours}h...` })

  const signatures = await fetchRecentSignatures(hours, onProgress)
  onProgress?.({ phase: 'decode', message: `Decoding ${signatures.length} transactions...`, total: signatures.length })

  const launches = []

  for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
    const batch = signatures.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(batch.map((sig) => fetchAndDecode(sig.signature)))

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        launches.push(result.value)
      }
    }

    onProgress?.({ phase: 'decode', message: `Decoded ${Math.min(i + BATCH_SIZE, signatures.length)}/${signatures.length}`, processed: Math.min(i + BATCH_SIZE, signatures.length), total: signatures.length, found: launches.length })

    // Rate limit
    if (i + BATCH_SIZE < signatures.length) {
      await new Promise((r) => setTimeout(r, REQUEST_DELAY))
    }
  }

  onProgress?.({ phase: 'complete', message: `Backfill complete: ${launches.length} launches found`, total: signatures.length, found: launches.length })

  return launches
}
