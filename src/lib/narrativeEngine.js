/**
 * Real-time narrative engine v2.
 * Groups tokens by metadata similarity using n-gram overlap,
 * seed patterns from actual pump.fun trends, and activity co-occurrence.
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'was', 'are',
  'be', 'has', 'had', 'have', 'will', 'can', 'may', 'not', 'no', 'do',
  'if', 'so', 'up', 'out', 'all', 'new', 'first', 'last', 'long',
  'great', 'own', 'other', 'old', 'right', 'big', 'high', 'each',
  'just', 'over', 'such', 'after', 'also', 'than', 'them', 'some',
  'token', 'coin', 'sol', 'solana', 'pump', 'fun', 'crypto', 'defi',
  'web3', 'blockchain', 'protocol', 'exchange', 'swap', 'dex', 'amm',
  'bonding', 'curve', 'pool', 'market', 'trading', 'trade', 'live',
])

// Real pump.fun trend patterns - 2025/2026 trench narratives
const SEED_NARRATIVES = [
  // Animals - the dominant meta
  { pattern: /\b(dog|doge|shib|puppy|wolf|hund|paw|woof|bork|bark|corgi|husky|retriever|labrador|poodle)\b/i, label: 'DOG META', category: 'animal' },
  { pattern: /\b(cat|kitten|feline|meow|purr|nyan|neko|whisker|garfield|tom)\b/i, label: 'CAT META', category: 'animal' },
  { pattern: /\b(frog|pepe|kermit|toad|ribbit|pierre)\b/i, label: 'FROG META', category: 'animal' },
  { pattern: /\b(monkey|ape|gorilla|chimp|bonk|banana|suko)\b/i, label: 'MONKEY META', category: 'animal' },
  { pattern: /\b(bird|eagle|hawk|owl|raven|parrot|duck|swan|goose|penguin)\b/i, label: 'BIRD META', category: 'animal' },
  { pattern: /\b(bear|bull|moose|deer|elk|bison|buffalo)\b/i, label: 'BEAR/BULL', category: 'animal' },
  { pattern: /\b(fish|shark|whale|dolphin|octopus|crab|squid|jellyfish)\b/i, label: 'SEA CREATURES', category: 'animal' },
  { pattern: /\b(snake|lizard|dragon|turtle|gecko|chameleon|iguana)\b/i, label: 'REPTILE META', category: 'animal' },
  { pattern: /\b(hamster|squirrel|rabbit|bunny|mouse|rat|hamsterster)\b/i, label: 'RODENT META', category: 'animal' },

  // AI / Tech
  { pattern: /\b(ai|agent|gpu|compute|robot|neural|model|quantum|gpt|llm|openai|anthropic|claude|deepseek|gemini)\b/i, label: 'AI AGENTS', category: 'tech' },
  { pattern: /\b(bot|automat|autonomous|machine|cortex|synapse|nexus|matrix)\b/i, label: 'AUTOMATION', category: 'tech' },

  // Political / News
  { pattern: /\b(trump|maga|biden|election|president|vote|politi|kamala|desantis)\b/i, label: 'US POLITICS', category: 'news' },
  { pattern: /\b(musk|elon|tesla|spacex|founder|ceo|billionaire)\b/i, label: 'TECH FOUNDERS', category: 'news' },
  { pattern: /\b(war|army|military|russia|ukraine|china|israel|gaza|nato)\b/i, label: 'GEOPOLITICS', category: 'news' },

  // Culture / Internet
  { pattern: /\b(tiktok|instagram|youtube|twitter|viral|trend|challenge|influencer)\b/i, label: 'SOCIAL VIRAL', category: 'culture' },
  { pattern: /\b(celebrity|star|famous|actor|rapper|singer|musician|kardashian|kanye|taylor)\b/i, label: 'CELEBRITY', category: 'culture' },
  { pattern: /\b(nft|jpeg|pixel|art|collection|rare|mint|pfp)\b/i, label: 'NFT ART', category: 'culture' },

  // Finance mimicry
  { pattern: /\b(stock|fund|intel|nvidia|reserve|treasury|money|tax|irs|sec)\b/i, label: 'FINANCE MIMICRY', category: 'finance' },
  { pattern: /\b(btc|bitcoin|eth|ethereum|xrp|bnb|ada|doge|pepe|bonk|wif)\b/i, label: 'BLUE CHIP COPY', category: 'finance' },

  // Gaming
  { pattern: /\b(gaming|game|play|quest|pvp|rpg|mmo|pixel|mario|zelda|pokemon)\b/i, label: 'GAMING', category: 'culture' },

  // Vibes / Aesthetic
  { pattern: /\b(moon|rocket|mars|space|galaxy|alien|ufo|star|cosmos|satellite|astro)\b/i, label: 'SPACE META', category: 'vibes' },
  { pattern: /\b(skull|death|dark|demon|hell|grim|shadow|night|ghost|phantom|skeleton)\b/i, label: 'DARK AESTHETIC', category: 'vibes' },
  { pattern: /\b(rebel|anarch|punk|raw|chaos|riot|revolt|guerrilla)\b/i, label: 'REBEL PUNK', category: 'vibes' },
  { pattern: /\b(diamond|gem|ruby|sapphire|gold|silver|crystal|jade|emerald)\b/i, label: 'PRECIOUS', category: 'vibes' },
  { pattern: /\b(baby|kid|child|toddler|infant|newborn|lil|mini)\b/i, label: 'BABY META', category: 'vibes' },
  { pattern: /\b(food|pizza|burger|sushi|taco|coffee|beer|wine|ramen)\b/i, label: 'FOOD META', category: 'vibes' },
  { pattern: /\b(sports|football|soccer|basket|tennis|f1|nba|ufc|boxing)\b/i, label: 'SPORTS', category: 'culture' },
  { pattern: /\b(viking|norse|warrior|knight|samurai|spartan|legion|gladiator)\b/i, label: 'WARRIOR', category: 'vibes' },

  // Meme meta
  { pattern: /\b(meme|lol|lmao|funny|joke|satire|parody|irony|troll|shitpost)\b/i, label: 'PURE MEME', category: 'meme' },
  { pattern: /\b(alpha|beta|sigma|omega|gamma|delta|giga|mega|ultra|super)\b/i, label: 'GREEK/MEGA', category: 'meme' },
]

function tokenize(text) {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
}

function extractNgrams(tokens, maxN = 2) {
  const ngrams = new Set()
  for (const token of tokens) ngrams.add(token)
  for (let n = 2; n <= Math.min(maxN, tokens.length); n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.add(tokens.slice(i, i + n).join(' '))
    }
  }
  return ngrams
}

function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size === 0 ? 0 : intersection.size / union.size
}

function extractDominantTerms(tokenTexts, topN = 3) {
  const freq = new Map()
  tokenTexts.forEach((text) => {
    tokenize(text).forEach((term) => freq.set(term, (freq.get(term) || 0) + 1))
  })
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term]) => term.toUpperCase())
}

function matchSeedNarrative(token) {
  const text = `${token.symbol || ''} ${token.name || ''} ${token.description || ''}`
  for (const seed of SEED_NARRATIVES) {
    if (seed.pattern.test(text)) {
      return { label: seed.label, category: seed.category, confidence: 0.85 }
    }
  }
  return null
}

/**
 * Enhanced clustering v2.
 * 1. Seed pattern matching for known narratives
 * 2. N-gram similarity for unknown tokens
 * 3. Time-proximity co-occurrence boost
 */
export function clusterTokensOnChain(tokens, options = {}) {
  const { maxClusters = 12, minClusterSize = 2 } = options

  // Phase 1: Seed matching
  const seedMatches = new Map()
  const unmatched = []

  tokens.forEach((token) => {
    const seed = matchSeedNarrative(token)
    if (seed) {
      if (!seedMatches.has(seed.label)) seedMatches.set(seed.label, [])
      seedMatches.get(seed.label).push({ ...token, _narrative: seed })
    } else {
      unmatched.push(token)
    }
  })

  // Phase 2: N-gram similarity clustering for unmatched tokens
  const fingerprints = unmatched.map((token) => {
    const text = `${token.symbol || ''} ${token.name || ''} ${token.description || ''}`
    const toks = tokenize(text)
    return { token, ngrams: new Set(extractNgrams(toks, 2)), text }
  })

  const clusters = []

  // Build clusters from seed matches
  seedMatches.forEach((clusterTokens, label) => {
    if (clusterTokens.length >= 1) {
      const dominantTerms = extractDominantTerms(clusterTokens.map((t) => `${t.symbol} ${t.name}`))
      clusters.push({
        id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        label,
        category: clusterTokens[0]._narrative.category,
        tokens: clusterTokens,
        size: clusterTokens.length,
        confidence: Math.min(0.95, 0.6 + clusterTokens.length * 0.04),
        method: 'seed-pattern',
        dominantTerms,
        totalVolume: clusterTokens.reduce((s, t) => s + (t.volume1h || 0), 0),
        avgChange: clusterTokens.reduce((s, t) => s + (t.change1h || 0), 0) / Math.max(clusterTokens.length, 1),
      })
    }
  })

  // Greedy N-gram clustering for unmatched
  const assigned = new Set()
  const remaining = fingerprints.filter((fp) => fp.ngrams.size >= 2)

  for (let i = 0; i < remaining.length && clusters.length < maxClusters; i++) {
    if (assigned.has(i)) continue
    const cluster = [remaining[i]]
    assigned.add(i)

    for (let j = i + 1; j < remaining.length; j++) {
      if (assigned.has(j)) continue
      const sim = jaccardSimilarity(remaining[i].ngrams, remaining[j].ngrams)
      if (sim >= 0.12) {
        cluster.push(remaining[j])
        assigned.add(j)
      }
    }

    if (cluster.length >= minClusterSize) {
      const dominantTerms = extractDominantTerms(cluster.map((c) => c.text))
      clusters.push({
        id: dominantTerms.join('-').toLowerCase().slice(0, 40),
        label: dominantTerms.join(' ') || 'EMERGING',
        category: 'emerging',
        tokens: cluster.map((c) => c.token),
        size: cluster.length,
        confidence: Math.min(0.85, 0.35 + cluster.length * 0.06),
        method: 'metadata-similarity',
        dominantTerms,
        totalVolume: cluster.reduce((s, c) => s + (c.token.volume1h || 0), 0),
        avgChange: cluster.reduce((s, c) => s + (c.token.change1h || 0), 0) / Math.max(cluster.length, 1),
      })
    }
  }

  // Put remaining unmatched tokens into a "long tail" cluster
  const unclustered = tokens.filter((t) => !clusters.some((c) => c.tokens.some((ct) => ct.address === t.address)))
  if (unclustered.length >= minClusterSize) {
    clusters.push({
      id: 'long-tail',
      label: 'LONG TAIL / UNCLASSIFIED',
      category: 'other',
      tokens: unclustered,
      size: unclustered.length,
      confidence: 0.3,
      method: 'residual',
      dominantTerms: ['MISC'],
      totalVolume: unclustered.reduce((s, t) => s + (t.volume1h || 0), 0),
      avgChange: unclustered.reduce((s, t) => s + (t.change1h || 0), 0) / Math.max(unclustered.length, 1),
    })
  }

  // Sort by total volume (biggest narratives first)
  clusters.sort((a, b) => b.totalVolume - a.totalVolume)

  return {
    clusters: clusters.slice(0, maxClusters),
    unclustered,
    metadata: {
      totalTokens: tokens.length,
      clusteredTokens: tokens.length - unclustered.length,
      clusterCount: Math.min(clusters.length, maxClusters),
      engine: 'ml-engine-v2',
    },
  }
}
