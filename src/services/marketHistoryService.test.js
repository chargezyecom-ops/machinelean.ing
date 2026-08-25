import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPoolOhlcv } from './marketHistoryService.js'

describe('GeckoTerminal OHLCV adapter', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('normalizes real candle tuples in chronological order', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: { attributes: { ohlcv_list: [[200, 2, 3, 1, 2.5, 80], [100, 1, 2, .5, 1.5, 50]] } } }),
    })))
    const result = await fetchPoolOhlcv('pool-test-one', '1H')
    expect(result.candles).toEqual([
      { time: 100, open: 1, high: 2, low: .5, close: 1.5, volume: 50 },
      { time: 200, open: 2, high: 3, low: 1, close: 2.5, volume: 80 },
    ])
    expect(result.source).toBe('GeckoTerminal OHLCV')
  })

  it('rejects a missing pool address', async () => {
    await expect(fetchPoolOhlcv('', '24H')).rejects.toThrow('Pool address is required')
  })
})
