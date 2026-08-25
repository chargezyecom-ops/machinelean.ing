const GECKO_BASE = import.meta.env.VITE_GECKOTERMINAL_BASE_URL || 'https://api.geckoterminal.com/api/v2'
const cache = new Map()

const horizonConfig = {
  '1H': { timeframe: 'minute', aggregate: 1, limit: 60, ttl: 20_000 },
  '6H': { timeframe: 'minute', aggregate: 5, limit: 72, ttl: 30_000 },
  '24H': { timeframe: 'minute', aggregate: 5, limit: 288, ttl: 45_000 },
}

export async function fetchPoolOhlcv(pairAddress, horizon = '24H', signal) {
  if (!pairAddress) throw new Error('Pool address is required')
  const config = horizonConfig[horizon] || horizonConfig['24H']
  const key = `${pairAddress}:${horizon}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < config.ttl) return cached.data

  const params = new URLSearchParams({
    aggregate: String(config.aggregate),
    limit: String(config.limit),
    currency: 'usd',
    token: 'base',
  })
  const response = await fetch(`${GECKO_BASE}/networks/solana/pools/${encodeURIComponent(pairAddress)}/ohlcv/${config.timeframe}?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`OHLCV source responded ${response.status}`)
  const payload = await response.json()
  const candles = (payload.data?.attributes?.ohlcv_list || [])
    .map(([time, open, high, low, close, volume]) => ({ time: Number(time), open: Number(open), high: Number(high), low: Number(low), close: Number(close), volume: Number(volume) }))
    .filter((item) => item.time && item.open && item.high && item.low && item.close)
    .sort((a, b) => a.time - b.time)
  if (!candles.length) throw new Error('No OHLCV candles returned for this pool')
  const data = { candles, source: 'GeckoTerminal OHLCV', horizon, fetchedAt: new Date().toISOString(), aggregateSeconds: config.timeframe === 'minute' ? config.aggregate * 60 : config.aggregate * 3600 }
  cache.set(key, { at: Date.now(), data })
  return data
}
