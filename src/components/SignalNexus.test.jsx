import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SignalNexus from './SignalNexus.jsx'

const token = (overrides = {}) => ({
  address: 'AlphaAddress',
  symbol: 'ALPHA',
  name: 'Alpha Agent',
  narrative: 'AI / COMPUTE',
  url: 'https://example.com/alpha',
  change5m: 4.2,
  change1h: 12,
  change6h: 22,
  change24h: 48,
  volume1h: 120000,
  liquidity: 45000,
  ml: { fomo: 82, poison: 24, velocity: 75, confidence: 68 },
  ...overrides,
})

const tokens = [token(), token({ address: 'BetaAddress', symbol: 'BETA', name: 'Beta GPU', change5m: -2.5, ml: { fomo: 70, poison: 62, velocity: 42, confidence: 61 } })]
const narratives = [{ name: 'AI / COMPUTE', tokens: 2, volume1h: 230000, momentum: 8.4 }]
const launches = [{ id: 'fresh-1', mint: 'FreshMintAddress1111', creator: 'CreatorAddress2222', symbol: 'FRESH', name: 'Fresh launch', timestamp: 1787670000, slot: 321456789, signature: 'signature', isMayhemMode: false, isCashbackEnabled: false }]

describe('SignalNexus', () => {
  it('switches horizon and selects a market token', () => {
    const onSelectToken = vi.fn()
    render(<SignalNexus tokens={tokens} narratives={narratives} launches={launches} selectedAddress="AlphaAddress" onSelectToken={onSelectToken} />)
    expect(screen.getByRole('heading', { name: /Live memetic topology/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '24H' }))
    expect(screen.getByRole('button', { name: /Sélectionner ALPHA.*\+48\.0%/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sélectionner BETA/i }))
    expect(onSelectToken).toHaveBeenCalledWith('BetaAddress')
  })

  it('filters a narrative and inspects a real mint-to-creator pair', () => {
    render(<SignalNexus tokens={tokens} narratives={narratives} launches={launches} selectedAddress="AlphaAddress" onSelectToken={() => {}} />)
    const narrative = screen.getByRole('button', { name: /Filtrer le thème AI \/ COMPUTE/i })
    fireEvent.click(narrative)
    expect(narrative).toHaveClass('is-selected')
    fireEvent.click(screen.getByRole('button', { name: /Inspecter le nouveau token FRESH/i }))
    expect(screen.getByText('NEW MINT OBSERVED')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '$FRESH' })).toBeInTheDocument()
    expect(screen.getByText(/Le lien mint ↔ créateur vient directement des logs/i)).toBeInTheDocument()
  })
})
