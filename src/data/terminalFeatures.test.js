import { describe, expect, it } from 'vitest'
import { tokens } from './marketSnapshot.js'
import { evaluateTerminalFeature, terminalFeatures } from './terminalFeatures.js'

describe('terminal feature registry', () => {
  it('ships all twenty requested operational modules', () => {
    expect(terminalFeatures).toHaveLength(20)
    expect(new Set(terminalFeatures.map((feature) => feature.id)).size).toBe(20)
  })

  it('evaluates every module without inventing missing adapter data', () => {
    terminalFeatures.forEach((feature) => {
      const output = evaluateTerminalFeature(feature.id, tokens[0], 50, 12)
      expect(output.score).toBeGreaterThanOrEqual(0)
      expect(output.score).toBeLessThanOrEqual(99)
      expect(output.bars).toHaveLength(4)
    })
    expect(evaluateTerminalFeature('kol-impact', tokens[0]).verdict).toMatch(/refused/i)
  })
})
