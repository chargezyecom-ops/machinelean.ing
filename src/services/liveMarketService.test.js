import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLiveMarket } from './liveMarketService.js'

const address = '52ZzDVDPk8S4T1rfKNWSvtDnzhLN8omMK1xLCBBWpump'

function response(data) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
}

describe('Pump.fun live market adapter', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('joins boost metadata with the deepest Solana pair and derives research signals', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/token-boosts/top/')) return response([{ chainId: 'solana', tokenAddress: address, totalAmount: 500, description: 'AI cat compute network' }])
      if (url.includes('/tokens/v1/')) return response([{
        chainId: 'solana', dexId: 'pumpswap', pairAddress: 'pair-one', url: 'https://dexscreener.com/solana/pair-one',
        baseToken: { address, symbol: 'AICAT', name: 'AI Cat' }, priceUsd: '0.001',
        priceChange: { m5: 5, h1: 12, h6: 40, h24: 80 }, volume: { m5: 1000, h1: 12000, h24: 120000 },
        liquidity: { usd: 50000 }, txns: { m5: { buys: 30, sells: 20 } }, fdv: 1000000,
      }])
      return response([])
    }))

    const result = await fetchLiveMarket()
    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]).toMatchObject({ symbol: 'AICAT', boosts: 500, narrative: 'AI / COMPUTE', isPump: true })
    expect(result.tokens[0].ml.fomo).toBeGreaterThan(0)
    expect(result.narratives[0].name).toBe('AI / COMPUTE')
  })

  it('prioritizes real 24-hour Pump.fun trends and preserves multi-horizon telemetry', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('geckoterminal.com')) return response({
        data: [{ id: 'solana_pool-one', attributes: { address: 'pool-one', name: 'AICAT / SOL', reserve_in_usd: '65000', volume_usd: { m5: '1200', h1: '18000', h6: '70000', h24: '240000' }, price_change_percentage: { m5: '3', m15: '7', h1: '14', h6: '35', h24: '90' }, transactions: { m5: { buys: 32, sells: 14, buyers: 28, sellers: 12 }, h1: { buys: 240, sells: 130, buyers: 180, sellers: 98 }, h6: { buys: 900, sells: 600 }, h24: { buys: 3100, sells: 2200, buyers: 1700, sellers: 1400 } }, sentiment_vote_positive_percentage: 81, community_sus_report: 2 }, relationships: { base_token: { data: { id: 'solana_token-one' } }, dex: { data: { id: 'pumpswap' } } } }],
        included: [{ id: 'solana_token-one', type: 'token', attributes: { address, name: 'AI Cat', symbol: 'AICAT', image_url: 'https://example.com/aicat.png' } }, { id: 'pumpswap', type: 'dex', attributes: { name: 'PumpSwap' } }],
      })
      if (url.includes('/tokens/v1/')) return response([{ chainId: 'solana', dexId: 'pumpswap', pairAddress: 'pool-one', url: 'https://dexscreener.com/solana/pool-one', baseToken: { address, symbol: 'AICAT', name: 'AI Cat' }, priceUsd: '.001', info: { socials: [{ platform: 'twitter', handle: 'aicat' }] }, liquidity: { usd: 64000 }, txns: {} }])
      return response([])
    }))

    const result = await fetchLiveMarket()
    expect(result.mode).toBe('pumpfun-trending-24h-live')
    expect(result.tokens[0]).toMatchObject({ isTrending24h: true, trendRank: 1, volume24: 240000, buys24: 3100, sellers24: 1400, sentimentPositive: 81 })
    expect(result.tokens[0].socials[0].url).toBe('https://x.com/aicat')
    expect(result.tokens[0].ml.heat24h).toBeGreaterThan(0)
  })

  it('rejects an empty Solana universe', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response([])))
    await expect(fetchLiveMarket()).rejects.toThrow('No Solana profiles returned')
  })

  it('rejects Solana profiles outside the Pump.fun universe', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/token-boosts/top/')) return response([{ chainId: 'solana', tokenAddress: 'NotAPumpMint111', totalAmount: 10 }])
      return response([])
    }))
    await expect(fetchLiveMarket()).rejects.toThrow('No Pump.fun profiles returned')
  })
})
