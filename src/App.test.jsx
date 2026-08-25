import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.jsx'

describe('ML ENGINE full-screen terminal', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    window.sessionStorage.clear()
  })

  it('opens the market cockpit directly without a landing page', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Three live pressure lanes/i })).toBeInTheDocument()
  }, 15000)

  it('exposes the Session Memory from the primary navigation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /SESSION MEMORY/i }))
    expect(screen.getByRole('heading', { name: /Everything the engine has/i })).toBeInTheDocument()
  }, 15000)

  it('opens the guided tour', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /GUIDED TOUR/i }))
    expect(screen.getByRole('dialog', { name: /Guided tour/i })).toBeInTheDocument()
    expect(screen.getByText('STEP 1 / 9')).toBeInTheDocument()
  }, 15000)

  it('has a buy button in the header', () => {
    render(<App />)
    const buyBtn = document.querySelector('.terminal-app__buy-btn')
    expect(buyBtn).toBeInTheDocument()
    expect(buyBtn.href).toContain('pump.fun')
  }, 15000)
})