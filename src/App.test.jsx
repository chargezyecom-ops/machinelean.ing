import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'

function renderRoute(path = '/') {
  window.history.replaceState({}, '', path)
  return render(<App />)
}

describe('HypeGraph research interface', () => {
  it('renders a dedicated ML and GPU landing page', () => {
    renderRoute('/')
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /A model stack.*memetic markets/i })).toBeInTheDocument()
    expect(screen.getByText('Temporal entity graph')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Launch terminal/i })).toHaveAttribute('href', '/app')
    expect(screen.queryByRole('heading', { name: /Interrogate the attention manifold/i })).not.toBeInTheDocument()
  }, 15000)

  it('renders the market terminal on the application route', () => {
    renderRoute('/app')
    expect(screen.getAllByText(/OBSERVED/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/SIMULATED/).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /Interrogate the attention manifold/i })).toBeInTheDocument()
  }, 15000)

  it('filters the token tensor by narrative and search', () => {
    const { container } = renderRoute('/app')
    const terminal = within(container.querySelector('#terminal'))
    fireEvent.click(screen.getByRole('button', { name: /ANIMAL MEMETICS/i }))
    expect(terminal.getByText('CATE')).toBeInTheDocument()
    expect(terminal.queryByText('PONS')).not.toBeInTheDocument()
    fireEvent.change(terminal.getByPlaceholderText(/SEARCH SYMBOL/i), { target: { value: 'no-match' } })
    expect(terminal.getByText(/No tensor matches/i)).toBeInTheDocument()
  })

  it('switches the cohort window without claiming unavailable observations', () => {
    const { container } = renderRoute('/app')
    const terminal = within(container.querySelector('#terminal'))
    fireEvent.click(terminal.getByRole('button', { name: '48H' }))
    fireEvent.click(terminal.getByText('PONS'))
    expect(terminal.getByText('24H AVAILABLE / 48H COHORT')).toBeInTheDocument()
  })

  it('exposes ten executable signal laboratories', () => {
    renderRoute('/app')
    expect(screen.getAllByRole('tab')).toHaveLength(10)
    expect(screen.getByText('Narrative arbitrage radar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /LIQ-STRESS/i }))
    expect(screen.getByText('Liquidity reflexivity test')).toBeInTheDocument()
    expect(screen.getByText(/Impact proxy/)).toBeInTheDocument()
  })

  it('abstains from KOL scoring when the social adapter is missing', () => {
    renderRoute('/app')
    fireEvent.click(screen.getByRole('tab', { name: /KOL-IMPULSE/i }))
    expect(screen.getByText('ABSTAIN / NO SOCIAL EVENTS')).toBeInTheDocument()
    expect(screen.getByText(/refuse un score KOL/i)).toBeInTheDocument()
  })
})
