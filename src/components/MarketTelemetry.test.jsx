import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LiveMarketChart from './LiveMarketChart.jsx'
import MarketTelemetry from './MarketTelemetry.jsx'

const token = {
  address: 'TokenAddress111111111111111111111111111pump', pairAddress: 'PoolAddress', symbol: 'HOT', name: 'Hot Market', narrative: 'AI / COMPUTE', trendRank: 2,
  price: .0012, change24h: 42, volume5m: 1200, volume24: 850000, liquidity: 100000,
  buys5m: 30, sells5m: 20, buys1h: 250, sells1h: 150, buys6h: 900, sells6h: 600, buys24: 3000, sells24: 2000, buyers24: 1600, sellers24: 1200,
  sentimentPositive: 78, suspiciousReports: 2, socials: [{ type: 'twitter', label: 'hotmarket', url: 'https://x.com/hotmarket' }],
}

describe('verified market telemetry', () => {
  it('renders the live chart shell and horizon controls', () => {
    render(<LiveMarketChart token={token} />)
    expect(screen.getByRole('heading', { name: /Hot Market.*HOT/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '24H' })).toHaveClass('is-active')
    expect(screen.getByText('VERIFIED OHLCV CHART')).toBeInTheDocument()
  })

  it('presents session liquidity, multi-window transactions and declared socials', () => {
    const telemetry = new Map([[token.address, [{ time: 100, liquidity: 100000 }, { time: 200, liquidity: 104000 }]]])
    render(<MarketTelemetry token={{ ...token, liquidity: 104000 }} narratives={[{ name: 'AI / COMPUTE', tokens: 3, volume1h: 120000, momentum: 12 }]} telemetry={telemetry} liquidityEvents={[]} isLive />)
    expect(screen.getByRole('heading', { name: /Capital, transactions, narrative and social/i })).toBeInTheDocument()
    expect(screen.getByText('+4.00%')).toBeInTheDocument()
    expect(screen.getByText('5K TX')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /hotmarkettwitter/i })).toHaveAttribute('href', 'https://x.com/hotmarket')
  })
})
