import { useEffect, useState } from 'react'
import { Activity, Zap, Database, PlayCircle } from 'lucide-react'
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
    try { return window.sessionStorage.getItem('ml:mlearn-learn-booted') !== '1' } catch { return true }
  })
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [logoPulse, setLogoPulse] = useState(false)

  useEffect(() => {
    document.title = 'mlearn.ing - Pump.fun Market Intelligence'
    const syncHash = () => setView(initialView())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    if (!booting) return undefined
    const timer = window.setTimeout(() => {
      setBooting(false)
      try { window.sessionStorage.setItem('ml:mlearn-learn-booted', '1') } catch { /* ignore */ }
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
    try { window.sessionStorage.setItem('ml:mlearn-learn-booted', '1') } catch { /* ignore */ }
  }

  const startTour = () => {
    dismissBoot()
    setTourStep(0)
    setTourOpen(true)
  }

  return <div className="terminal-app">
    {booting && <div className="machine-boot" role="status" aria-label="Initializing the mlearn.ing interface">
      <div className="machine-boot__reticle" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="machine-boot__core">
        <span>mlearn.ing / INTELLIGENCE TERMINAL / REV 1.0</span>
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
      <a className="terminal-app__brand" href="/" aria-label="mlearn.ing">
        <MlEngineLogo pulse={logoPulse} size={27} />
        <b>mlearn.ing / INTELLIGENCE TERMINAL</b>
      </a>
      <nav aria-label="Terminal views">
        <button className={view === 'market' ? 'is-active' : ''} type="button" onClick={() => selectView('market')}><Activity size={13} />LIVE MARKETS</button>
        <button className={view === 'history' ? 'is-active' : ''} type="button" onClick={() => selectView('history')}><Database size={13} />SESSION MEMORY</button>
      </nav>
      <button className="machine-demo-trigger" type="button" onClick={startTour}><PlayCircle size={13} />GUIDED TOUR</button>
      <a href="https://pump.fun/coin/6cmLD5fnJwdbi77B4rTHWCxX91CJd8CYdNwJJsTypump" target="_blank" rel="noreferrer" className="terminal-app__buy-btn">
        <Zap size={14} />BUY PUMP.FUN
      </a>
    </header>
    <WalletGate requiredAccess="none"><main id="terminal-main">
      {view === 'history' ? <PumpHistoricalLab /> : <LiveTerminal />}
    </main></WalletGate>
    
    {tourOpen && <DemoTour step={tourStep} onStep={setTourStep} onClose={() => setTourOpen(false)} />}
  </div>
}