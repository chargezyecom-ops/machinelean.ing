/**
 * Server-side narrative analysis engine.
 * Groups tokens into narratives based on:
 * 1. On-chain activity patterns (volume, velocity, holder behavior)
 * 2. Metadata similarity (name, symbol, description)
 * 3. Temporal clustering (tokens created around the same time)
 * 4. Wallet co-occurrence (same wallets buying multiple tokens)
 */

/**
 * Build a narrative fingerprint for a token based on its metadata.
 */
function buildFingerprint(token) {
  const text = `${token.symbol || ''} ${token.name || ''} ${token.description || ''}`.toLowerCase()
  return {
    text,
    words: text.split(/[^a-z0-9]+/).filter((w) => w.length >= 3),
    mints: [token.mint],
  }
}

/**
 * Jaccard similarity between two sets.
 */
function jaccard(a, b) {
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size === 0 ? 0 : intersection.size / union.size
}

/**
 * Cluster tokens into narratives using activity patterns.
 */
export function analyzeNarratives(enrichedTokens) {
  if (!enrichedTokens.length) return []

  // Group by activity pattern
  const now = Date.now()
  const buckets = {
    surging_high_vol: [],    // volume > 50K, change1h > 20%
    rising_mid_vol: [],      // volume 10K-50K, change1h > 5%
    fresh_launches: [],      // age < 1h
    micro_cap_active: [],    // mcap < 50K, some volume
    dead: [],                // no volume in 24h
  }

  for (const token of enrichedTokens) {
    const age = token.pairCreatedAt ? (now - token.pairCreatedAt) / 3600000 : 999
    const vol = token.volume1h || 0
    const change = token.change1h || 0
    const mcap = token.marketCap || token.fdv || 0

    if (age < 1 && vol > 1000) {
      buckets.fresh_launches.push(token)
    } else if (vol > 50000 && change > 20) {
      buckets.surging_high_vol.push(token)
    } else if (vol > 10000 && change > 5) {
      buckets.rising_mid_vol.push(token)
    } else if (mcap < 50000 && vol > 100) {
      buckets.micro_cap_active.push(token)
    } else {
      buckets.dead.push(token)
    }
  }

  // Build narratives from buckets
  const narratives = []

  const labels = {
    surging_high_vol: 'SURGING / HIGH VOLUME',
    rising_mid_vol: 'RISING MOMENTUM',
    fresh_launches: 'FRESH LAUNCHES',
    micro_cap_active: 'MICRO CAP ACTIVE',
    dead: 'DORMANT',
  }

  for (const [key, tokens] of Object.entries(buckets)) {
    if (!tokens.length) continue

    const totalVolume = tokens.reduce((s, t) => s + (t.volume1h || 0), 0)
    const avgChange = tokens.reduce((s, t) => s + (t.change1h || 0), 0) / tokens.length
    const totalMcap = tokens.reduce((s, t) => s + (t.marketCap || 0), 0)
    const avgLiquidity = tokens.reduce((s, t) => s + (t.liquidity || 0), 0) / tokens.length

    // Find dominant terms in this bucket
    const termFreq = new Map()
    for (const token of tokens) {
      const fp = buildFingerprint(token)
      for (const word of fp.words) {
        termFreq.set(word, (termFreq.get(word) || 0) + 1)
      }
    }
    const topTerms = [...termFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word.toUpperCase())

    narratives.push({
      id: key,
      label: labels[key],
      tokens: tokens.map((t) => t.mint),
      tokenCount: tokens.length,
      totalVolume,
      totalMcap,
      avgChange: Math.round(avgChange * 100) / 100,
      avgLiquidity: Math.round(avgLiquidity),
      topTerms,
      confidence: Math.min(0.95, 0.5 + tokens.length * 0.03),
      method: 'activity-pattern',
    })
  }

  // Within each bucket, try to sub-cluster by name similarity
  for (const narrative of narratives) {
    if (narrative.tokenCount < 3) continue

    const tokensInNarrative = narrative.tokens.map((mint) => enrichedTokens.find((t) => t.mint === mint)).filter(Boolean)
    const fpMap = new Map()
    for (const token of tokensInNarrative) {
      fpMap.set(token.mint, buildFingerprint(token))
    }

    // Simple name-based sub-clustering
    const subClusters = []
    const used = new Set()

    for (const token of tokensInNarrative) {
      if (used.has(token.mint)) continue
      const fp = fpMap.get(token.mint)
      const cluster = [token]
      used.add(token.mint)

      for (const other of tokensInNarrative) {
        if (used.has(other.mint)) continue
        const otherFp = fpMap.get(other.mint)
        const sim = jaccard(fp.words, otherFp.words)
        if (sim > 0.15) {
          cluster.push(other)
          used.add(other.mint)
        }
      }

      if (cluster.length >= 2) {
        subClusters.push({
          label: cluster.map((t) => t.symbol).join('/'),
          mints: cluster.map((t) => t.mint),
          size: cluster.length,
        })
      }
    }

    if (subClusters.length > 0) {
      narrative.subClusters = subClusters
    }
  }

  // Sort by activity
  narratives.sort((a, b) => b.totalVolume - a.totalVolume)

  return narratives
}

/**
 * Track wallet activity patterns.
 * Groups wallets by their buy behavior.
 */
export function analyzeWalletPatterns(launches) {
  const walletActivity = new Map()

  for (const launch of launches) {
    const creator = launch.creator
    if (!creator) continue

    if (!walletActivity.has(creator)) {
      walletActivity.set(creator, { launches: [], totalVolume: 0 })
    }
    const activity = walletActivity.get(creator)
    activity.launches.push({
      mint: launch.mint,
      name: launch.name,
      symbol: launch.symbol,
      timestamp: launch.timestamp,
      isKOL: launch.isKOL || false,
    })
  }

  // Find wallets with multiple launches (potential deployers/KOLs)
  const suspicious = []
  for (const [wallet, activity] of walletActivity) {
    if (activity.launches.length >= 2) {
      suspicious.push({
        wallet,
        launchCount: activity.launches.length,
        launches: activity.launches,
        isPotentialKOL: activity.launches.length >= 3,
      })
    }
  }

  suspicious.sort((a, b) => b.launchCount - a.launchCount)

  return {
    totalWallets: walletActivity.size,
    multiLaunchWallets: suspicious.length,
    suspicious,
  }
}
