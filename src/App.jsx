import { useEffect, useState } from 'react'
import { Activity, ArrowLeftRight, BrainCircuit, CircleDot, Database } from 'lucide-react'
import LiveTerminal from './components/LiveTerminal.jsx'
import TerminalFeatureSuite from './components/TerminalFeatureSuite.jsx'

function initialView() {
  return window.location.hash === '#modules' ? 'modules' : window.location.hash === '#history' ? 'history' : 'market'
}

export default function App() {
  const [view, setView] = useState(initialView)
  const [booting, setBooting] = useState(() => {
    try { return window.sessionStorage.getItem('hg:machine-booted') !== '1' } catch { return true }
  })

  useEffect(() => {
    document.title = 'HypeGraph Machine — Pump.fun Observation System'
    const syncHash = () => setView(initialView())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    if (!booting) return undefined
    const timer = window.setTimeout(() => {
      setBooting(false)
      try { window.sessionStorage.setItem('hg:machine-booted', '1') } catch { /* storage is optional */ }
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [booting])

  useEffect(() => {
    if (view !== 'history' || import.meta.env.MODE === 'test') return
    window.requestAnimationFrame(() => document.getElementById('history-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [view])

  const selectView = (next) => {
    setView(next)
    window.history.replaceState(null, '', next === 'modules' ? '#modules' : next === 'history' ? '#history' : window.location.pathname)
    if (import.meta.env.MODE !== 'test') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dismissBoot = () => {
    setBooting(false)
    try { window.sessionStorage.setItem('hg:machine-booted', '1') } catch { /* storage is optional */ }
  }

  return <div className="terminal-app">
    {booting && <div className="machine-boot" role="status" aria-label="Initialisation de l’interface HypeGraph">
      <div className="machine-boot__reticle" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="machine-boot__core">
        <span>HYPEGRAPH MACHINE INTERFACE / REV 0.4</span>
        <strong>THE SYSTEM IS WATCHING.</strong>
        <div className="machine-boot__progress"><i /></div>
        <ul><li>ACCESSING PUMP.FUN EVENT MEMORY</li><li>RESOLVING WALLET IDENTITIES</li><li>CALIBRATING MEMETIC PROPAGATION MODEL</li><li>LIVE OBSERVATION CHANNEL ESTABLISHED</li></ul>
        <button type="button" onClick={dismissBoot}>SKIP INITIALIZATION</button>
      </div>
    </div>}
    <a className="skip-link" href="#terminal-main">Aller au terminal</a>
    <header className="terminal-app__nav">
      <a className="terminal-app__brand" href="/" aria-label="HypeGraph Machine"><span>HG</span><b>HYPEGRAPH / MACHINE INTERFACE</b></a>
      <nav aria-label="Vues du terminal">
        <button className={view === 'market' ? 'is-active' : ''} type="button" onClick={() => selectView('market')}><Activity size={13} />LIVE OBSERVATION</button>
        <button className={view === 'history' ? 'is-active' : ''} type="button" onClick={() => selectView('history')}><Database size={13} />MACHINE MEMORY</button>
        <button className={view === 'modules' ? 'is-active' : ''} type="button" onClick={() => selectView('modules')}><BrainCircuit size={13} />ANALYTIC FUNCTIONS</button>
      </nav>
      <div className="terminal-app__state"><span><CircleDot size={11} />OBSERVER MODE</span><span>PUMP.FUN / MAINNET</span><ArrowLeftRight size={12} /></div>
    </header>
    <main id="terminal-main">
      {view === 'modules' ? <TerminalFeatureSuite /> : <LiveTerminal />}
    </main>
  </div>
}
