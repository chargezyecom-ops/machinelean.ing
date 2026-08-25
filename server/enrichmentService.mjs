/**
 * Token enrichment service.
 * Fetches market data from DexScreener for a batch of token mints.
 * Includes price, volume, liquidity, logo, social links.
 */
const DEX_BASE = 'https://api.dexscreener.com'
const CACHE_TTL = 60_000 // 1 minute
const cache = new Map()

function getCached(mint) {
  const entry = cache.get(mint)
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data
  return null
}

function setCache(mint, data) {
  cache.set(mint, { data, ts: Date.now() })
  if (cache.size > 500) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
}

/**
 * Fetch market data for a single token from DexScreener.
 */
export async function fetchTokenMarketData(mint) {
  const cached = getCached(mint)
  if (cached) return cached

  try {
    const response = await fetch(`${DEX_BASE}/tokens/v1/solana/${mint}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null

    const pairs = await response.json()
    if (!pairs?.length) return null

    // Pick the pair with highest liquidity
    const pair = pairs.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0))[0]

    const data = {
      mint,
      symbol: pair.baseToken?.symbol || 'UNKNOWN',
      name: pair.baseToken?.name || '',
      icon: pair.info?.imageUrl || '',
      price: Number(pair.priceUsd) || 0,
      marketCap: Number(pair.marketCap) || Number(pair.fdv) || 0,
      fdv: Number(pair.fdv) || 0,
      liquidity: Number(pair.liquidity?.usd) || 0,
      volume24h: Number(pair.volume?.h24) || 0,
      volume1h: Number(pair.volume?.h1) || 0,
      volume6h: Number(pair.volume?.h6) || 0,
      change5m: Number(pair.priceChange?.m5) || 0,
      change1h: Number(pair.priceChange?.h1) || 0,
      change6h: Number(pair.priceChange?.h6) || 0,
      change24h: Number(pair.priceChange?.h24) || 0,
      buys24h: Number(pair.txns?.h24?.buys) || 0,
      sells24h: Number(pair.txns?.h24?.sells) || 0,
      buys1h: Number(pair.txns?.h1?.buys) || 0,
      sells1h: Number(pair.txns?.h1?.sells) || 0,
      pairAddress: pair.pairAddress || '',
      dexId: pair.dexId || '',
      url: pair.url || `https://dexscreener.com/solana/${mint}`,
      pairCreatedAt: Number(pair.pairCreatedAt) || 0,
      website: pair.info?.websites?.[0]?.url || '',
      socials: (pair.info?.socials || []).map((s) => ({ platform: s.platform || s.type, handle: s.handle, url: s.url })).filter(Boolean),
    }

    setCache(mint, data)
    return data
  } catch {
    return null
  }
}

/**
 * Batch fetch market data for multiple mints.
 * DexScreener supports comma-separated mints (up to 30).
 */
export async function fetchBatchMarketData(mints) {
  const results = new Map()
  const uncached = []

  for (const mint of mints) {
    const cached = getCached(mint)
    if (cached) {
      results.set(mint, cached)
    } else {
      uncached.push(mint)
    }
  }

  // DexScreener batch endpoint
  const batchSize = 30
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize)
    try {
      const response = await fetch(`${DEX_BASE}/tokens/v1/solana/${batch.join(',')}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) continue

      const pairs = await response.json()
      if (!Array.isArray(pairs)) continue

      // Group by token address
      const grouped = new Map()
      for (const pair of pairs) {
        const address = pair.baseToken?.address
        if (!address) continue
        if (!grouped.has(address)) grouped.set(address, [])
        grouped.get(address).push(pair)
      }

      // Pick best pair per token
      for (const [address, tokenPairs] of grouped) {
        const pair = tokenPairs.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0))[0]
        const data = {
          mint: address,
          symbol: pair.baseToken?.symbol || 'UNKNOWN',
          name: pair.baseToken?.name || '',
          icon: pair.info?.imageUrl || '',
          price: Number(pair.priceUsd) || 0,
          marketCap: Number(pair.marketCap) || Number(pair.fdv) || 0,
          fdv: Number(pair.fdv) || 0,
          liquidity: Number(pair.liquidity?.usd) || 0,
          volume24h: Number(pair.volume?.h24) || 0,
          volume1h: Number(pair.volume?.h1) || 0,
          volume6h: Number(pair.volume?.h6) || 0,
          change5m: Number(pair.priceChange?.m5) || 0,
          change1h: Number(pair.priceChange?.h1) || 0,
          change6h: Number(pair.priceChange?.h6) || 0,
          change24h: Number(pair.priceChange?.h24) || 0,
          buys24h: Number(pair.txns?.h24?.buys) || 0,
          sells24h: Number(pair.txns?.h24?.sells) || 0,
          buys1h: Number(pair.txns?.h1?.buys) || 0,
          sells1h: Number(pair.txns?.h1?.sells) || 0,
          pairAddress: pair.pairAddress || '',
          dexId: pair.dexId || '',
          url: pair.url || `https://dexscreener.com/solana/${address}`,
          pairCreatedAt: Number(pair.pairCreatedAt) || 0,
          website: pair.info?.websites?.[0]?.url || '',
          socials: (pair.info?.socials || []).map((s) => ({ platform: s.platform || s.type, handle: s.handle, url: s.url })).filter(Boolean),
        }
        setCache(address, data)
        results.set(address, data)
      }

      // Also set results for mints that had no pair
      for (const mint of batch) {
        if (!results.has(mint)) {
          results.set(mint, null)
        }
      }
    } catch {
      for (const mint of batch) {
        if (!results.has(mint)) results.set(mint, null)
      }
    }

    if (i + batchSize < uncached.length) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  return results
}
