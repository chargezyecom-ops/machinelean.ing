const DEX_BASE = import.meta.env.VITE_DEXSCREENER_BASE_URL || 'https://api.dexscreener.com'
const GECKO_BASE = import.meta.env.VITE_GECKOTERMINAL_BASE_URL || 'https://api.geckoterminal.com/api/v2'

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`DEX Screener responded ${response.status}`)
  return response.json()
}

function bestPairForToken(pairs, address, preferredPairAddress = '') {
  const candidates = pairs.filter((pair) => pair.baseToken?.address === address)
  return candidates.find((pair) => pair.pairAddress === preferredPairAddress)
    || candidates.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0))[0]
}

function safeHttpUrl(value) {
  if (typeof value !== 'string') return ''
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : '' } catch { return '' }
}

function normalizeSocials(meta, pair) {
  const items = []
  const add = (type, label, url) => {
    const safeUrl = safeHttpUrl(url)
    if (!safeUrl || items.some((item) => item.url === safeUrl)) return
    items.push({ type: String(type || 'link').toLowerCase(), label: String(label || type || 'LINK').slice(0, 24), url: safeUrl })
  }
  ;(meta.links || []).forEach((item) => add(item.type, item.label, item.url))
  ;(pair?.info?.socials || []).forEach((item) => {
    const platform = item.platform || item.type || 'social'
    const inferredUrl = item.url || (/^(twitter|x)$/i.test(platform) && item.handle ? `https://x.com/${String(item.handle).replace(/^@/, '')}` : '')
    add(platform, item.handle || platform, inferredUrl)
  })
  ;(pair?.info?.websites || []).forEach((item) => add('website', item.label || 'WEBSITE', item.url))
  return items.slice(0, 8)
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
  const activity24 = Math.log10(Math.max((item.buys24 || 0) + (item.sells24 || 0), 1))
  const fomo = Math.round(Math.min(99, 18 + Math.log10(Math.max(item.volume1h, 1)) * 7 + activity24 * 4 + item.boosts * .035 + velocity * .22))
  const poison = Math.round(Math.min(99, turnover * .18 + (1 - balance) * 42 + (liquidity < 10000 ? 22 : 0)))
  const persistence = Math.round(Math.max(3, Math.min(97, 56 + item.change1h * .12 - Math.abs(item.change5m) * .42 + Math.log10(liquidity) * 5)))
  const confidence = Math.round(Math.max(18, Math.min(94, 34 + Math.log10(liquidity) * 10 + balance * 18 - poison * .22)))
  const heat24h = Math.round(Math.max(0, Math.min(100, 9 + Math.log10(Math.max(item.volume24, 1)) * 8 + activity24 * 5 + Math.log10(liquidity) * 3 + Math.max(-20, Math.min(20, item.change24h)) * .2)))
  return { fomo, poison, persistence, confidence, turnover, balance: Math.round(balance * 100), velocity: Math.round(velocity), heat24h }
}

function normalizePair(meta, pair) {
  const trend = meta.trending?.attributes || {}
  const txFor = (key) => trend.transactions?.[key] || pair?.txns?.[key] || {}
  const volumeFor = (key) => Number(trend.volume_usd?.[key] ?? pair?.volume?.[key]) || 0
  const changeFor = (key) => Number(trend.price_change_percentage?.[key] ?? pair?.priceChange?.[key]) || 0
  const tx5m = txFor('m5')
  const tx1h = txFor('h1')
  const tx6h = txFor('h6')
  const tx24h = txFor('h24')
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
    change5m: changeFor('m5'),
    change15m: changeFor('m15'),
    change1h: changeFor('h1'),
    change6h: changeFor('h6'),
    change24h: changeFor('h24'),
    volume5m: volumeFor('m5'),
    volume15m: volumeFor('m15'),
    volume1h: volumeFor('h1'),
    volume6h: volumeFor('h6'),
    volume24: volumeFor('h24'),
    liquidity: Number(trend.reserve_in_usd ?? pair?.liquidity?.usd) || 0,
    fdv: Number(trend.fdv_usd ?? pair?.fdv) || 0,
    marketCap: Number(trend.market_cap_usd ?? pair?.marketCap) || 0,
    buys5m: Number(tx5m.buys) || 0,
    sells5m: Number(tx5m.sells) || 0,
    buyers5m: Number(tx5m.buyers) || Number(tx5m.buys) || 0,
    sellers5m: Number(tx5m.sellers) || Number(tx5m.sells) || 0,
    buys1h: Number(tx1h.buys) || 0,
    sells1h: Number(tx1h.sells) || 0,
    buyers1h: Number(tx1h.buyers) || Number(tx1h.buys) || 0,
    sellers1h: Number(tx1h.sellers) || Number(tx1h.sells) || 0,
    buys6h: Number(tx6h.buys) || 0,
    sells6h: Number(tx6h.sells) || 0,
    buys24: Number(tx24h.buys) || 0,
    sells24: Number(tx24h.sells) || 0,
    buyers24: Number(tx24h.buyers) || Number(tx24h.buys) || 0,
    sellers24: Number(tx24h.sellers) || Number(tx24h.sells) || 0,
    boosts: Number(meta.totalAmount || meta.amount) || 0,
    profileType: meta.profileType,
    pairCreatedAt: Number(pair?.pairCreatedAt) || 0,
    isPump: /pump/i.test(pair?.dexId || '') || meta.tokenAddress.endsWith('pump'),
    trendRank: meta.trending?.rank || 0,
    isTrending24h: Boolean(meta.trending),
    sentimentPositive: Number(trend.sentiment_vote_positive_percentage) || 0,
    sentimentNegative: Number(trend.sentiment_vote_negative_percentage) || 0,
    suspiciousReports: Number(trend.community_sus_report) || 0,
    socials: normalizeSocials(meta, pair),
    dataSources: [meta.trending ? 'GeckoTerminal 24h trending' : '', pair ? 'DEX Screener market' : ''].filter(Boolean),
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
  const [topBoosts, latestBoosts, profiles, takeovers, trending] = await Promise.all([
    fetchJson(`${DEX_BASE}/token-boosts/top/v1`, signal),
    fetchJson(`${DEX_BASE}/token-boosts/latest/v1`, signal),
    fetchJson(`${DEX_BASE}/token-profiles/latest/v1`, signal),
    fetchJson(`${DEX_BASE}/community-takeovers/latest/v1`, signal),
    fetchJson(`${GECKO_BASE}/networks/solana/trending_pools?include=base_token,dex&duration=24h&include_gt_community_data=true&page=1`, signal).catch(() => ({ data: [], included: [] })),
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

  const included = new Map((trending.included || []).map((item) => [item.id, item]))
  ;(trending.data || []).forEach((pool, index) => {
    const token = included.get(pool.relationships?.base_token?.data?.id)
    const dex = included.get(pool.relationships?.dex?.data?.id)
    const tokenAddress = token?.attributes?.address
    const isPump = tokenAddress?.endsWith('pump') || /pump/i.test(dex?.id || dex?.attributes?.name || '')
    if (!tokenAddress || !isPump) return
    const previous = metadata.get(tokenAddress) || {}
    metadata.set(tokenAddress, {
      ...previous,
      tokenAddress,
      description: previous.description || token.attributes?.name || '',
      icon: previous.icon || token.attributes?.image_url || '',
      profileType: previous.profileType ? `${previous.profileType}+trending-24h` : 'trending-24h',
      trending: { rank: index + 1, poolAddress: pool.attributes?.address, dexId: dex?.id || '', attributes: pool.attributes || {} },
    })
  })

  if (!metadata.size) throw new Error('No Solana profiles returned')
  const selected = [...metadata.values()]
    .filter((item) => item.tokenAddress?.endsWith('pump') || /pump/i.test(item.trending?.dexId || ''))
    .sort((a, b) => (a.trending?.rank || 999) - (b.trending?.rank || 999) || (b.totalAmount || b.amount || 0) - (a.totalAmount || a.amount || 0))
    .slice(0, 28)
  if (!selected.length) throw new Error('No Pump.fun profiles returned')
  const addresses = selected.map((item) => item.tokenAddress).join(',')
  const pairs = await fetchJson(`${DEX_BASE}/tokens/v1/solana/${addresses}`, signal)
  const tokens = selected
    .map((meta) => normalizePair(meta, bestPairForToken(pairs, meta.tokenAddress, meta.trending?.poolAddress)))
    .filter((token) => token.isPump && (token.price || token.volume24))
    .sort((a, b) => b.volume1h - a.volume1h)

  if (!tokens.length) throw new Error('No Pump.fun market objects returned')

  return {
    fetchedAt: new Date().toISOString(),
    mode: 'pumpfun-trending-24h-live',
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
