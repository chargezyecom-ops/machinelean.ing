/**
 * Mock data engine for mlearn.ing demo.
 * Generates realistic pump.fun tokens, narratives, buy/sell signals,
 * and liquidity flows that update over time.
 */

// ---- Narrative archetypes pulled from actual pump.fun trenches ----
const NARRATIVE_POOLS = [
  { label: 'AI AGENT', category: 'tech', symbols: ['AIBOT','NEURAL','AGENT','CORTEX','SYNAP','GPT4U','LLAMA','DEEPFK','COPILOT','AUTONM'], names: ['AI Agent Coin','Neural Network Token','Autonomous Agent','GPT-4 Ultra','DeepSeek Agent','Cortex AI','Synapse Protocol','Copilot Token','AutoMind','LLAMA AI'] },
  { label: 'DOG META', category: 'animal', symbols: ['DOGE2','PUPW','BARK','WOOF','CORGI','HUSKY','SHIB2','PAWL','DOGGO','FLOKI2'], names: ['Dogefather 2.0','Puppy World','Bark Token','Woof Coin','Corgi Cash','Husky Inu','Shiba 2.0','Paw Liberty','Doggo Moon','Floki Redux'] },
  { label: 'CAT META', category: 'animal', symbols: ['MEOW','NYAN','KITTY','WHISK','FELIX','LUNA2','PUSSY','CATNIP','TOM2','KITTEN'], names: ['Meow Coin','Nyan Token','Kitty Finance','Whiskers','Felix Gold','Luna Cat','Pussy Sol','Catnip Cash','Tom Cat','Kitten Rush'] },
  { label: 'FROG META', category: 'animal', symbols: ['PEPE2','RIBIT','TOAD','KERM','FROGO','BULLF','CAZN','POND','LILPE','KERMT'], names: ['Pepe 2.0','Ribbit Token','Toad Money','Kermit Coin','Froggo','Bullfrog','Cazen','Pond Life','Lil Pepe','Kermit Max'] },
  { label: 'POLITICS', category: 'news', symbols: ['TRUMP2','MAGA','BIDEN2','VOTE','DESA','KAMALA2','SENAT','elect','FREEDM','PRES'], names: ['Trump 2026','MAGA Coin','Biden Token','Vote DAO','DeSantis Coin','Kamala Token','Senate Coin','Election3','Freedom','President'] },
  { label: 'MONKEY META', category: 'animal', symbols: ['APE2','BONK2','CHIMP','MONK','GORL','BANANA2','SUKO','ORANG','SPIDER','BABOON'], names: ['Ape Coin 2.0','Bonk 2.0','Chimp Token','Monkey Moon','Gorilla Gold','Banana Cash','Suko Coin','Orangutan','Spider Ape','Baboon'] },
  { label: 'DARK AESTHETIC', category: 'vibes', symbols: ['SKULL','DEATH','VOID','GRIM','NIGHT2','DARK0','SHADOW','PHANT','BONE','HEXL'], names: ['Skull Token','Death Coin','Void Money','Grim Reaper','Night Shade','Dark Zero','Shadow DAO','Phantom','Bone Coin','Hex Lord'] },
  { label: 'SPACE META', category: 'vibes', symbols: ['MOON2','MARS3','ALIEN','UFO2','STAR2','COSM','GALAX','ORBIT2','ASTRO2','NEBUL'], names: ['Moon 2.0','Mars Colony','Alien Coin','UFO Token','Star Dust','Cosmos','Galaxy Token','Orbit','Astro Cash','Nebula'] },
  { label: 'FOOD META', category: 'vibes', symbols: ['PIZZA2','BURGER','SUSHI2','TACO','RAMEN','BEER2','WINE2','FRIES','TACO2','NACHO'], names: ['Pizza Cash','Burger Token','Sushi Rush','Taco Coin','Ramen Money','Beer Token','Wine DAO','Fries Cash','Taco Max','Nacho Coin'] },
  { label: 'BIRD META', category: 'animal', symbols: ['EAGLE','OWL2','HAWK2','DUCK2','GOOSE','SWAN2','RAVEN2','ROBIN','PENG2','PARROT'], names: ['Eagle Coin','Owl Token','Hawk Money','Duck Coin','Goose Cash','Swan DAO','Raven','Robin Token','Penguin','Parrot'] },
  { label: 'GAMING', category: 'culture', symbols: ['GAME2','QUEST','PVP2','RPG2','MMO2','PIXEL2','NFT2','META2','VERSE','PLAY2'], names: ['GameFi 2.0','Quest Token','PvP Arena','RPG Coin','MMO Token','Pixel World','NFT Rush','Metaverse','Verse','Play Token'] },
  { label: 'CELEBRITY', category: 'culture', symbols: ['MUSK2','ELON2','KANYE','TAYLOR','MRBEAST','KIM','ZUCK2','BEZOS','GATES','OPRAH'], names: ['Musk Token','Elon Coin','Kanye West','Taylor Swift','MrBeast','Kim Token','Zuckerberg','Bezos Coin','Gates Token','Oprah'] },
]

const SOL_PRICES = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50]
const AGE_RANGES = ['<1m','1-5m','5-15m','15-60m','1-6h','6-24h']

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randFloat(min, max) { return Math.random() * (max - min) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomMint() { const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; return Array.from({length: 44}, () => chars[randInt(0, chars.length-1)]).join('') }

/**
 * Generate a batch of mock tokens for a specific narrative.
 */
function generateNarrativeTokens(narrative, count = 5) {
  return Array.from({length: count}, (_, i) => {
    const symbol = narrative.symbols[i % narrative.symbols.length]
    const name = narrative.names[i % narrative.names.length]
    const age = randInt(30, 86400) // seconds
    const marketCap = randFloat(1000, 2000000)
    const volume1h = randFloat(500, 500000)
    const liquidity = randFloat(2000, 300000)
    const change1h = randFloat(-60, 300)
    const change5m = randFloat(-20, 80)

    return {
      address: randomMint(),
      symbol,
      name,
      narrative: narrative.label,
      narrativeCategory: narrative.category,
      change5m,
      change1h,
      volume1h,
      liquidity,
      marketCap,
      fdv: marketCap * 1.1,
      pairCreatedAt: Date.now() - age * 1000,
      icon: `https://ui-avatars.com/api/?name=${encodeURIComponent(symbol)}&background=${randInt(10,30)}${randInt(10,30).toString(16)}${randInt(10,30).toString(16)}&color=fff&size=128&bold=true&format=svg`,
      creator: randomMint().slice(0, 8) + '...' + randomMint().slice(-4),
      isKOL: Math.random() < 0.15,
      isMayhemMode: Math.random() < 0.08,
      price: randFloat(0.000001, 0.01),
      buys1h: randInt(10, 500),
      sells1h: randInt(8, 400),
      volume24h: volume1h * randFloat(2, 8),
      txCount: randInt(50, 5000),
    }
  })
}

/**
 * Generate a full mock dataset: tokens spread across narratives.
 */
export function generateMockUniverse() {
  const allTokens = []
  const activeNarratives = NARRATIVE_POOLS.filter(() => Math.random() < 0.7) // ~8-9 active
  const narrativeMap = []

  for (const narrative of activeNarratives) {
    const tokenCount = randInt(3, 8)
    const tokens = generateNarrativeTokens(narrative, tokenCount)
    allTokens.push(...tokens)
    narrativeMap.push({
      name: narrative.label,
      tokens: tokenCount,
      volume1h: tokens.reduce((s, t) => s + t.volume1h, 0),
      momentum: tokens.reduce((s, t) => s + t.change1h, 0) / tokens.length,
      confidence: randFloat(0.55, 0.95),
      category: narrative.category,
      topTokens: tokens.slice(0, 3).map(t => ({ symbol: t.symbol, change1h: t.change1h, volume1h: t.volume1h })),
    })
  }

  // Sort narratives by volume
  narrativeMap.sort((a, b) => b.volume1h - a.volume1h)

  return { tokens: allTokens, narratives: narrativeMap }
}

// ---- Buy/Sell Signal Generator ----
const SIGNAL_TYPES = ['buy', 'sell']
const SOL_AMOUNTS = [5, 10, 20]

/**
 * Generate a random buy or sell signal.
 * Returns: { type, sol, wallet, time, targetAddress }
 */
export function generateMockSignal(tokens) {
  if (!tokens.length) return null
  const token = pick(tokens)
  return {
    id: `sig-${Date.now()}-${randInt(1000,9999)}`,
    type: pick(SIGNAL_TYPES),
    sol: pick(SOL_AMOUNTS),
    wallet: `${pick(['7x','9k','Dz','Fm','Hn','Jp','Lq','Ms','Nw','Py','Qr','Tv','Wx','Yz'])}${randInt(10,99)}${pick(['...','..'])}${randInt(100,999)}`,
    time: Date.now(),
    targetAddress: token.address,
    targetSymbol: token.symbol,
    cluster: token.narrative,
  }
}

/**
 * Generate a stream of signals over time.
 * Returns a generator that yields signals at random intervals.
 */
export function createSignalStream(tokens, onSignal, intervalMs = 3000) {
  let active = true
  const tick = () => {
    if (!active) return
    const signal = generateMockSignal(tokens)
    if (signal) onSignal(signal)
    // Random interval between 1-5 seconds
    setTimeout(tick, randInt(1000, 5000))
  }
  tick()
  return () => { active = false }
}

/**
 * Simulate a token "pumping" - gradually increase its price and volume.
 */
export function simulateTokenPump(token) {
  const pumpStrength = randFloat(0.02, 0.15) // 2-15% pump
  return {
    ...token,
    change5m: token.change5m + randFloat(5, 40),
    change1h: token.change1h + randFloat(10, 80),
    volume1h: token.volume1h * (1 + pumpStrength * 5),
    marketCap: token.marketCap * (1 + pumpStrength),
    price: token.price * (1 + pumpStrength),
  }
}

/**
 * Spawn a new token in a new or existing narrative.
 */
export function spawnNewToken(existingNarratives) {
  // 30% chance to create a new narrative, 70% add to existing
  if (existingNarratives.length === 0 || Math.random() < 0.3) {
    const narrative = pick(NARRATIVE_POOLS.filter(n => !existingNarratives.some(e => e.name === n.label)))
    if (narrative) {
      const tokens = generateNarrativeTokens(narrative, 1)
      return {
        token: { ...tokens[0], pairCreatedAt: Date.now() },
        narrative: {
          name: narrative.label,
          tokens: 1,
          volume1h: tokens[0].volume1h,
          momentum: tokens[0].change1h,
          confidence: randFloat(0.5, 0.8),
          category: narrative.category,
          topTokens: [{ symbol: tokens[0].symbol, change1h: tokens[0].change1h, volume1h: tokens[0].volume1h }],
        },
        isNew: true,
      }
    }
  }
  // Add to existing
  const existing = pick(existingNarratives)
  const matching = NARRATIVE_POOLS.find(n => n.label === existing.name)
  if (matching) {
    const tokens = generateNarrativeTokens(matching, 1)
    return {
      token: { ...tokens[0], pairCreatedAt: Date.now() },
      narrative: existing,
      isNew: false,
    }
  }
  return null
}

export { NARRATIVE_POOLS }