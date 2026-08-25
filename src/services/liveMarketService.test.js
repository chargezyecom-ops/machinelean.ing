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
