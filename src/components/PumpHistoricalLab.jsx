import { useMemo, useState } from 'react'
import { Activity, BrainCircuit, Database, Gauge, Network, ShieldAlert, Sparkles, Target, TrendingUp, Users } from 'lucide-react'
import {
  cohortHistory,
  historicalNarratives,
  historicalWindows,
  horizonProfiles,
  influenceClusters,
  outcomeLabels,
  scaleHistoricalCount,
} from '../data/pumpHistoricalMock.js'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })

function Sparkline({ values }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const points = values.map((value, index) => `${index * (180 / (values.length - 1))},${46 - ((value - min) / Math.max(max - min, 1)) * 40 - 3}`).join(' ')
  return <svg className="history-spark" viewBox="0 0 180 46" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg>
}

function HistoricalMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return <div className={`history-metric ${tone}`}><Icon size={17} /><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

export default function PumpHistoricalLab() {
  const [windowKey, setWindowKey] = useState('30D')
  const [horizon, setHorizon] = useState('30M')
  const [narrativeId, setNarrativeId] = useState(historicalNarratives[0].id)
  const researchWindow = historicalWindows[windowKey]
  const profile = horizonProfiles[horizon]
  const selectedNarrative = useMemo(() => historicalNarratives.find((item) => item.id === narrativeId) || historicalNarratives[0], [narrativeId])
  const funnel = [
    { label: 'LAUNCHES OBSERVED', rate: 100, count: researchWindow.launches },
    { label: `${horizon} ELIGIBLE`, rate: profile.eligible, count: scaleHistoricalCount(windowKey, profile.eligible) },
    { label: 'EXPANSION SIGNAL', rate: profile.expansion, count: scaleHistoricalCount(windowKey, profile.expansion) },
    { label: 'REACHED 2×', rate: profile.x2, count: scaleHistoricalCount(windowKey, profile.x2) },
    { label: 'MIGRATED', rate: profile.migration, count: scaleHistoricalCount(windowKey, profile.migration) },
  ]

  return <section className="history-lab" id="history-lab" aria-labelledby="history-lab-title">
    <div className="history-lab__head">
      <div><span><Database size={14} /> D0 / PUMP.FUN HISTORICAL INTELLIGENCE TWIN</span><h2 id="history-lab-title">Learn the pump <em>before it prints.</em></h2><p>Backtest multi-horizon des launches Pump.fun, de leur graphe wallet et de leur propagation narrative. Le schéma est prêt pour l’ingestion réelle.</p></div>
      <div className="history-lab__badge"><ShieldAlert size={15} /><span><b>SIMULATED BACKTEST</b>DEMO DATA / NO LIVE CLAIM</span></div>
    </div>

    <div className="history-commandbar">
      <div><span>RESEARCH WINDOW</span>{Object.keys(historicalWindows).map((key) => <button className={windowKey === key ? 'is-active' : ''} type="button" onClick={() => setWindowKey(key)} key={key}>{key}</button>)}</div>
      <div><span>FORECAST HORIZON</span>{Object.keys(horizonProfiles).map((key) => <button className={horizon === key ? 'is-active' : ''} type="button" onClick={() => setHorizon(key)} key={key}>{key}</button>)}</div>
      <strong><i /> DATASET LOCKED / {researchWindow.coverage}</strong>
    </div>

    <div className="history-metrics">
      <HistoricalMetric icon={Activity} label="LAUNCHES INDEXED" value={compact.format(researchWindow.launches)} detail={`${compact.format(researchWindow.observations)} horizon states`} tone="green" />
      <HistoricalMetric icon={Users} label="CREATORS RESOLVED" value={compact.format(researchWindow.creators)} detail={`${compact.format(researchWindow.transactions)} transactions`} />
      <HistoricalMetric icon={Target} label={`${horizon} SIGNAL PRECISION`} value={`${profile.precision}%`} detail={`median lead ${profile.lead}`} tone="blue" />
      <HistoricalMetric icon={TrendingUp} label="MIGRATION RATE" value={`${profile.migration}%`} detail={`${compact.format(scaleHistoricalCount(windowKey, profile.migration))} cohort outcomes`} tone="violet" />
      <HistoricalMetric icon={Gauge} label="MEDIAN ATH" value={`+${profile.medianAth}%`} detail={`${profile.drawdown}% median drawdown`} tone="orange" />
    </div>

    <div className="history-core-grid">
      <div className="history-panel history-funnel">
        <div className="history-panel__head"><span>D1 / PRE-PUMP SIGNAL FUNNEL</span><b>{horizon} OUTCOME PATH</b></div>
        <div className="history-funnel__body">{funnel.map((item, index) => <div key={item.label}><span><b>{String(index + 1).padStart(2, '0')}</b>{item.label}</span><i><em style={{ width: `${Math.max(4, Math.sqrt(item.rate) * 10)}%` }} /></i><strong>{compact.format(item.count)}<small>{item.rate.toFixed(item.rate < 10 ? 1 : 0)}%</small></strong></div>)}</div>
        <div className="history-funnel__insight"><Sparkles size={16} /><p><b>EARLY EDGE / {profile.lead}</b>Wallet convergence + narrative acceleration identifies {profile.precision}% of the simulated expansion cohort at the selected horizon.</p></div>
      </div>

      <div className="history-panel history-labels">
        <div className="history-panel__head"><span>D2 / OUTCOME LABEL MATRIX</span><b>SUPERVISION TARGETS</b></div>
        <div className="history-labels__summary"><div style={{ '--rug': '27.8%', '--survival': '16.4%', '--migration': '1.9%' }}><strong>{profile.survival}%</strong><span>SURVIVAL / {horizon}</span></div><p><b>{compact.format(researchWindow.launches * 4)}</b><span>label checkpoints</span><small>5m · 30m · 2h · 24h</small></p></div>
        <div className="history-labels__list">{outcomeLabels.map((item) => <div key={item.id}><i style={{ background: item.color }} /><span><b>{item.label}</b><small>{item.detail}</small></span><strong style={{ color: item.color }}>{item.rate}%</strong></div>)}</div>
      </div>
    </div>

    <div className="history-narrative-grid">
      <div className="history-panel history-narratives">
        <div className="history-panel__head"><span>D3 / EMERGING NARRATIVE RANKER</span><b>SEMANTIC VELOCITY / 24H</b></div>
        <div className="history-narratives__head"><span>CLUSTER</span><span>STAGE</span><span>LAUNCHES</span><span>WALLETS</span><span>KOL</span><span>σ VELOCITY</span><span>TRACE</span></div>
        <div className="history-narratives__rows">{historicalNarratives.map((item, index) => <button className={narrativeId === item.id ? 'is-active' : ''} type="button" onClick={() => setNarrativeId(item.id)} key={item.id}><span><i>{String(index + 1).padStart(2, '0')}</i><b>{item.name}</b></span><em>{item.stage}</em><strong>{compact.format(item.launches)}</strong><strong>{item.wallets}</strong><strong>{item.kol}</strong><strong className={item.velocity >= 0 ? 'up' : 'down'}>{item.velocity >= 0 ? '+' : ''}{item.velocity}σ</strong><Sparkline values={item.series} /></button>)}</div>
      </div>

      <aside className="history-panel history-narrative-focus">
        <div className="history-panel__head"><span>D4 / CLUSTER READOUT</span><BrainCircuit size={13} /></div>
        <span>SELECTED LATENT NARRATIVE</span><h3>{selectedNarrative.name}</h3><div className="history-narrative-focus__score"><strong>{Math.round(50 + selectedNarrative.velocity * 5)}</strong><span>EMERGENCE<br />PROBABILITY</span></div>
        <dl><div><dt>Regime</dt><dd>{selectedNarrative.stage}</dd></div><div><dt>Wallet cohorts</dt><dd>{selectedNarrative.wallets}</dd></div><div><dt>KOL overlap</dt><dd>{selectedNarrative.kol}</dd></div><div><dt>Median lead</dt><dd>{selectedNarrative.lead}</dd></div><div><dt>Migration</dt><dd>{selectedNarrative.migration}%</dd></div><div><dt>24h survival</dt><dd>{selectedNarrative.survival}%</dd></div></dl>
        <div className="history-narrative-focus__verdict"><i />ACCUMULATION PRECEDES SOCIAL SATURATION</div>
      </aside>
    </div>

    <div className="history-bottom-grid">
      <div className="history-panel history-influence">
        <div className="history-panel__head"><span>D5 / WALLET × KOL LEAD BOARD</span><b>PSEUDONYMOUS ENTITY GRAPH</b></div>
        <div className="history-influence__rows">{influenceClusters.map((item, index) => <div key={item.id}><span className="history-influence__rank">{index + 1}</span><span><Network size={13} /><b>{item.id}</b><small>{item.type}</small></span><span><small>SIGNALS</small><b>{item.signals}</b></span><span><small>HIT RATE</small><b>{item.hitRate}%</b></span><span><small>LEAD</small><b>{item.medianLead}</b></span><span><small>MEDIAN MOVE</small><b className="up">{item.pnl}</b></span><span><small>DOMINANT</small><b>{item.narrative}</b></span><i style={{ '--confidence': `${item.confidence}%` }}>{item.confidence}</i></div>)}</div>
      </div>

      <div className="history-panel history-cohorts">
        <div className="history-panel__head"><span>D6 / DAILY COHORT LEDGER</span><b>LABEL COMPLETENESS / 100%</b></div>
        <div className="history-cohorts__head"><span>COHORT</span><span>LAUNCHES</span><span>MIGRATE</span><span>5× ATH</span><span>RUG</span><span>SURVIVE</span><span>EDGE</span></div>
        {cohortHistory.map((item) => <div className="history-cohorts__row" key={item.cohort}><strong>{item.cohort}</strong><span>{compact.format(item.launches)}</span><span className="up">{item.migration}%</span><span>{item.x5}%</span><span className="down">{item.rug}%</span><span>{item.survival}%</span><i style={{ '--edge': `${item.signal}%` }}><b>{item.signal}</b></i></div>)}
      </div>
    </div>

    <div className="history-foot"><ShieldAlert size={13} /><span>SIMULATED RESEARCH TWIN · PUMP.FUN UNIVERSE ONLY · WALLET AND KOL IDS ARE SYNTHETIC · LIVE COLLECTOR WILL REPLACE AGGREGATES WITHOUT CHANGING THIS INTERFACE</span><b>SCHEMA / V1.0 READY</b></div>
  </section>
}
