import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SignalNexus from './SignalNexus.jsx'

describe('SignalNexus', () => {
  it('renders the topology section', () => {
    render(<SignalNexus liveTokens={[]} clusters={[]} narrativeLabels={[]} launches={[]} selectedAddress="" onSelectToken={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /Real-time pump.fun token clustering/i })).toBeInTheDocument()
    expect(screen.getAllByText(/TOKENS/).length).toBeGreaterThanOrEqual(1)
  })
  it('shows ML prediction panel', () => {
    render(<SignalNexus liveTokens={[]} clusters={[]} narrativeLabels={[]} launches={[]} selectedAddress="" onSelectToken={() => {}} />)
    expect(screen.getByText(/ML PUMP PREDICTIONS/)).toBeInTheDocument()
  })
})