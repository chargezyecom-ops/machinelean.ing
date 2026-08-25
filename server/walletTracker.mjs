/**
 * Wallet tracker service.
 * Tracks holder distribution, smart money patterns, and wallet flows.
 * Uses Helius RPC for on-chain data (getTokenLargestAccounts, etc.)
 */

const HELIUS_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const holderCache = new Map()
const smartMoneyCache = new Map()

async function rpcCall(method, params = []) {
  const response = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`RPC ${method} failed: ${response.status}`)
  const result = await response.json()
  if (result.error) throw new Error(`RPC error: ${result.error.message}`)
  return result.result
}

/**
 * Get the largest holders of a token (top 20).
 * Returns array of { address, amount, decimals, uiAmount }
 */
export async function getTokenHolders(mint, maxHolders = 20) {
  const cached = holderCache.get(mint)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  try {
    const result = await rpcCall('getTokenLargestAccounts', [mint])
    if (!result?.value) return []

    const holders = result.value.slice(0, maxHolders).map((h) => ({
      address: h.address,
      amount: h.amount,
      decimals: h.decimals,
      uiAmount: h.uiAmount,
      uiAmountString: h.uiAmountString,
    }))

    holderCache.set(mint, { data: holders, ts: Date.now() })
    return holders
  } catch (err) {
    console.error(`[walletTracker] Failed to get holders for ${mint}:`, err.message)
    return []
  }
}

/**
 * Get account info for a wallet (SOL balance + token count).
 */
export async function getWalletInfo(address) {
  try {
    const result = await rpcCall('getBalance', [address])
    const solBalance = result?.value ? result.value / 1e9 : 0
    return { address, solBalance }
  } catch {
    return { address, solBalance: 0 }
  }
}

/**
 * Analyze holder concentration for a token.
 * Returns { topHolderPct, top5Pct, uniqueHolders, concentrationLevel }
 */
export async function analyzeHolderConcentration(mint) {
  const holders = await getTokenHolders(mint, 20)
  if (!holders.length) return null

  const totalAmount = holders.reduce((s, h) => s + (Number(h.amount) || 0), 0)
  if (!totalAmount) return null

  const top1Pct = (Number(holders[0]?.amount) || 0) / totalAmount * 100
  const top5Pct = holders.slice(0, 5).reduce((s, h) => s + (Number(h.amount) || 0), 0) / totalAmount * 100

  let concentrationLevel = 'distributed'
  if (top1Pct > 50) concentrationLevel = 'highly_concentrated'
  else if (top1Pct > 30) concentrationLevel = 'concentrated'
  else if (top5Pct > 60) concentrationLevel = 'moderately_concentrated'

  return {
    mint,
    topHolderPct: Math.round(top1Pct * 100) / 100,
    top5Pct: Math.round(top5Pct * 100) / 100,
    uniqueHolders: holders.length,
    concentrationLevel,
    holders,
  }
}

/**
 * Track which wallets appear across multiple tokens.
 * Builds a map of wallet -> [tokens they hold/held]
 */
export function trackWalletFlows(state) {
  const walletTokens = new Map() // wallet -> Set<mint>
  const walletTokenDetails = new Map() // wallet -> [{ mint, symbol, role, firstSeen }]

  for (const launch of state.launches) {
    const creator = launch.creator
    if (!creator) continue

    if (!walletTokens.has(creator)) walletTokens.set(creator, new Set())
    walletTokens.get(creator).add(launch.mint)

    if (!walletTokenDetails.has(creator)) walletTokenDetails.set(creator, [])
    walletTokenDetails.get(creator).push({
      mint: launch.mint,
      symbol: launch.symbol,
      name: launch.name,
      role: 'creator',
      timestamp: launch.timestamp,
    })
  }

  // Also check walletFlows from state (tracked holder appearances)
  if (state.walletFlows) {
    for (const [wallet, flows] of Object.entries(state.walletFlows)) {
      if (!walletTokens.has(wallet)) walletTokens.set(wallet, new Set())
      if (!walletTokenDetails.has(wallet)) walletTokenDetails.set(wallet, [])
      for (const flow of flows) {
        walletTokens.get(wallet).add(flow.mint)
        walletTokenDetails.get(wallet).push(flow)
      }
    }
  }

  // Score wallets by activity
  const scored = []
  for (const [wallet, tokens] of walletTokens) {
    if (tokens.size < 2) continue // Only wallets across multiple tokens

    const details = walletTokenDetails.get(wallet) || []
    const isKOL = state.kolLabels?.[wallet] || false
    scored.push({
      wallet,
      tokenCount: tokens.size,
      tokens: [...tokens],
      details: details.slice(0, 20),
      isKOL,
      label: isKOL ? (typeof isKOL === 'string' ? isKOL : 'TRACKED WALLET') : null,
      score: Math.min(100, tokens.size * 10 + (isKOL ? 20 : 0)),
    })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored
}

/**
 * Find sniper cohorts: wallets that appear in multiple recent launches
 * within a short time window (potential coordinated snipers).
 */
export function findSniperCohorts(state, timeWindowMs = 300000) {
  const recentLaunches = state.launches.filter((l) => {
    const age = Date.now() - (l.timestamp ? l.timestamp * 1000 : Date.now())
    return age < 24 * 3600 * 1000 // last 24h
  })

  // Group launches by time proximity
  const cohorts = new Map()
  for (const launch of recentLaunches) {
    const creator = launch.creator
    if (!creator) continue

    // Check if this creator has launched multiple tokens recently
    const creatorLaunches = recentLaunches.filter((l) => l.creator === creator)
    if (creatorLaunches.length >= 2) {
      const key = creator
      if (!cohorts.has(key)) {
        cohorts.set(key, {
          wallet: creator,
          launches: [],
          isKOL: state.kolLabels?.[creator] || false,
        })
      }
      cohorts.get(key).launches.push({
        mint: launch.mint,
        symbol: launch.symbol,
        timestamp: launch.timestamp,
      })
    }
  }

  return [...cohorts.values()]
    .filter((c) => c.launches.length >= 2)
    .sort((a, b) => b.launches.length - a.launches.length)
}

/**
 * Build a complete wallet analysis report.
 */
export function buildWalletReport(state) {
  const smartMoney = trackWalletFlows(state)
  const sniperCohorts = findSniperCohorts(state)
  const totalWallets = new Set(state.launches.map((l) => l.creator).filter(Boolean)).size
  const kolCount = smartMoney.filter((w) => w.isKOL).length

  return {
    smartMoney: smartMoney.slice(0, 50),
    sniperCohorts: sniperCohorts.slice(0, 20),
    stats: {
      totalUniqueWallets: totalWallets,
      multiTokenWallets: smartMoney.length,
      knownKOLs: kolCount,
      totalLaunches: state.launches.length,
    },
  }
}
