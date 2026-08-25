import { useEffect, useMemo, useState } from 'react'
import { Activity, ChevronDown, CircleDot, Cpu, Database, ExternalLink, Flame, Gauge, Network, Radio, Radar, Search, ShieldAlert, TrendingUp, Zap } from 'lucide-react'
import { tokens as snapshotTokens } from '../data/marketSnapshot.js'
import { useLiveMarket } from '../hooks/useLiveMarket.js'
import { usePumpLaunchStream } from '../hooks/usePumpLaunchStream.js'
import { PUMP_IDL_URL, PUMP_PROGRAM_ID } from '../services/pumpEventDecoder.js'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const signed = (value) => `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(Math.abs(value) >= 100 ? 0 : 2)}%`
const usd = (value) => `$${compact.format(Number(value) || 0)}`
const shortAddress = (value) => value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '—'

function formatPrice(value) {
  if (!value) return '$0.00'
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= .001) return `$${value.toFixed(5)}`
  return `$${value.toPrecision(4)}`
}

function fallbackTokens() {
  return snapshotTokens.map((token) => ({
    address: token.pool,
    pairAddress: token.pool,
    symbol: token.symbol,
    name: token.name,
    description: token.summary,
    url: `https://www.geckoterminal.com/solana/pools/${token.pool}`,
    dexId: 'pumpswap',
    price: token.fdv / 1_000_000_000,
    change5m: token.change1h / 4,
    change1h: token.change1h,
    change6h: token.change6h,
    change24h: token.change24h,
    volume5m: token.volume24 / 288,
    volume1h: token.volume24 / 24,
    volume24: token.volume24,
    liquidity: token.liquidity,
    fdv: token.fdv,
    marketCap: token.fdv,
    buys5m: Math.round(token.buyers / 288),
    sells5m: Math.round(token.sellers / 288),
    boosts: 0,
    narrative: token.narrative.toUpperCase(),
    isPump: true,
    ml: { fomo: 55, poison: 44, persistence: 62, confidence: 52, turnover: token.volume24 / token.liquidity, balance: 72, velocity: Math.min(99, Math.round(Math.abs(token.change1h) * 2)) },
    fallbackSeries: token.series24,
  }))
}

function LinePlot({ values, positive }) {
  const series = values.length > 1 ? values : [values[0] || 1, values[0] || 1]
  const min = Math.min(...series); const max = Math.max(...series); const width = 600; const height = 145
  const points = series.map((value, index) => `${(index / (series.length - 1)) * width},${height - ((value - min) / Math.max(max - min, .000000001)) * (height - 10) - 5}`).join(' ')
  const area = `0,${height} ${points} ${width},${height}`
  return <svg className={`war-chart ${positive ? 'is-up' : 'is-down'}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Historique de prix accumulé pendant la session"><defs><linearGradient id="warFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".28" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><g className="war-grid-lines"><line x1="0" x2={width} y1="36" y2="36" /><line x1="0" x2={width} y1="72" y2="72" /><line x1="0" x2={width} y1="108" y2="108" /></g><polygon points={area} fill="url(#warFill)" /><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg>
}

function Metric({ label, value, delta, tone = '' }) {
  return <div className={`war-metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{delta}</small></div>
}

function buildFallbackNarratives(rows) {
  const map = new Map()
  rows.forEach((token) => { const item = map.get(token.narrative) || { name: token.narrative, tokens: 0, volume1h: 0, liquidity: 0, boosts: 0, momentum: 0 }; item.tokens += 1; item.volume1h += token.volume1h; item.liquidity += token.liquidity; item.momentum += token.change1h; map.set(token.narrative, item) })
  return [...map.values()].map((item) => ({ ...item, momentum: item.momentum / item.tokens })).sort((a, b) => b.volume1h - a.volume1h)
}

export default function LiveTerminal() {
  const [poll, setPoll] = useState(15000)
  const [clock, setClock] = useState(new Date())
  const [mode, setMode] = useState('ALL')
  const [sort, setSort] = useState('FLOW')
  const [query, setQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  const live = useLiveMarket(poll)
  const pump = usePumpLaunchStream()
  const fallback = useMemo(() => fallbackTokens(), [])
  const rows = live.data?.tokens?.length ? live.data.tokens : fallback
  const isLive = Boolean(live.data?.tokens?.length && !live.error)

  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (!rows.some((token) => token.address === selectedAddress)) setSelectedAddress(rows[0]?.address || '') }, [rows, selectedAddress])

  const selected = rows.find((token) => token.address === selectedAddress) || rows[0]
  const visible = rows.filter((token) => {
    const needle = query.trim().toLowerCase()
    const matchesSearch = !needle || `${token.symbol} ${token.name} ${token.narrative} ${token.address}`.toLowerCase().includes(needle)
    const isNew = token.pairCreatedAt && Date.now() - token.pairCreatedAt <= 6 * 60 * 60 * 1000
    const matchesMode = mode === 'ALL' || (mode === 'PUMP' && token.isPump) || (mode === 'NEW' && isNew) || (mode === 'BOOSTED' && token.boosts > 0) || (mode === 'RISK' && token.ml.poison >= 60)
    return matchesSearch && matchesMode
  }).sort((a, b) => sort === 'FOMO' ? b.ml.fomo - a.ml.fomo : sort === 'NEWEST' ? b.pairCreatedAt - a.pairCreatedAt : sort === 'RISK' ? b.ml.poison - a.ml.poison : b.volume1h - a.volume1h)
  const narratives = live.data?.narratives?.length ? live.data.narratives : buildFallbackNarratives(rows)
  const stats = live.data?.stats || { volume1h: rows.reduce((sum, token) => sum + token.volume1h, 0), volume24: rows.reduce((sum, token) => sum + token.volume24, 0), liquidity: rows.reduce((sum, token) => sum + token.liquidity, 0), boosts: rows.reduce((sum, token) => sum + token.boosts, 0), pumps: rows.filter((token) => token.isPump).length }
  const liveHistory = selected ? live.histories.get(selected.address) || [] : []
  const chartValues = liveHistory.length > 1 ? liveHistory : selected?.fallbackSeries || [selected?.price || 1, selected?.price || 1]
  const initialEvents = rows.slice(0, 8).map((token, index) => ({ id: token.address, symbol: token.symbol, delta: token.change5m, price: token.price, kind: token.change5m >= 0 ? 'impulse' : 'decay', at: new Date(Date.now() - index * 11000).toISOString() }))
  const events = live.events.length ? live.events : initialEvents
  const topSignal = [...rows].sort((a, b) => b.ml.fomo - a.ml.fomo)[0]
  const expanding = rows.filter((token) => token.change5m > 0).length
  const marketBias = expanding >= rows.length * .6 ? 'RISK-ON EXPANSION' : expanding <= rows.length * .4 ? 'ATTENTION DECAY' : 'ROTATIONAL FLOW'

  return (
    <section className="war-room" id="live-terminal" aria-labelledby="war-room-title">
      <div className="shell war-room__intro">
        <div><div className="eyebrow"><Activity size={13} /> LIVE MARKET FABRIC / PUBLIC DATA</div><h2 id="war-room-title">The memetic war room.</h2></div>
        <p>Un cockpit presque live : boosts, takeovers, meilleures paires Solana et impulsions de flux, rafraîchis sans rechargement. Aucun ordre n’est envoyé.</p>
      </div>

      <div className="shell war-frame">
        <div className="war-topbar">
          <div className="war-brand"><b>HG</b><span>HYPEGRAPH / LIVE NARRATIVE OS</span></div>
          <div className="war-status"><span className={isLive ? 'is-live' : 'is-degraded'}><i />{isLive ? 'DEXSCREENER LIVE' : live.loading ? 'CONNECTING' : 'SNAPSHOT FALLBACK'}</span><span className={pump.status === 'live' ? 'is-live' : 'is-degraded'}><i />PUMP / {pump.status.toUpperCase()}</span><span>CHAIN / SOLANA</span><span>{clock.toISOString().slice(11, 19)} UTC</span></div>
        </div>
        <div className="war-toolbar">
          <div className="war-modes">{['ALL', 'PUMP', 'NEW', 'BOOSTED', 'RISK'].map((item) => <button className={mode === item ? 'is-active' : ''} onClick={() => setMode(item)} type="button" key={item}>{item}</button>)}</div>
          <label className="war-search"><Search size={12} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="TOKEN / MINT / NARRATIVE" /></label>
          <button className="war-sort" type="button" onClick={() => setSort((current) => current === 'FLOW' ? 'FOMO' : current === 'FOMO' ? 'NEWEST' : current === 'NEWEST' ? 'RISK' : 'FLOW')}>SORT / {sort} <ChevronDown size={10} /></button>
          <button className="war-poll" type="button" onClick={() => setPoll((current) => current === 15000 ? 30000 : current === 30000 ? 0 : 15000)}><CircleDot size={11} /> POLL / {poll ? `${poll / 1000}S` : 'PAUSED'} <ChevronDown size={10} /></button>
          <button className="war-refresh" type="button" onClick={live.refresh} disabled={live.loading}><Zap size={11} /> SYNC NOW</button>
        </div>

        {live.error && <div className="war-alert"><ShieldAlert size={12} /> Live API unavailable: {live.error}. Frozen research data remains visible.</div>}

        <div className="war-signal-banner" aria-label="Synthèse instantanée du marché">
          <div className="war-signal-banner__pulse"><Flame size={19} /><span>DOMINANT SIGNAL</span><strong>${topSignal?.symbol || '—'}</strong><em>FOMO {topSignal?.ml.fomo || 0}</em></div>
          <div><TrendingUp size={16} /><span>MARKET REGIME</span><strong>{marketBias}</strong><small>{expanding}/{rows.length} assets expanding / 5m</small></div>
          <div><Gauge size={16} /><span>ATTENTION LEADER</span><strong>{topSignal?.narrative || 'UNRESOLVED'}</strong><small>{usd(topSignal?.volume1h)} observed 1h flow</small></div>
          <div className="war-signal-banner__latency"><CircleDot size={15} /><span>SYSTEM PULSE</span><strong>{poll ? `${poll / 1000} SEC` : 'PAUSED'}</strong><small>{isLive ? 'public market fabric active' : 'research fallback active'}</small></div>
        </div>

        <div className="war-metrics">
          <Metric label="MONITORED 1H FLOW" value={usd(stats.volume1h)} delta={`${rows.length} resolved assets`} tone="green" />
          <Metric label="AGGREGATE 24H" value={usd(stats.volume24)} delta="selected live universe" tone="blue" />
          <Metric label="VISIBLE DEPTH" value={usd(stats.liquidity)} delta="best pair per mint" />
          <Metric label="ACTIVE BOOST MASS" value={compact.format(stats.boosts)} delta="paid visibility input" tone="orange" />
          <Metric label="PUMP ENTITIES" value={`${stats.pumps}/${rows.length}`} delta="pumpfun + pumpswap" tone="violet" />
        </div>

        <div className="war-panel war-launches">
          <div className="war-panel__head"><span>P0 / CANONICAL PUMP CREATE EVENT STREAM</span><b>{pump.status === 'live' ? 'ON-CHAIN / CONFIRMED' : pump.status.toUpperCase()}</b></div>
          <div className="war-launches__summary">
            <div><Radio size={13} /><span><b>{pump.stats.session}</b> launches observed this session</span></div>
            <span>λ60 / <b>{pump.stats.perMinute}</b></span><span>MAYHEM / <b>{pump.stats.mayhem}</b></span><span>CASHBACK / <b>{pump.stats.cashback}</b></span>
            <a href={PUMP_IDL_URL} target="_blank" rel="noreferrer">OFFICIAL IDL <ExternalLink size={9} /></a>
          </div>
          <div className="war-launches__head"><span>UTC</span><span>ASSET</span><span>MINT</span><span>CREATOR</span><span>MODES</span><span>SLOT</span><span>TX</span></div>
          <div className="war-launches__rows">
            {pump.launches.length ? pump.launches.slice(0, 12).map((launch) => <div key={launch.id}>
              <time>{new Date(launch.timestamp * 1000).toISOString().slice(11, 19)}</time>
              <span><strong>${launch.symbol.slice(0, 12)}</strong><small>{launch.name.slice(0, 30)}</small></span>
              <a href={`https://solscan.io/token/${launch.mint}`} target="_blank" rel="noreferrer">{shortAddress(launch.mint)}</a>
              <a href={`https://solscan.io/account/${launch.creator}`} target="_blank" rel="noreferrer">{shortAddress(launch.creator)}</a>
              <span className="war-launches__flags">{launch.isMayhemMode && <i>M</i>}{launch.isCashbackEnabled && <i>C</i>}{!launch.isMayhemMode && !launch.isCashbackEnabled && 'STD'}</span>
              <span>{compact.format(launch.slot || 0)}</span>
              <a href={`https://solscan.io/tx/${launch.signature}`} target="_blank" rel="noreferrer"><ExternalLink size={10} /></a>
            </div>) : <div className="war-launches__empty"><Radio size={14} /><span><strong>LISTENING FOR CREATE / CREATE_V2</strong><small>{pump.error || `Subscribed to ${shortAddress(PUMP_PROGRAM_ID)} at ${pump.commitment} commitment. New launches will appear here.`}</small></span></div>}
          </div>
        </div>

        <div className="war-primary-grid">
          <div className="war-panel war-tape">
            <div className="war-panel__head"><span>A1 / TOKEN TAPE</span><b>{visible.length} ENTITIES</b></div>
            <div className="war-tape__head"><span>ASSET</span><span>5M</span><span>1H VOL</span><span>ML μ</span></div>
            <div className="war-tape__rows">{visible.map((token) => <button className={selected?.address === token.address ? 'is-active' : ''} type="button" onClick={() => setSelectedAddress(token.address)} key={token.address}><span><strong>{token.symbol.slice(0, 9)}</strong><small>{token.dexId} · {shortAddress(token.address)}</small></span><b className={token.change5m >= 0 ? 'up' : 'down'}>{signed(token.change5m)}</b><span>{usd(token.volume1h)}</span><i style={{ '--score': `${token.ml.fomo}%` }}>{token.ml.fomo}</i></button>)}</div>
          </div>

          <div className="war-panel war-focus">
            <div className="war-panel__head"><span>A2 / SELECTED MARKET OBJECT</span><a href={selected?.url} target="_blank" rel="noreferrer">OPEN PAIR <ExternalLink size={10} /></a></div>
            <div className="war-focus__identity"><div><span>{selected?.narrative}</span><h3>{selected?.name} <em>${selected?.symbol}</em></h3><small>{shortAddress(selected?.address)} / {selected?.dexId?.toUpperCase()}</small></div><div><span>PRICE USD</span><strong>{formatPrice(selected?.price)}</strong><small className={selected?.change1h >= 0 ? 'up' : 'down'}>{signed(selected?.change1h)} / 1H</small></div></div>
            <div className="war-chart-wrap"><div className="war-chart-label"><span>{isLive ? 'SESSION PRICE TRACE' : 'NORMALIZED SNAPSHOT TRACE'}</span><span>{chartValues.length} OBSERVATIONS</span></div><LinePlot values={chartValues} positive={selected?.change1h >= 0} /></div>
            <div className="war-focus__stats"><div><span>5M FLOW</span><strong>{usd(selected?.volume5m)}</strong></div><div><span>24H FLOW</span><strong>{usd(selected?.volume24)}</strong></div><div><span>LIQUIDITY</span><strong>{usd(selected?.liquidity)}</strong></div><div><span>FDV</span><strong>{usd(selected?.fdv)}</strong></div><div><span>BUY/SELL 5M</span><strong>{selected?.buys5m}/{selected?.sells5m}</strong></div></div>
          </div>

          <div className="war-panel war-ml">
            <div className="war-panel__head"><span>A3 / ML REGIME HEADS</span><b>LOCAL INFERENCE</b></div>
            <div className="war-ml__hero"><div><span>FOMO PRESSURE</span><strong>{selected?.ml.fomo}</strong></div><i style={{ '--score': `${selected?.ml.fomo * 3.6}deg` }} /></div>
            {[['NARRATIVE VELOCITY', selected?.ml.velocity], ['PERSISTENCE', selected?.ml.persistence], ['POISON / OOD', selected?.ml.poison], ['CONFIDENCE', selected?.ml.confidence]].map(([label, value]) => <div className="war-ml__bar" key={label}><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}
            <div className={`war-ml__verdict ${selected?.ml.poison >= 60 ? 'is-risk' : ''}`}><ShieldAlert size={13} /><div><b>{selected?.ml.poison >= 60 ? 'ADVERSARIAL REVIEW' : 'SIGNAL ADMISSIBLE'}</b><span>{selected?.ml.poison >= 60 ? 'Turnover or flow asymmetry exceeds threshold.' : 'No severe cross-field inconsistency detected.'}</span></div></div>
          </div>
        </div>

        <div className="war-secondary-grid">
          <div className="war-panel war-narratives">
            <div className="war-panel__head"><span>B1 / NARRATIVE RESOLUTION MATRIX</span><b>LIVE CLUSTERS</b></div>
            <div className="war-narrative-map"><svg viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path d="M70 140L190 55 302 118 430 45 535 135M70 140L265 190 535 135M190 55L265 190 430 45M302 118L535 135" /></svg>{narratives.slice(0, 6).map((item, index) => { const points = [[12,63],[32,22],[50,51],[72,18],[89,61],[44,85]][index]; return <button type="button" style={{ left: `${points[0]}%`, top: `${points[1]}%`, '--mass': `${Math.min(34, 13 + item.tokens * 4)}px` }} key={item.name}><i /><strong>{item.name}</strong><span>{usd(item.volume1h)} / {signed(item.momentum)}</span></button> })}</div>
          </div>

          <div className="war-panel war-heatmap">
            <div className="war-panel__head"><span>B2 / CROSS-SECTIONAL SIGNAL MAP</span><b>GREEN = EXPANSION / RED = DECAY</b></div>
            <div className="war-heatmap__table"><div className="war-heatmap__head"><span>TOKEN</span><span>5M</span><span>1H</span><span>6H</span><span>24H</span><span>FLOW</span><span>RISK</span></div>{rows.slice(0, 10).map((token) => <div className="war-heatmap__row" key={token.address}><strong>{token.symbol.slice(0, 7)}</strong>{[['5m', token.change5m],['1h', token.change1h],['6h', token.change6h],['24h', token.change24h]].map(([label, value]) => <span title={`${label}: ${signed(value)}`} className={value >= 0 ? 'heat-up' : 'heat-down'} style={{ '--alpha': `${Math.min(.9, .2 + Math.abs(value) / 100)}` }} key={label}>{signed(value)}</span>)}<span className="heat-flow">{compact.format(token.volume1h)}</span><span className={token.ml.poison >= 60 ? 'heat-down' : 'heat-up'} style={{ '--alpha': '.55' }}>{token.ml.poison}</span></div>)}</div>
          </div>
        </div>

        <div className="war-bottom-grid">
          <div className="war-panel war-events"><div className="war-panel__head"><span>C1 / DELTA EVENT BUS</span><b>{live.events.length ? 'OBSERVED BETWEEN POLLS' : 'INITIAL MARKET STATE'}</b></div><div className="war-events__list">{events.slice(0, 9).map((event) => <div key={event.id}><time>{new Date(event.at).toISOString().slice(11,19)}</time><i className={event.kind} /><strong>${event.symbol}</strong><span>{event.kind === 'impulse' ? 'PRICE IMPULSE' : 'ATTENTION DECAY'}</span><b className={event.delta >= 0 ? 'up' : 'down'}>{signed(event.delta)}</b><small>{formatPrice(event.price)}</small></div>)}</div></div>
          <div className="war-panel war-entities"><div className="war-panel__head"><span>C2 / ENTITY & WALLET GRAPH</span><b>PARTIAL RESOLUTION</b></div><div className="war-entity-grid">{rows.slice(0, 5).map((token, index) => <div key={token.address}><span className="war-entity-node"><Network size={12} /></span><p><strong>ENTITY {String(index + 1).padStart(2,'0')} / ${token.symbol}</strong><small>{shortAddress(token.pairAddress || token.address)} · {token.buys5m + token.sells5m} tx/5m</small></p><b>{token.ml.confidence}%</b></div>)}</div><div className="war-wallet-adapter"><Database size={13} /><span><b>WALLET IDENTITY ADAPTER REQUIRED</b>Connect Helius to resolve creator, funder, KOL and sniper lineages at transaction level.</span></div></div>
          <div className="war-panel war-system"><div className="war-panel__head"><span>C3 / SYSTEM TELEMETRY</span><b>{isLive && pump.status === 'live' ? 'NOMINAL' : 'DEGRADED'}</b></div><dl><div><dt>Market source</dt><dd>DEX Screener API</dd></div><div><dt>Launch source</dt><dd>Pump program logs</dd></div><div><dt>Pump stream</dt><dd>{pump.status}</dd></div><div><dt>Commitment</dt><dd>{pump.commitment}</dd></div><div><dt>Execution</dt><dd>disabled</dd></div></dl><div className="war-system__footer"><Cpu size={13} /> CANONICAL IDL DECODER / BROWSER EDGE</div></div>
        </div>
        <div className="war-legal"><Radar size={11} /><span>PUBLIC MARKET DATA · READ ONLY · BOOSTS ARE PAID VISIBILITY, NOT ORGANIC SENTIMENT · ML OUTPUTS ARE HEURISTICS, NOT FORECASTS</span><span>{live.loading ? 'SYNCING…' : 'FRAME COMPLETE'}</span></div>
      </div>
    </section>
  )
}
