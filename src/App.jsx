import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, BrainCircuit, Braces, ChevronDown,
  CircleDot, Cpu, Database, ExternalLink, FlaskConical, GitBranch, Info,
  Layers3, Menu, Network, Radar, Search, ShieldAlert, Sparkles, X, Zap,
} from 'lucide-react'
import {
  inferToken, marketPulse, narratives, pipeline, researchSources, snapshotMeta, tokens,
} from './data/marketSnapshot.js'
import { evaluateLab, signalLabs } from './data/signalLabs.js'
import LiveTerminal from './components/LiveTerminal.jsx'
import TerminalFeatureSuite from './components/TerminalFeatureSuite.jsx'

const terminalUrl = import.meta.env.VITE_TERMINAL_URL || '/app'
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const formatUsd = (value) => `$${compactNumber.format(value)}`
const formatSigned = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(Math.abs(value) >= 100 ? 0 : 1)}%`

function Brand({ href = '/' }) {
  return (
    <a className="brand" href={href} aria-label="HypeGraph — accueil">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>HYPE<span>GRAPH</span></span>
    </a>
  )
}

function DataBadge({ children, simulated = false }) {
  return <span className={`data-badge ${simulated ? 'is-simulated' : ''}`}>{children}</span>
}

function Header({ app = false }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <nav className={`primary-nav ${open ? 'is-open' : ''}`} aria-label="Navigation principale">
          {app ? <>
            <a href="#live-terminal" onClick={() => setOpen(false)}>Live fabric</a>
            <a href="#terminal" onClick={() => setOpen(false)}>Tensor</a>
            <a href="#laboratory" onClick={() => setOpen(false)}>Labs</a>
            <a href="/#methodology" onClick={() => setOpen(false)}>Methodology</a>
          </> : <>
            <a href="#product" onClick={() => setOpen(false)}>Product</a>
            <a href="#models" onClick={() => setOpen(false)}>Models</a>
            <a href="#architecture" onClick={() => setOpen(false)}>Compute</a>
            <a href="#methodology" onClick={() => setOpen(false)}>Methodology</a>
          </>}
        </nav>
        <div className="header-actions">
          <span className="snapshot-state"><i /> {app ? 'SYSTEM ONLINE / READ-ONLY' : 'SOLANA INTELLIGENCE'}</span>
          <a className="button button--small" href={app ? '/' : terminalUrl}>{app ? 'Back to website' : 'Launch terminal'} <ArrowRight size={14} /></a>
          <button className="nav-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Ouvrir le menu">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
    </header>
  )
}

function HeroTelemetry() {
  return (
    <div className="hero-telemetry" aria-label="État du moteur de recherche simulé">
      <div className="telemetry-head"><span>HYPERGRAPH INFERENCE FABRIC</span><DataBadge simulated>MODEL PREVIEW</DataBadge></div>
      <div className="telemetry-orbit" aria-hidden="true">
        <span className="orbit orbit--one" /><span className="orbit orbit--two" />
        <span className="orbit-core"><BrainCircuit /></span>
        <span className="orbit-node orbit-node--a" /><span className="orbit-node orbit-node--b" /><span className="orbit-node orbit-node--c" />
      </div>
      <dl className="telemetry-grid">
        <div><dt>Encoder</dt><dd>MEME-BERT / GNN</dd></div><div><dt>Graph</dt><dd>17.4M latent edges</dd></div>
        <div><dt>Compute</dt><dd>8× H100 SXM*</dd></div><div><dt>Precision</dt><dd>FP8 / abstention</dd></div>
      </dl>
      <p>* Target production topology — not provisioned in this frontend.</p>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-visual" aria-hidden="true" /><div className="hero-grid-overlay" aria-hidden="true" />
      <div className="shell hero-inner">
        <div className="hero-copy">
          <div className="eyebrow"><CircleDot size={13} /> MEMETIC INFERENCE SYSTEM / SOLANA</div>
          <h1>The neural map of<br /><em>onchain attention.</em></h1>
          <p className="hero-lead">HypeGraph transforme les trenches Web4 en un graphe temporel multimodal : propagation narrative, microstructure PumpSwap, lignées de wallets et influence KOL — inférées sur une même surface GPU-native.</p>
          <div className="hero-actions">
            <a className="button button--primary" href={terminalUrl}>Open live intelligence <ArrowRight size={16} /></a>
            <a className="button button--ghost" href="#methodology">Audit the methodology <ArrowUpRight size={15} /></a>
          </div>
          <div className="hero-proof"><div><strong>OBSERVED</strong><span>Market inputs</span></div><div><strong>SIMULATED</strong><span>Model outputs</span></div><div><strong>ABSTAIN-FIRST</strong><span>Adversarial policy</span></div></div>
        </div>
        <HeroTelemetry />
      </div>
      <div className="system-strip"><div className="shell system-strip__inner"><span>PUBLIC LIVE FEED + FROZEN FALLBACK</span><span>DEXSCREENER / 15S DEFAULT</span><span>{snapshotMeta.network}</span><span>NO EXECUTION / NO FINANCIAL ADVICE</span></div></div>
    </section>
  )
}

function ModelStack() {
  const models = [
    { icon: BrainCircuit, code: 'MM-ENCODER', title: 'Multimodal narrative embeddings', text: 'Fusionne ticker, metadata, images, social fragments et comportement de marché dans un espace latent temporel commun.', state: 'TARGET / GPU' },
    { icon: Network, code: 'T-GNN', title: 'Temporal entity graph', text: 'Propage les signaux entre wallets, créateurs, tokens, pools et KOLs sans perdre l’ordre causal des événements.', state: 'TARGET / GPU' },
    { icon: Activity, code: 'REGIME-NET', title: 'Attention regime detection', text: 'Sépare émergence organique, rotation narrative, amplification coordonnée, euphorie terminale et décroissance.', state: 'PREVIEW / LOCAL' },
    { icon: GitBranch, code: 'LINEAGE', title: 'Wallet ancestry inference', text: 'Construit des cohortes à partir du funding, du co-spend, des déploiements répétés et de la synchronisation des entrées.', state: 'ADAPTER READY' },
    { icon: ShieldAlert, code: 'OOD-GATE', title: 'Adversarial abstention', text: 'Détecte les structures hors distribution et refuse de scorer lorsque les preuves sont insuffisantes ou contaminées.', state: 'ACTIVE / LOCAL' },
    { icon: Cpu, code: 'FP8-SERVE', title: 'GPU inference fabric', text: 'Micro-batches FP8, feature store event-time et serving calibré conçus pour une latence de décision sub-seconde.', state: 'TARGET / H100' },
  ]
  return (
    <section className="model-section" id="models" aria-labelledby="model-title"><div className="shell">
      <div className="section-kicker"><span>02 / MACHINE INTELLIGENCE</span><span>FROM RAW EVENTS TO CALIBRATED ABSTENTION</span></div>
      <div className="section-heading split-heading"><h2 id="model-title">A model stack for<br /><em>memetic markets.</em></h2><p>HypeGraph ne réduit pas la hype à un score décoratif. Le système cible une chaîne ML vérifiable : représentation multimodale, graphes temporels, détection de régimes, calibration et abstention adversariale.</p></div>
      <div className="model-grid">{models.map(({ icon: Icon, ...model }, index) => <article className="model-card" key={model.code}><div className="model-card__top"><span>{String(index + 1).padStart(2, '0')}</span><i><Icon size={19} /></i></div><div className="model-card__code">{model.code}</div><h3>{model.title}</h3><p>{model.text}</p><div className="model-card__state"><span />{model.state}</div></article>)}</div>
      <div className="compute-ledger"><div><span>INGESTION</span><strong>Solana logs + market surfaces</strong></div><i /><div><span>REPRESENTATION</span><strong>Temporal multimodal graph</strong></div><i /><div><span>INFERENCE</span><strong>Regime heads + OOD gate</strong></div><i /><div><span>SERVING</span><strong>Calibrated research API</strong></div></div>
    </div></section>
  )
}

function TerminalMasthead() {
  return <section className="app-masthead"><div className="shell app-masthead__inner"><div><div className="eyebrow"><CircleDot size={13} /> HYPEGRAPH OS / SOLANA MAINNET</div><h1>Attention intelligence.<br /><em>In operational form.</em></h1><p>Un espace de recherche unifié pour surveiller les créations Pump.fun, les flux de marché, les régimes narratifs et les anomalies adversariales.</p></div><div className="app-masthead__status"><span>SESSION STATE</span><strong><i /> INGESTION ACTIVE</strong><dl><div><dt>Mode</dt><dd>Read-only</dd></div><div><dt>Surface</dt><dd>Solana</dd></div><div><dt>Commitment</dt><dd>Confirmed</dd></div><div><dt>Models</dt><dd>Preview</dd></div></dl></div></div><div className="shell app-commandbar"><span>WORKSPACE / RESEARCH-01</span><span>CANONICAL PUMP EVENTS</span><span>DEX MARKET FABRIC</span><span>EXECUTION DISABLED</span></div></section>
}

function MarketPulse() {
  return (
    <section className="pulse-section" id="product" aria-labelledby="pulse-title"><div className="shell">
      <div className="section-kicker"><span id="pulse-title">01 / MARKET PULSE</span><span>PROVENANCE-AWARE</span></div>
      <div className="pulse-grid">{marketPulse.map((metric) => (
        <article className={`pulse-card pulse-card--${metric.tone}`} key={metric.label}>
          <div className="pulse-card__top"><span>{metric.label}</span><DataBadge simulated={metric.simulated}>{metric.simulated ? 'HEURISTIC' : 'OBSERVED'}</DataBadge></div>
          <div className="pulse-card__value">{metric.value}</div>
          <div className="pulse-card__meta"><strong>{metric.delta}</strong><span>{metric.detail}</span></div>
          <div className="pulse-card__source">SRC / {metric.source}</div>
        </article>
      ))}</div>
    </div></section>
  )
}

function NarrativeGraph({ selectedNarrative, onSelect }) {
  const positions = { all: [50, 48], animal: [22, 22], personality: [78, 20], 'equity-mimicry': [82, 68], 'meta-meme': [43, 82], celebrity: [14, 67] }
  return (
    <div className="graph-panel">
      <div className="panel-head"><div><span className="panel-index">A.01</span><h3>Narrative topology</h3></div><DataBadge simulated>LATENT SPACE / SIMULATED</DataBadge></div>
      <div className="narrative-graph">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="edge" x1="0" x2="1"><stop stopColor="#b7ff3c" stopOpacity=".7" /><stop offset="1" stopColor="#63ead0" stopOpacity=".08" /></linearGradient></defs>
          {narratives.map((item) => <line key={item.id} x1="50" y1="48" x2={positions[item.id][0]} y2={positions[item.id][1]} stroke="url(#edge)" strokeWidth=".35" />)}
          <path d="M22 22 Q51 4 78 20 M78 20 Q98 42 82 68 M82 68 Q62 94 43 82 M43 82 Q23 91 14 67 M14 67 Q3 40 22 22" fill="none" stroke="#78908a" strokeOpacity=".22" strokeWidth=".25" strokeDasharray="1 2" />
        </svg>
        <button className={`graph-core ${selectedNarrative === 'all' ? 'is-active' : ''}`} style={{ left: '50%', top: '48%' }} onClick={() => onSelect('all')} type="button"><Network size={19} /><strong>HYPE</strong><span>global manifold</span></button>
        {narratives.map((item) => <button className={`graph-node ${selectedNarrative === item.id ? 'is-active' : ''}`} style={{ left: `${positions[item.id][0]}%`, top: `${positions[item.id][1]}%`, '--node': item.color }} onClick={() => onSelect(item.id)} key={item.id} type="button"><i /><strong>{item.name}</strong><span>µ {item.heat} · {item.velocity}</span></button>)}
        <div className="graph-axis graph-axis--x">SEMANTIC DISTANCE →</div><div className="graph-axis graph-axis--y">ATTENTION VELOCITY →</div>
      </div>
      <div className="graph-legend"><span><i className="observed" /> Observed entity</span><span><i className="latent" /> Latent relation</span><span><i className="risk" /> Contamination risk</span></div>
    </div>
  )
}

function Sparkline({ values, positive = true, label }) {
  const width = 240; const height = 68; const min = Math.min(...values); const max = Math.max(...values)
  const points = values.map((value, index) => `${(index / (values.length - 1)) * width},${height - ((value - min) / Math.max(max - min, 1)) * (height - 8) - 4}`).join(' ')
  return <svg className={`sparkline ${positive ? 'is-positive' : 'is-negative'}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}><line x1="0" y1={height - 1} x2={width} y2={height - 1} /><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg>
}

function TokenTable({ rows, selectedId, onSelect, query, onQuery, timeframe }) {
  return (
    <div className="token-panel">
      <div className="panel-head panel-head--table"><div><span className="panel-index">A.02</span><h3>Token tensor</h3></div><label className="search-field"><Search size={14} /><span className="sr-only">Rechercher un token</span><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="SEARCH SYMBOL / NARRATIVE" /></label></div>
      <div className="table-wrap"><table><thead><tr><th>Asset / cluster</th><th>{timeframe} flow</th><th>Depth</th><th>Δ 1h</th><th>Hype μ</th><th>Integrity</th></tr></thead><tbody>
        {rows.map((token) => { const inference = inferToken(token); return (
          <tr className={selectedId === token.id ? 'is-selected' : ''} key={token.id} onClick={() => onSelect(token.id)}>
            <td><button type="button" onClick={() => onSelect(token.id)}><span className="token-symbol">{token.symbol.slice(0, 8)}</span><span>{token.narrative} · {token.age}</span></button></td>
            <td><strong>{formatUsd(timeframe === '48H' && token.volume48 ? token.volume48 : token.volume24)}</strong><span>{timeframe === '48H' ? (token.volume48 ? '48h observed' : '24h partial') : `${compactNumber.format(token.tx24)} tx`}</span></td><td><strong>{formatUsd(token.liquidity)}</strong><span>{inference.turnover.toFixed(0)}× turnover</span></td>
            <td><strong className={token.change1h >= 0 ? 'positive' : 'negative'}>{formatSigned(token.change1h)}</strong><span>observed</span></td><td><strong>{inference.hype}</strong><span>simulated</span></td>
            <td>{inference.quarantined ? <span className="risk-pill"><ShieldAlert size={12} /> QUARANTINE</span> : <span className="pass-pill"><CircleDot size={12} /> PASS</span>}</td>
          </tr>
        )})}
      </tbody></table>{!rows.length && <div className="empty-state">No tensor matches this projection.</div>}</div>
    </div>
  )
}

function ScoreRing({ value, label, tone = 'green' }) {
  return <div className={`score-ring score-ring--${tone}`} style={{ '--score': `${value * 3.6}deg` }}><div><strong>{value}</strong><span>{label}</span></div></div>
}

function TokenInspector({ token, timeframe }) {
  const inference = inferToken(token); const has48h = timeframe === '48H' && token.volume48; const series = has48h && token.series48 ? token.series48 : token.series24; const observedChange = has48h ? token.change48h : token.change24h
  return (
    <aside className="inspector-panel">
      <div className="panel-head"><div><span className="panel-index">A.03 / SELECTED ENTITY</span><h3>{token.name}</h3></div><span className="entity-symbol">${token.symbol.slice(0, 10)}</span></div>
      <div className="inspector-chart"><div className="chart-label"><DataBadge simulated>MODEL TRACE</DataBadge><span>{timeframe === '48H' && !has48h ? '24H AVAILABLE / 48H COHORT' : `${timeframe} OBSERVED WINDOW`}</span></div><Sparkline values={series} positive={observedChange >= 0} label={`Trace latente simulée de ${token.symbol}`} /><div className="chart-delta"><strong className={observedChange >= 0 ? 'positive' : 'negative'}>{formatSigned(observedChange)}</strong><span>observed {has48h ? '48h' : '24h'} change</span></div></div>
      <p className="entity-summary">{token.summary}</p>
      <div className="score-grid"><ScoreRing value={inference.hype} label="HYPE μ" /><ScoreRing value={inference.persistence} label="PERSIST" tone="cyan" /><ScoreRing value={inference.contamination} label="POISON" tone={inference.contamination > 69 ? 'red' : 'amber'} /></div>
      <dl className="entity-stats"><div><dt>Observed volume</dt><dd>{formatUsd(has48h ? token.volume48 : token.volume24)}</dd></div><div><dt>Pool depth</dt><dd>{formatUsd(token.liquidity)}</dd></div><div><dt>Flow asymmetry</dt><dd>{inference.imbalance}%</dd></div><div><dt>Model confidence</dt><dd>{inference.confidence}%*</dd></div></dl>
      <div className={`integrity-callout ${inference.quarantined ? 'is-risk' : ''}`}>{inference.quarantined ? <ShieldAlert size={17} /> : <Activity size={17} />}<div><strong>{inference.quarantined ? 'ADVERSARIAL ABSTENTION' : 'SIGNAL PASSED'}</strong><span>{inference.quarantined ? 'Metric inconsistency exceeds the research threshold.' : 'No severe cross-field inconsistency detected.'}</span></div></div>
      <div className="entity-source"><span>SOURCE / {token.source}</span><a href={`https://www.geckoterminal.com/solana/pools/${token.pool}`} target="_blank" rel="noreferrer">Inspect pool <ExternalLink size={12} /></a></div>
      <p className="fine-print">* Deterministic frontend heuristic — not a trained model, forecast or investment signal.</p>
    </aside>
  )
}

function IntelligenceTerminal() {
  const [timeframe, setTimeframe] = useState('24H'); const [selectedNarrative, setSelectedNarrative] = useState('all'); const [selectedId, setSelectedId] = useState('cate'); const [query, setQuery] = useState('')
  const visibleTokens = useMemo(() => tokens.filter((token) => { const matchesNarrative = selectedNarrative === 'all' || token.narrative === selectedNarrative; const needle = query.trim().toLowerCase(); return matchesNarrative && (!needle || `${token.symbol} ${token.name} ${token.narrative}`.toLowerCase().includes(needle)) }), [selectedNarrative, query])
  const selectedToken = tokens.find((token) => token.id === selectedId) || tokens[0]
  const chooseNarrative = (id) => { setSelectedNarrative(id); const first = tokens.find((token) => id === 'all' || token.narrative === id); if (first) setSelectedId(first.id) }
  return (
    <section className="terminal-section" id="terminal" aria-labelledby="terminal-title"><div className="shell">
      <div className="section-heading terminal-heading"><div><div className="eyebrow"><Radar size={13} /> RESEARCH SURFACE / V0.1</div><h2 id="terminal-title">Interrogate the attention manifold.</h2><p>Les valeurs marché sont observées ; les projections, scores et relations latentes sont explicitement simulés.</p></div><div className="terminal-controls"><span>COHORT WINDOW</span><div className="segmented" role="group" aria-label="Fenêtre temporelle">{['24H', '48H'].map((item) => <button className={timeframe === item ? 'is-active' : ''} onClick={() => setTimeframe(item)} key={item} type="button">{item}</button>)}</div><button className="select-look" type="button">ALL SURFACES <ChevronDown size={13} /></button></div></div>
      <div className="terminal-shell"><div className="terminal-bar"><div><i className="red" /><i className="amber" /><i className="green" /></div><span>hypegraph://solana/pumpswap/attention_tensor</span><span>slot-safe / frozen</span></div><div className="terminal-layout"><NarrativeGraph selectedNarrative={selectedNarrative} onSelect={chooseNarrative} /><TokenTable rows={visibleTokens} selectedId={selectedId} onSelect={setSelectedId} query={query} onQuery={setQuery} timeframe={timeframe} /><TokenInspector token={selectedToken} timeframe={timeframe} /></div></div>
    </div></section>
  )
}

const labIcons = [Radar, Activity, GitBranch, Zap, BrainCircuit, Search, ShieldAlert, Layers3, Network, FlaskConical]

function SignalLaboratory() {
  const [activeId, setActiveId] = useState('narrative-gap')
  const [tokenId, setTokenId] = useState('cate')
  const [sensitivity, setSensitivity] = useState(5)
  const activeLab = signalLabs.find((lab) => lab.id === activeId) || signalLabs[0]
  const token = tokens.find((item) => item.id === tokenId) || tokens[0]
  const output = evaluateLab(activeId, token, sensitivity)

  return (
    <section className="lab-section" id="laboratory" aria-labelledby="lab-title">
      <div className="shell">
        <div className="section-kicker"><span>02 / SIGNAL LABORATORY</span><span>10 EXECUTABLE RESEARCH PRIMITIVES</span></div>
        <div className="section-heading split-heading lab-heading">
          <h2 id="lab-title">Ten ways to interrogate<br /><em>a hype regime.</em></h2>
          <p>Chaque laboratoire exécute un calcul sur l’actif choisi. Les entrées marché restent observées ; les sorties de recherche restent simulées ou s’abstiennent lorsque l’adapter nécessaire manque.</p>
        </div>

        <div className="lab-selector" role="tablist" aria-label="Laboratoires de signal">
          {signalLabs.map((lab, index) => {
            const Icon = labIcons[index]
            return (
              <button
                className={activeId === lab.id ? 'is-active' : ''}
                type="button"
                role="tab"
                aria-selected={activeId === lab.id}
                onClick={() => setActiveId(lab.id)}
                key={lab.id}
              >
                <span>{lab.index}</span><Icon size={17} /><strong>{lab.code}</strong>
              </button>
            )
          })}
        </div>

        <div className={`lab-console ${output.abstain ? 'is-abstaining' : ''}`}>
          <div className="lab-console__bar"><span>hypegraph://labs/{activeLab.code.toLowerCase()}</span><DataBadge simulated>{output.abstain ? 'ABSTENTION ACTIVE' : 'DETERMINISTIC PREVIEW'}</DataBadge></div>
          <div className="lab-console__grid">
            <div className="lab-brief">
              <span className="lab-number">{activeLab.index}</span>
              <div className="eyebrow">{activeLab.code} / GPU RESEARCH KERNEL</div>
              <h3>{activeLab.name}</h3>
              <p>{activeLab.short}</p>
              <div className="lab-formula"><span>OPERATOR</span><code>{activeLab.formula}</code></div>
              <div className="lab-provenance"><Info size={13} /><span>{activeLab.provenance}</span></div>
            </div>

            <div className="lab-output">
              <div className="lab-controls">
                <label><span>ENTITY</span><select value={tokenId} onChange={(event) => setTokenId(event.target.value)}>{tokens.map((item) => <option value={item.id} key={item.id}>${item.symbol} / {item.name}</option>)}</select></label>
                <label className="sensitivity-control"><span>SENSITIVITY <strong>{sensitivity}/10</strong></span><input aria-label="Sensibilité du laboratoire" type="range" min="1" max="10" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} /></label>
              </div>
              <div className="lab-result">
                <div><span>{output.label}</span><strong>{output.value}<small>{output.unit}</small></strong></div>
                <div className={`lab-verdict ${output.abstain ? 'is-abstain' : ''}`}><i />{output.verdict}</div>
              </div>
              <p className="lab-insight">{output.insight}</p>
              <div className="lab-bars">
                {output.bars.map((bar) => <div key={bar.label}><span>{bar.label}<strong>{bar.value}%</strong></span><i><b style={{ width: `${bar.value}%` }} /></i></div>)}
              </div>
            </div>

            <aside className="lab-evidence">
              <div className="lab-evidence__head"><span>EVIDENCE LEDGER</span><DataBadge>OBSERVED</DataBadge></div>
              <dl>
                <div><dt>Asset</dt><dd>${token.symbol}</dd></div>
                <div><dt>24h volume</dt><dd>{formatUsd(token.volume24)}</dd></div>
                <div><dt>Pool depth</dt><dd>{formatUsd(token.liquidity)}</dd></div>
                <div><dt>Transactions</dt><dd>{compactNumber.format(token.tx24)}</dd></div>
                <div><dt>Participants</dt><dd>{compactNumber.format(token.buyers + token.sellers)}</dd></div>
                <div><dt>Confidence</dt><dd>{output.confidence}%</dd></div>
              </dl>
              <div className="lab-policy"><ShieldAlert size={15} /><p><strong>ABSTAIN-FIRST POLICY</strong><span>Une donnée manquante ne devient jamais un zéro, une moyenne ou une fausse certitude.</span></p></div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

function ResearchModules() {
  const modules = [
    { icon: GitBranch, code: 'WALLET-LINEAGE', title: 'Funding ancestry', text: 'Résolution des généalogies de funding, co-spend, créateurs récurrents et grappes de sybils avant toute attribution de performance.', metric: 'ENTITY GRAPH / MOCK' },
    { icon: Zap, code: 'KOL-IMPULSE', title: 'Causal influence', text: 'Sépare corrélation sociale et impulsion causale via fenêtres pré/post-mention, contrôles de liquidité et retards de propagation.', metric: 'EVENT STUDY / MOCK' },
    { icon: Braces, code: 'NARRATIVE-ENCODER', title: 'Semantic mutation', text: 'Embeddings multimodaux pour suivre les forks lexicaux, mutations visuelles et collisions de tickers entre communautés.', metric: 'CLIP + LLM / MOCK' },
    { icon: ShieldAlert, code: 'SIGNAL-FIREWALL', title: 'Adversarial abstention', text: 'Quarantaine les ratios volume/profondeur impossibles, métadonnées conflictuelles et régimes hors distribution.', metric: 'OOD FILTER / ACTIVE' },
  ]
  return (
    <section className="modules-section" aria-labelledby="modules-title"><div className="shell"><div className="section-kicker"><span>03 / INTELLIGENCE MODULES</span><span>FROM CORRELATION TO STRUCTURE</span></div><div className="section-heading split-heading"><h2 id="modules-title">Built for the trenches.<br /><em>Calibrated for research.</em></h2><p>La sophistication crédible ne vient pas d’un score magique. Elle vient d’une chaîne de preuves, de l’incertitude visible et de la capacité du système à refuser une prédiction.</p></div>
      <div className="module-grid">{modules.map(({ icon: Icon, ...module }, index) => <article className="module-card" key={module.code}><div className="module-card__top"><span>0{index + 1}</span><Icon size={22} /></div><div className="module-code">{module.code}</div><h3>{module.title}</h3><p>{module.text}</p><div className="module-metric"><i /> {module.metric}</div></article>)}</div>
    </div></section>
  )
}

function Architecture() {
  const icons = [Database, Layers3, BrainCircuit, Network, ShieldAlert]
  return (
    <section className="architecture-section" id="architecture" aria-labelledby="architecture-title"><div className="shell architecture-grid">
      <div className="architecture-copy"><div className="eyebrow"><Cpu size={13} /> GPU-NATIVE RESEARCH FABRIC</div><h2 id="architecture-title">One tensor.<br />Every attention surface.</h2><p>Un pipeline événementiel conçu pour préserver l’ordre causal entre messages, swaps, migrations de pools et transferts de wallets — puis projeter ces événements dans un graphe temporel commun.</p><div className="compute-spec"><div><span>01</span><strong>Streaming</strong><small>Solana PubSub / Helius gRPC</small></div><div><span>02</span><strong>Feature store</strong><small>Temporal vectors / lineage</small></div><div><span>03</span><strong>Inference</strong><small>FP8 GPU graph batches</small></div><div><span>04</span><strong>Serving</strong><small>Calibrated API / webhooks</small></div></div></div>
      <div className="pipeline-diagram"><div className="pipeline-head"><span>REFERENCE TOPOLOGY</span><DataBadge simulated>TARGET STATE</DataBadge></div>{pipeline.map((item, index) => { const Icon = icons[index]; return <div className="pipeline-row" key={item.step}><div className="pipeline-index">{item.step}</div><div className="pipeline-node"><i><Icon size={17} /></i><div><strong>{item.title}</strong><span>{item.text}</span></div></div>{index < pipeline.length - 1 && <ArrowRight size={14} />}</div> })}<div className="gpu-rack"><div><Cpu size={18} /><span>NVIDIA H100 FABRIC</span></div><div className="gpu-bars">{Array.from({ length: 16 }, (_, index) => <i style={{ '--h': `${28 + (index * 17) % 68}%` }} key={index} />)}</div><span>Illustrative target infrastructure — deployment credentials required</span></div></div>
    </div></section>
  )
}

function Methodology() {
  return (
    <section className="method-section" id="methodology" aria-labelledby="method-title"><div className="shell"><div className="section-kicker"><span>04 / METHODOLOGY</span><span>LEGIBILITY OVER THEATER</span></div><div className="section-heading split-heading"><h2 id="method-title">Complex by design.<br /><em>Explicit by default.</em></h2><p>Chaque sortie porte son statut épistémique. “Observed” décrit une valeur venue d’une source externe. “Simulated” décrit ce que ce prototype calcule localement pour démontrer l’expérience produit.</p></div>
      <div className="method-grid"><article><DataBadge>OBSERVED</DataBadge><h3>Market substrate</h3><p>Volume, profondeur, transactions, variations et ancienneté de pool. Snapshot figé pour reproductibilité, avec lien direct vers la source.</p></article><article><DataBadge simulated>SIMULATED</DataBadge><h3>Model substrate</h3><p>Hype μ, persistance, contamination, confiance et géométrie narrative. Heuristiques déterministes, jamais présentées comme un modèle entraîné.</p></article><article><DataBadge simulated>ABSTENTION</DataBadge><h3>Adversarial substrate</h3><p>Un ratio volume/liquidité extrême ou une structure de participants incohérente abaisse la confiance et peut mettre l’entité en quarantaine.</p></article></div>
      <div className="formula-strip"><FlaskConical size={18} /><code>HYPE_μ = 0.42·FLOW + 0.32·PERSISTENCE + 0.26·MOMENTUM</code><span>UI HEURISTIC / NOT A FORECAST</span></div>
    </div></section>
  )
}

function Sources() {
  return (
    <section className="sources-section" id="sources" aria-labelledby="sources-title"><div className="shell sources-layout"><div><div className="eyebrow"><Info size={13} /> SOURCE LEDGER</div><h2 id="sources-title">Trace every claim.</h2><p>Le snapshot de démonstration a été collecté le 25 août 2026. Les endpoints frontend Pump.fun ne sont pas traités comme une API de production stable ; la cible d’intégration reste l’indexation onchain.</p></div><div className="source-list">{researchSources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={source.label}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{source.label}</strong><small>{source.type}</small></div><ExternalLink size={14} /></a>)}</div></div></section>
  )
}

function Cta() {
  return <section className="cta-section"><div className="shell cta-inner"><div><div className="eyebrow"><Sparkles size={13} /> HYPEGRAPH / RESEARCH PREVIEW</div><h2>Decode attention<br />before it becomes consensus.</h2></div><div className="cta-copy"><p>Explore les créations Pump.fun, les régimes narratifs et la couche de recherche ML dans un workspace dédié.</p><a className="button button--primary" href={terminalUrl}>Launch the terminal <ArrowUpRight size={16} /></a></div></div></section>
}

function Footer({ app = false }) {
  return <footer><div className="shell footer-grid"><div><Brand /><p>Temporal intelligence for the memetic economy.</p></div><div><span>PRODUCT</span><a href={terminalUrl}>Terminal</a><a href="/#models">Model stack</a><a href="/#methodology">Methodology</a></div><div><span>SYSTEM</span><a href="/#architecture">Architecture</a><a href="https://solana.com/docs" target="_blank" rel="noreferrer">Solana</a><a href="https://github.com/pump-fun/pump-public-docs" target="_blank" rel="noreferrer">Pump.fun docs</a></div><div className="footer-status"><span><i /> {app ? 'LIVE WORKSPACE' : 'RESEARCH SYSTEM'}</span><small>© 2026 HYPEGRAPH LABS</small></div></div><div className="shell legal-line">Research interface only. No trade execution. No financial advice. Memecoins are highly volatile and may result in total loss.</div></footer>
}

export default function App() {
  const appRoute = window.location.hostname.startsWith('app.') || window.location.pathname === '/app' || window.location.pathname.startsWith('/app/')
  useEffect(() => {
    document.title = appRoute ? 'HypeGraph OS — Live Solana Intelligence' : 'HypeGraph — Machine Intelligence for Onchain Attention'
  }, [appRoute])
  if (appRoute) return <><a className="skip-link" href="#main">Aller au contenu</a><Header app /><main id="main" className="app-page"><TerminalMasthead /><LiveTerminal /><TerminalFeatureSuite /><IntelligenceTerminal /><SignalLaboratory /></main><Footer app /></>
  return <><a className="skip-link" href="#main">Aller au contenu</a><Header /><main id="main"><Hero /><MarketPulse /><ModelStack /><ResearchModules /><Architecture /><Methodology /><Sources /><Cta /></main><Footer /></>
}
