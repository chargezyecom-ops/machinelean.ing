import { useMemo, useState } from 'react'
import {
  Activity, BellRing, Bot, BrainCircuit, BriefcaseBusiness, Braces, ChevronRight,
  CircleDot, Clock3, Code2, Cpu, Database, FlaskConical, GitBranch, Network,
  Radar, Save, Search, Send, ShieldAlert, Star, Users, WalletCards, Webhook, Zap,
} from 'lucide-react'
import { terminalFeatures, evaluateTerminalFeature } from '../data/terminalFeatures.js'
import { tokens } from '../data/marketSnapshot.js'
import { createAlert, createCase, queryCopilot, researchApiEnabled } from '../services/researchApi.js'

const icons = [WalletCards, GitBranch, Users, Braces, Activity, Radar, Clock3, BellRing, FlaskConical, Network, Zap, ShieldAlert, Database, BrainCircuit, Search, Clock3, Star, Bot, Webhook, BriefcaseBusiness]

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem(key)) ?? fallback } catch { return fallback }
  })
  const update = (next) => {
    const resolved = typeof next === 'function' ? next(value) : next
    setValue(resolved)
    window.localStorage.setItem(key, JSON.stringify(resolved))
  }
  return [value, update]
}

function FeatureGraph({ token, active }) {
  const nodes = ['CREATOR', 'FUNDERS', `$${token.symbol}`, 'POOL', 'NARRATIVE', 'COHORTS']
  return <div className="feature-graph" aria-label={`Evidence graph for ${token.symbol}`}><svg viewBox="0 0 600 210" preserveAspectRatio="none" aria-hidden="true"><path d="M60 105L175 42 300 106 430 48 540 108M60 105L185 175 300 106 425 172 540 108M175 42L185 175M430 48L425 172" /></svg>{nodes.map((node, index) => <span className={index === 2 ? 'is-core' : ''} style={{ '--x': `${[10,29,50,72,90,31][index]}%`, '--y': `${[50,20,50,23,51,82][index]}%` }} key={node}><i />{node}</span>)}<b>{active.code} / EVIDENCE TOPOLOGY</b></div>
}

function MiniTrace({ values, index }) {
  const visible = values.slice(0, index + 1); const min = Math.min(...visible); const max = Math.max(...visible)
  const points = visible.map((value, point) => `${(point / Math.max(visible.length - 1, 1)) * 500},${100 - ((value - min) / Math.max(max - min, 1)) * 90 - 5}`).join(' ')
  return <svg className="feature-trace" viewBox="0 0 500 100" preserveAspectRatio="none"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg>
}

export default function TerminalFeatureSuite() {
  const [activeId, setActiveId] = useState('wallet-profile')
  const [tokenId, setTokenId] = useState(tokens[0].id)
  const [scenario, setScenario] = useState(50)
  const [replayIndex, setReplayIndex] = useState(23)
  const [copilotQuery, setCopilotQuery] = useState('')
  const [copilotAnswer, setCopilotAnswer] = useState('')
  const [copilotBusy, setCopilotBusy] = useState(false)
  const [caseNote, setCaseNote] = useState('')
  const [watchlist, setWatchlist] = useStoredState('hg:watchlist', [])
  const [alerts, setAlerts] = useStoredState('hg:alerts', [])
  const [cases, setCases] = useStoredState('hg:cases', [])
  const active = terminalFeatures.find((feature) => feature.id === activeId) || terminalFeatures[0]
  const token = tokens.find((item) => item.id === tokenId) || tokens[0]
  const output = useMemo(() => evaluateTerminalFeature(active.id, token, scenario, replayIndex), [active.id, replayIndex, scenario, token])
  const isWatched = watchlist.includes(token.id)

  const toggleWatch = () => setWatchlist((current) => current.includes(token.id) ? current.filter((id) => id !== token.id) : [...current, token.id])
  const addAlert = () => {
    const item = { id: `${token.id}-${active.id}`, token: token.symbol, feature: active.code, threshold: scenario }
    setAlerts((current) => [item, ...current.filter((alert) => alert.id !== item.id)].slice(0, 12))
    if (researchApiEnabled) createAlert(item).catch(() => {})
  }
  const addCase = () => {
    const note = caseNote.trim() || `${active.title}: ${output.verdict}`
    setCases((current) => [{ id: `${Date.now()}`, token: token.symbol, feature: active.code, note, at: new Date().toISOString() }, ...current].slice(0, 20))
    if (researchApiEnabled) createCase({ token: token.symbol, feature: active.code, note }).catch(() => {})
    setCaseNote('')
  }
  const askCopilot = async (event) => {
    event.preventDefault()
    if (!copilotQuery.trim()) return
    setCopilotBusy(true)
    try {
      if (researchApiEnabled) {
        const response = await queryCopilot({ question: copilotQuery, mint: token.pool, context: output })
        setCopilotAnswer(response.answer || 'The API returned no answer.')
      } else {
        setCopilotAnswer(`${token.symbol} is currently classified as “${output.verdict}”. The local evidence shows hype ${output.inference.hype}/100, persistence ${output.inference.persistence}/100 and contamination ${output.inference.contamination}/100. Wallet and social assertions are withheld until their adapters are connected.`)
      }
    } catch (error) { setCopilotAnswer(`Copilot unavailable: ${error.message}`) } finally { setCopilotBusy(false) }
  }

  return <section className="feature-suite" id="feature-suite" aria-labelledby="feature-suite-title"><div className="shell">
    <div className="section-kicker"><span>03 / OPERATIONAL MODULES</span><span>20 RESEARCH SYSTEMS / ONE WORKBENCH</span></div>
    <div className="section-heading split-heading"><h2 id="feature-suite-title">The complete intelligence<br /><em>control plane.</em></h2><p>Chaque module est interactif. Les calculs locaux fonctionnent immédiatement ; les analyses dépendant d’identités wallet, d’événements sociaux ou de modèles entraînés s’abstiennent jusqu’à connexion de leur API.</p></div>

    <div className="feature-suite__frame">
      <aside className="feature-index"><div className="feature-index__head"><span>MODULE MATRIX</span><b>{terminalFeatures.length} SYSTEMS</b></div>{terminalFeatures.map((feature, index) => { const Icon = icons[index]; return <button className={active.id === feature.id ? 'is-active' : ''} type="button" onClick={() => setActiveId(feature.id)} key={feature.id}><span>{feature.index}</span><i><Icon size={13} /></i><div><strong>{feature.code}</strong><small>{feature.title}</small></div><em className={feature.mode}>{feature.mode}</em><ChevronRight size={11} /></button> })}</aside>

      <div className="feature-console">
        <div className="feature-console__bar"><span>hypegraph://modules/{active.id}</span><div><i className={researchApiEnabled ? 'is-live' : ''} />API {researchApiEnabled ? 'CONNECTED' : 'LOCAL FALLBACK'}</div></div>
        <div className="feature-console__title"><div><span>{active.priority} / {active.code}</span><h3>{active.title}</h3><p>{active.summary}</p></div><span className={`feature-mode ${active.mode}`}>{active.mode === 'local' ? 'OPERATIONAL' : active.mode === 'hybrid' ? 'HYBRID READY' : 'ADAPTER REQUIRED'}</span></div>
        <div className="feature-controls"><label><span>MARKET ENTITY</span><select value={tokenId} onChange={(event) => setTokenId(event.target.value)}>{tokens.map((item) => <option value={item.id} key={item.id}>${item.symbol} / {item.name}</option>)}</select></label><label><span>SCENARIO / THRESHOLD <b>{scenario}</b></span><input type="range" min="1" max="100" value={scenario} onChange={(event) => setScenario(Number(event.target.value))} /></label><button className={isWatched ? 'is-active' : ''} type="button" onClick={toggleWatch}><Star size={13} />{isWatched ? 'WATCHING' : 'WATCH'}</button><button type="button" onClick={addAlert}><BellRing size={13} />CREATE ALERT</button></div>

        <div className="feature-output-grid">
          <div className="feature-output-main"><FeatureGraph token={token} active={active} /><div className="feature-score"><div><span>{output.label}</span><strong>{output.score}<small>/100</small></strong></div><p><i />{output.verdict}</p></div><div className="feature-bars">{output.bars.map((bar) => <div key={bar.label}><span>{bar.label}<b>{bar.value}%</b></span><i><em style={{ width: `${bar.value}%` }} /></i></div>)}</div></div>
          <aside className="feature-evidence"><div className="feature-evidence__head"><span>PROVENANCE LEDGER</span><CircleDot size={12} /></div><dl><div><dt>Entity</dt><dd>${token.symbol}</dd></div><div><dt>24h flow</dt><dd>${Math.round(token.volume24).toLocaleString()}</dd></div><div><dt>Depth</dt><dd>${Math.round(token.liquidity).toLocaleString()}</dd></div><div><dt>Source</dt><dd>{token.source}</dd></div><div><dt>Adapter</dt><dd>{active.endpoint || 'browser/local'}</dd></div><div><dt>State</dt><dd>{active.mode}</dd></div></dl>{active.mode !== 'local' && !researchApiEnabled && <div className="feature-abstain"><ShieldAlert size={14} /><span><b>PRODUCTION ADAPTER MISSING</b>No wallet, social or trained-model claim will be fabricated.</span></div>}</aside>
        </div>

        <div className="feature-special">
          {active.id === 'replay' && <div className="feature-replay"><MiniTrace values={token.series24} index={replayIndex} /><label><span>POINT-IN-TIME / {replayIndex + 1}:00</span><input type="range" min="1" max="23" value={replayIndex} onChange={(event) => setReplayIndex(Number(event.target.value))} /></label></div>}
          {active.id === 'lifecycle' && <div className="feature-lifecycle">{['CREATE', 'BONDING', 'GRADUATE', 'PUMPSWAP', 'PERSIST'].map((stage, index) => <div className={index <= Math.round(output.score / 25) ? 'is-complete' : ''} key={stage}><i>{index + 1}</i><span>{stage}</span></div>)}</div>}
          {active.id === 'alerts' && <div className="feature-records"><span>ACTIVE LOCAL RULES / {alerts.length}</span>{alerts.slice(0, 4).map((alert) => <b key={alert.id}>${alert.token} · {alert.feature} ≥ {alert.threshold}</b>)}</div>}
          {active.id === 'watchlists' && <div className="feature-records"><span>WATCHED ENTITIES / {watchlist.length}</span>{watchlist.map((id) => <b key={id}>${tokens.find((item) => item.id === id)?.symbol || id}</b>)}</div>}
          {active.id === 'copilot' && <form className="feature-copilot" onSubmit={askCopilot}><label><Search size={14} /><input value={copilotQuery} onChange={(event) => setCopilotQuery(event.target.value)} placeholder="Ask about this entity, regime or evidence…" /></label><button type="submit" disabled={copilotBusy}><Send size={13} />{copilotBusy ? 'ANALYZING' : 'QUERY GRAPH'}</button>{copilotAnswer && <p><Bot size={15} />{copilotAnswer}</p>}</form>}
          {active.id === 'webhooks' && <div className="feature-webhook"><Code2 size={18} /><div><b>POST /v1/webhooks</b><span>Events: launch.created · regime.changed · cohort.converged · risk.quarantined</span></div><button type="button" disabled={!researchApiEnabled}>SEND TEST EVENT</button></div>}
          {active.id === 'cases' && <div className="feature-cases"><label><input value={caseNote} onChange={(event) => setCaseNote(event.target.value)} placeholder="Add an evidence-backed investigation note…" /><button type="button" onClick={addCase}><Save size={13} />SAVE CASE</button></label><div>{cases.slice(0, 3).map((item) => <p key={item.id}><span>${item.token} / {item.feature}</span><b>{item.note}</b></p>)}</div></div>}
        </div>
      </div>
    </div>
    <div className="feature-disclaimer"><Cpu size={13} /><span>LOCAL MODULES RUN IN-BROWSER · ADAPTER MODULES REQUIRE THE PRODUCTION DATA PLANE · EXECUTION REMAINS DISABLED</span><b>{watchlist.length} WATCHED / {alerts.length} ALERTS / {cases.length} CASES</b></div>
  </div></section>
}
