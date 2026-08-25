import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.jsx'

describe('HypeGraph full-screen terminal', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    window.sessionStorage.clear()
  })

  it('opens the market cockpit directly without a landing page', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /The memetic observation grid/i })).toBeInTheDocument()
    expect(screen.queryByText(/The neural map of onchain attention/i)).not.toBeInTheDocument()
  }, 15000)

  it('exposes the Machine memory from the primary navigation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /MACHINE MEMORY/i }))
    expect(screen.getByRole('heading', { name: /The Machine remembers every launch/i })).toBeInTheDocument()
  }, 15000)

  it('keeps all twenty intelligence modules inside the terminal', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /ANALYTIC FUNCTIONS/i }))
    expect(screen.getByRole('heading', { name: /The complete intelligence.*control plane/i })).toBeInTheDocument()
    expect(screen.getByText('ANALYTIC FUNCTION INDEX')).toBeInTheDocument()
    expect(screen.getByText('20 FUNCTIONS')).toBeInTheDocument()
  }, 15000)
})
