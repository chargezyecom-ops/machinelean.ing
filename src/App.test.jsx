import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.jsx'

describe('HypeGraph full-screen terminal', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))

  it('opens the market cockpit directly without a landing page', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /The memetic war room/i })).toBeInTheDocument()
    expect(screen.queryByText(/The neural map of onchain attention/i)).not.toBeInTheDocument()
  }, 15000)

  it('keeps all twenty intelligence modules inside the terminal', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /ML MODULES/i }))
    expect(screen.getByRole('heading', { name: /The complete intelligence.*control plane/i })).toBeInTheDocument()
    expect(screen.getByText('MODULE MATRIX')).toBeInTheDocument()
    expect(screen.getByText('20 SYSTEMS')).toBeInTheDocument()
  }, 15000)
})
