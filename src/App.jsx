import { useEffect, useState } from 'react'
import { Activity, ArrowLeftRight, CircleDot, Database, PlayCircle } from 'lucide-react'
import MlEngineLogo from './components/MlEngineLogo.jsx'
import WalletGate from './components/WalletGate.jsx'
import LiveTerminal from './components/LiveTerminal.jsx'
import PumpHistoricalLab from './components/PumpHistoricalLab.jsx'
import DemoTour from './components/DemoTour.jsx'
import { demoSteps } from './data/demoTourSteps.js'

function initialView() {
  return window.location.hash === '#history' ? 'history' : 'market'
}

export default function App() {
  const [view, setView] = useState(initialView)
  const [booting, setBooting] = useState(() => {
    try { return window.sessionStorage.getItem('ml:machinelearn-learn-booted') !== '1' } catch { return true }
  })
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [logoPulse, setLogoPulse] = useState(false)

  useEffect(() => {
    document.title = 'machinelearn.ing - Pump.fun Market Intelligence'
    const syncHash = () => setView(initialView())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    if (!booting) return undefined
    const timer = window.setTimeout(() => {
      setBooting(false)
      try { window.sessionStorage.setItem('ml:machinelearn-learn-booted', '1') } catch { /* ignore */ }
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [booting])

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoPulse(true)
      setTimeout(() => setLogoPulse(false), 1500)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (view !== 'history' || import.meta.env.MODE === 'test') return
    window.requestAnimationFrame(() => document.getElementById('history-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [view])

  useEffect(() => {
    if (!tourOpen) return undefined
    const item = demoSteps[tourStep]
    setView(item.view === 'modules' ? 'market' : item.view)
    window.history.replaceState(null, '', item.view === 'history' ? '#history' : window.location.pathname)
    if (import.meta.env.MODE === 'test') return undefined
    const timer = window.setTimeout(() => {
      document.querySelectorAll('.machine-tour-target').forEach((node) => node.classList.remove('machine-tour-target'))
      const target = document.querySelector(item.target)
      target?.classList.add('machine-tour-target')
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => {
      clearTimeout(timer)
      document.querySelectorAll('.machine-tour-target').forEach((node) => node.classList.remove('machine-tour-target'))
    }
  }, [tourOpen, tourStep])

  const selectView = (next) => {
    setTourOpen(false)
    setView(next)
    window.history.replaceState(null, '', next === 'history' ? '#history' : window.location.pathname)
    if (import.meta.env.MODE !== 'test') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dismissBoot = () => {
    setBooting(false)
    try { window.sessionStorage.setItem('ml:machinelearn-learn-booted', '1') } catch { /* ignore */ }
  }

  const startTour = () => {
    dismissBoot()
    setTourStep(0)
    setTourOpen(true)
  }

  return <div className="terminal-app">
    {booting && <div className="machine-boot" role="status" aria-label="Initializing the machinelearn.ing interface">
      <div className="machine-boot__reticle" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="machine-boot__core">
        <span>machinelearn.ing / INTELLIGENCE TERMINAL / REV 1.0</span>
        <strong>THE SYSTEM IS WATCHING.</strong>
        <div className="machine-boot__progress"><i /></div>
        <ul>
          <li>CONNECTING TO PUMP.FUN EVENT STREAM</li>
          <li>RESOLVING ON-CHAIN TOKEN METADATA</li>
          <li>CALIBRATING NARRATIVE CLUSTERING ENGINE</li>
          <li>LIVE OBSERVATION CHANNEL ESTABLISHED</li>
          <li>TRENCH SIGNAL RADAR ONLINE</li>
        </ul>
        <button type="button" onClick={dismissBoot}>SKIP INITIALIZATION</button>
      </div>
    </div>}
    <a className="skip-link" href="#terminal-main">Skip to terminal</a>
    <header className="terminal-app__nav">
      <a className="terminal-app__brand" href="/" aria-label="machinelearn.ing">
        <MlEngineLogo pulse={logoPulse} size={27} />
        <b>machinelearn.ing / INTELLIGENCE TERMINAL</b>
      </a>
      <nav aria-label="Terminal views">
        <button className={view === 'market' ? 'is-active' : ''} type="button" onClick={() => selectView('market')}><Activity size={13} />LIVE MARKETS</button>
        <button className={view === 'history' ? 'is-active' : ''} type="button" onClick={() => selectView('history')}><Database size={13} />SESSION MEMORY</button>
      </nav>
      <button className="machine-demo-trigger" type="button" onClick={startTour}><PlayCircle size={13} />GUIDED TOUR</button>
      <div className="terminal-app__state">
        <span><CircleDot size={11} />READ-ONLY MODE</span>
        <span>PUMP.FUN / MAINNET</span>
        <ArrowLeftRight size={12} />
      </div>
    </header>
    <WalletGate requiredAccess="none"><main id="terminal-main">
      {view === 'history' ? <PumpHistoricalLab /> : <LiveTerminal />}
    </main></WalletGate>
    <footer className="terminal-footer">
      <div className="terminal-footer__inner">
        <div className="terminal-footer__logos">
          <div className="terminal-footer__logo-item">
            <MlEngineLogo size={20} />
            <span>machinelearn.ing</span>
          </div>
          <div className="terminal-footer__divider" />
          <div className="terminal-footer__logo-item">
            <svg viewBox="0 0 200 56" width="20" height="20" className="terminal-footer__ai16z-logo">
              <rect width="200" height="56" rx="8" fill="none"/>
              <text x="100" y="35" textAnchor="middle" fill="#00f5d4" fontSize="28" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">ai16z</text>
            </svg>
            <span>BACKED BY ai16z</span>
          </div>
          <div className="terminal-footer__divider" />
          <div className="terminal-footer__logo-item">
            <svg viewBox="0 0 24 24" width="18" height="18" className="terminal-footer__pump-logo">
              <circle cx="12" cy="12" r="11" fill="none" stroke="#c084fc" strokeWidth="1.5"/>
              <text x="12" y="16" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">P</text>
            </svg>
            <span>POWERED BY PUMP.FUN</span>
          </div>
        </div>
        <div className="terminal-footer__right">
          <a href="https://x.com/maharshii" target="_blank" rel="noreferrer" className="terminal-footer__x" aria-label="Follow @maharshii on X">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>@maharshii</span>
          </a>
        </div>
      </div>
    </footer>
    {tourOpen && <DemoTour step={tourStep} onStep={setTourStep} onClose={() => setTourOpen(false)} />}
  </div>
}