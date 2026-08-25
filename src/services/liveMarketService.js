const DEX_BASE = import.meta.env.VITE_DEXSCREENER_BASE_URL || 'https://api.dexscreener.com'

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`DEX Screener responded ${response.status}`)
  return response.json()
}

function bestPairForToken(pairs, address) {
  return pairs
    .filter((pair) => pair.baseToken?.address === address)
    .sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0))[0]
}

function narrativeFor(item) {
  const text = `${item.symbol} ${item.name} ${item.description}`.toLowerCase()
  const rules = [
    ['AI / COMPUTE', /\b(ai|agent|gpu|compute|robot|neural|model|quantum|photonic)\b/],
    ['FELINE META', /\b(cat|cate|kitten|feline|tiger|lion)\b/],
    ['CANINE META', /\b(dog|doge|shib|puppy|wolf)\b/],
    ['PERSONALITY', /\b(martin|elon|trump|kylie|celebrity|founder|partner)\b/],
    ['FINANCIAL MIMICRY', /\b(stock|fund|intel|nvidia|reserve|treasury|money|tax)\b/],
    ['FROG / CULT', /\b(frog|pepe|cult|community|takeover|cto)\b/],
  ]
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'UNCLASSIFIED MEME'
}

function calculateMl(item) {
  const liquidity = Math.max(item.liquidity, 1)
  const turnover = item.volume24 / liquidity
  const total5m = item.buys5m + item.sells5m
  const balance = total5m ? Math.min(item.buys5m, item.sells5m) / Math.max(item.buys5m, item.sells5m) : 0
  const velocity = Math.min(100, Math.abs(item.change5m) * 2.2 + Math.abs(item.change1h) * .55)
  const fomo = Math.round(Math.min(99, 24 + Math.log10(Math.max(item.volume1h, 1)) * 8 + item.boosts * .045 + velocity * .23))
  const poison = Math.round(Math.min(99, turnover * .18 + (1 - balance) * 42 + (liquidity < 10000 ? 22 : 0)))
  const persistence = Math.round(Math.max(3, Math.min(97, 56 + item.change1h * .12 - Math.abs(item.change5m) * .42 + Math.log10(liquidity) * 5)))
  const confidence = Math.round(Math.max(18, Math.min(94, 34 + Math.log10(liquidity) * 10 + balance * 18 - poison * .22)))
  return { fomo, poison, persistence, confidence, turnover, balance: Math.round(balance * 100), velocity: Math.round(velocity) }
}

function normalizePair(meta, pair) {
  const tx5m = pair?.txns?.m5 || {}
  const item = {
    address: meta.tokenAddress,
    pairAddress: pair?.pairAddress || '',
    symbol: pair?.baseToken?.symbol || 'UNKNOWN',
    name: pair?.baseToken?.name || meta.description?.split('\n')[0]?.slice(0, 30) || 'Unresolved token',
    description: meta.description || '',
    icon: meta.icon || pair?.info?.imageUrl || '',
    url: pair?.url || meta.url || `https://dexscreener.com/solana/${meta.tokenAddress}`,
    dexId: pair?.dexId || 'unresolved',
    price: Number(pair?.priceUsd) || 0,
    change5m: Number(pair?.priceChange?.m5) || 0,
    change1h: Number(pair?.priceChange?.h1) || 0,
    change6h: Number(pair?.priceChange?.h6) || 0,
    change24h: Number(pair?.priceChange?.h24) || 0,
    volume5m: Number(pair?.volume?.m5) || 0,
    volume1h: Number(pair?.volume?.h1) || 0,
    volume24: Number(pair?.volume?.h24) || 0,
    liquidity: Number(pair?.liquidity?.usd) || 0,
    fdv: Number(pair?.fdv) || 0,
    marketCap: Number(pair?.marketCap) || 0,
    buys5m: Number(tx5m.buys) || 0,
    sells5m: Number(tx5m.sells) || 0,
    boosts: Number(meta.totalAmount || meta.amount) || 0,
    profileType: meta.profileType,
    pairCreatedAt: Number(pair?.pairCreatedAt) || 0,
    isPump: /pump/i.test(pair?.dexId || '') || meta.tokenAddress.endsWith('pump'),
  }
  item.narrative = narrativeFor(item)
  item.ml = calculateMl(item)
  return item
}

function aggregateNarratives(tokens) {
  const grouped = new Map()
  tokens.forEach((token) => {
    const current = grouped.get(token.narrative) || { name: token.narrative, tokens: 0, volume1h: 0, liquidity: 0, boosts: 0, momentum: 0 }
    current.tokens += 1
    current.volume1h += token.volume1h
    current.liquidity += token.liquidity
    current.boosts += token.boosts
    current.momentum += token.change1h
    grouped.set(token.narrative, current)
  })
  return [...grouped.values()].map((item) => ({ ...item, momentum: item.momentum / item.tokens })).sort((a, b) => b.volume1h - a.volume1h)
}

export async function fetchLiveMarket(signal) {
  const [topBoosts, latestBoosts, profiles, takeovers] = await Promise.all([
    fetchJson(`${DEX_BASE}/token-boosts/top/v1`, signal),
    fetchJson(`${DEX_BASE}/token-boosts/latest/v1`, signal),
    fetchJson(`${DEX_BASE}/token-profiles/latest/v1`, signal),
    fetchJson(`${DEX_BASE}/community-takeovers/latest/v1`, signal),
  ])

  const metadata = new Map()
  const ingest = (rows, profileType) => rows.filter((row) => row.chainId === 'solana').forEach((row) => {
    const previous = metadata.get(row.tokenAddress) || {}
    metadata.set(row.tokenAddress, { ...previous, ...row, profileType: previous.profileType ? `${previous.profileType}+${profileType}` : profileType, totalAmount: Math.max(previous.totalAmount || 0, row.totalAmount || row.amount || 0) })
  })
  ingest(topBoosts, 'top-boost')
  ingest(latestBoosts, 'latest-boost')
  ingest(takeovers, 'takeover')
  ingest(profiles, 'profile')

  const selected = [...metadata.values()].slice(0, 28)
  if (!selected.length) throw new Error('No Solana profiles returned')
  const addresses = selected.map((item) => item.tokenAddress).join(',')
  const pairs = await fetchJson(`${DEX_BASE}/tokens/v1/solana/${addresses}`, signal)
  const tokens = selected
    .map((meta) => normalizePair(meta, bestPairForToken(pairs, meta.tokenAddress)))
    .filter((token) => token.price || token.volume24)
    .sort((a, b) => b.volume1h - a.volume1h)

  return {
    fetchedAt: new Date().toISOString(),
    tokens,
    narratives: aggregateNarratives(tokens),
    stats: {
      volume1h: tokens.reduce((sum, token) => sum + token.volume1h, 0),
      volume24: tokens.reduce((sum, token) => sum + token.volume24, 0),
      liquidity: tokens.reduce((sum, token) => sum + token.liquidity, 0),
      boosts: tokens.reduce((sum, token) => sum + token.boosts, 0),
      pumps: tokens.filter((token) => token.isPump).length,
    },
  }
}
