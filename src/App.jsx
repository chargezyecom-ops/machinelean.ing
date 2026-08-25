import { useEffect, useState } from 'react'
import { Activity, ArrowLeftRight, BrainCircuit, CircleDot, Database } from 'lucide-react'
import LiveTerminal from './components/LiveTerminal.jsx'
import TerminalFeatureSuite from './components/TerminalFeatureSuite.jsx'

function initialView() {
  return window.location.hash === '#modules' ? 'modules' : window.location.hash === '#history' ? 'history' : 'market'
}

export default function App() {
  const [view, setView] = useState(initialView)

  useEffect(() => {
    document.title = 'HypeGraph OS — Live Solana Intelligence'
    const syncHash = () => setView(initialView())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    if (view !== 'history' || import.meta.env.MODE === 'test') return
    window.requestAnimationFrame(() => document.getElementById('history-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [view])

  const selectView = (next) => {
    setView(next)
    window.history.replaceState(null, '', next === 'modules' ? '#modules' : next === 'history' ? '#history' : window.location.pathname)
    if (import.meta.env.MODE !== 'test') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="terminal-app">
    <a className="skip-link" href="#terminal-main">Aller au terminal</a>
    <header className="terminal-app__nav">
      <a className="terminal-app__brand" href="/" aria-label="HypeGraph OS"><span>HG</span><b>HYPEGRAPH / INTELLIGENCE OS</b></a>
      <nav aria-label="Vues du terminal">
        <button className={view === 'market' ? 'is-active' : ''} type="button" onClick={() => selectView('market')}><Activity size={13} />MARKET FABRIC</button>
        <button className={view === 'history' ? 'is-active' : ''} type="button" onClick={() => selectView('history')}><Database size={13} />BACKTEST LAB</button>
        <button className={view === 'modules' ? 'is-active' : ''} type="button" onClick={() => selectView('modules')}><BrainCircuit size={13} />ML MODULES</button>
      </nav>
      <div className="terminal-app__state"><span><CircleDot size={11} />READ-ONLY</span><span>SOLANA / MAINNET</span><ArrowLeftRight size={12} /></div>
    </header>
    <main id="terminal-main">
      {view === 'modules' ? <TerminalFeatureSuite /> : <LiveTerminal />}
    </main>
  </div>
}
