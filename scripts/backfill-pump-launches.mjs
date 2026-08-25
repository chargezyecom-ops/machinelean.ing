import { extractPumpCreateEvents, PUMP_PROGRAM_ID } from '../src/services/pumpEventDecoder.js'

const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const maxPages = Math.max(0, Number(process.env.PUMP_BACKFILL_MAX_PAGES || 1))
const pageSize = Math.min(1000, Math.max(1, Number(process.env.PUMP_BACKFILL_PAGE_SIZE || 100)))
const transactionBatchSize = Math.min(50, Math.max(1, Number(process.env.PUMP_BACKFILL_BATCH_SIZE || 5)))
let before = process.env.PUMP_BACKFILL_BEFORE || undefined
let page = 0
let launches = 0

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function rpc(body, attempt = 0) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (response.status === 429 && attempt < 5) {
    const retryAfter = Number(response.headers.get('retry-after')) * 1000
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : Math.min(16000, 1000 * 2 ** attempt)
    process.stderr.write(`RPC rate limited; retrying in ${delay}ms\n`)
    await wait(delay)
    return rpc(body, attempt + 1)
  }
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}. Set SOLANA_RPC_URL to an archive provider for production backfills.`)
  return response.json()
}

while (!maxPages || page < maxPages) {
  const signatureResponse = await rpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'getSignaturesForAddress',
    params: [PUMP_PROGRAM_ID, { limit: pageSize, ...(before ? { before } : {}) }],
  })
  if (signatureResponse.error) throw new Error(signatureResponse.error.message)
  const signatures = signatureResponse.result || []
  if (!signatures.length) break

  for (let offset = 0; offset < signatures.length; offset += transactionBatchSize) {
    const batch = signatures.slice(offset, offset + transactionBatchSize)
    const transactionResponses = await rpc(batch.map((item, index) => ({
      jsonrpc: '2.0',
      id: index,
      method: 'getTransaction',
      params: [item.signature, { encoding: 'json', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }],
    })))
    const byId = new Map(transactionResponses.map((item) => [item.id, item]))
    batch.forEach((signatureInfo, index) => {
      const transaction = byId.get(index)?.result
      if (!transaction?.meta?.logMessages) return
      extractPumpCreateEvents(transaction.meta.logMessages).forEach((event) => {
        launches += 1
        process.stdout.write(`${JSON.stringify({
          ...event,
          signature: signatureInfo.signature,
          slot: signatureInfo.slot,
          blockTime: signatureInfo.blockTime,
        })}\n`)
      })
    })
  }

  page += 1
  before = signatures.at(-1).signature
  process.stderr.write(`Scanned page ${page}: ${signatures.length} transactions, ${launches} launches decoded\n`)
  if (signatures.length < pageSize) break
}

process.stderr.write(`Done: ${launches} canonical Pump CreateEvent records emitted as NDJSON\n`)
