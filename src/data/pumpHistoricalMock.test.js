import { describe, expect, it } from 'vitest'
import { historicalNarratives, historicalWindows, horizonProfiles, outcomeLabels, scaleHistoricalCount } from './pumpHistoricalMock.js'

describe('Pump historical research twin', () => {
  it('provides the four requested horizons', () => {
    expect(Object.keys(horizonProfiles)).toEqual(['5M', '30M', '2H', '24H'])
  })

  it('keeps historical windows internally consistent', () => {
    expect(historicalWindows['90D'].launches).toBeGreaterThan(historicalWindows['30D'].launches)
    expect(scaleHistoricalCount('30D', 1.9)).toBe(9257)
  })

  it('exposes every requested outcome label and ranked narratives', () => {
    expect(outcomeLabels.map((item) => item.id)).toEqual(expect.arrayContaining(['migration', 'ath', 'drawdown', 'rug', 'survival']))
    expect(historicalNarratives.every((item) => item.series.length > 4)).toBe(true)
  })
})
