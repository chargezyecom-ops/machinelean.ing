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
    expect(screen.getByRole('heading', { name: /Live memetic topology/i })).toBeInTheDocument()
    expect(screen.queryByText(/The neural map of onchain attention/i)).not.toBeInTheDocument()
  }, 15000)

  it('exposes the Machine memory from the primary navigation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /HISTORICAL LAB/i }))
    expect(screen.getByRole('heading', { name: /Understand what happens after every launch/i })).toBeInTheDocument()
  }, 15000)

  it('opens the guided four-minute presentation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /GUIDED TOUR/i }))
    expect(screen.getByRole('dialog', { name: /Every Pump.fun creation event enters here/i })).toBeInTheDocument()
    expect(screen.getByText('HOW IT WORKS')).toBeInTheDocument()
  }, 15000)

  it('keeps all twenty intelligence modules inside the terminal', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /RESEARCH MODULES/i }))
    expect(screen.getByRole('heading', { name: /The complete intelligence.*control plane/i })).toBeInTheDocument()
    expect(screen.getAllByText('RESEARCH MODULES').length).toBeGreaterThan(0)
    expect(screen.getByText('20 SYSTEMS')).toBeInTheDocument()
  }, 15000)
})
