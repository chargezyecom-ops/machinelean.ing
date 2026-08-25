import { useEffect, useMemo, useState } from 'react'
import { Activity, ChevronDown, CircleDot, Cpu, Database, ExternalLink, Flame, Gauge, Network, Radio, Radar, Search, ShieldAlert, TrendingUp, Zap } from 'lucide-react'
import { tokens as snapshotTokens } from '../data/marketSnapshot.js'
import { useLiveMarket } from '../hooks/useLiveMarket.js'
import { usePumpLaunchStream } from '../hooks/usePumpLaunchStream.js'
import { PUMP_IDL_URL, PUMP_PROGRAM_ID } from '../services/pumpEventDecoder.js'
import PumpHistoricalLab from './PumpHistoricalLab.jsx'

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
  const [launchLimit, setLaunchLimit] = useState(6)
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
  const marketBias = expanding >= rows.length * .6 ? 'MARCHÉ EN HAUSSE' : expanding <= rows.length * .4 ? 'ATTENTION EN BAISSE' : 'ROTATION DES THÈMES'
  const sortLabel = { FLOW: 'VOLUME 1H', FOMO: 'POTENTIEL', NEWEST: 'PLUS RÉCENTS', RISK: 'RISQUE' }[sort]

  return (
    <section className="war-room" id="live-terminal" aria-labelledby="war-room-title">
      <div className="shell war-room__intro">
        <div><div className="eyebrow"><Activity size={13} /> MACHINE OBSERVATION / PUMP.FUN</div><h2 id="war-room-title">The memetic observation grid.</h2></div>
        <p>La Machine observe les créations, les graphes wallet et les anomalies de propagation avant leur résolution par le marché.</p>
      </div>

      <div className="shell war-frame">
        <div className="war-topbar">
          <div className="war-brand"><b>HG</b><span>MACHINE / LIVE OBSERVATION GRID</span></div>
          <div className="war-status"><span className={isLive ? 'is-live' : 'is-degraded'}><i />{isLive ? 'SURVEILLANCE ACTIVE' : live.loading ? 'ESTABLISHING CHANNEL' : 'MEMORY FALLBACK'}</span><span className={pump.status === 'live' ? 'is-live' : 'is-degraded'}><i />EVENT CHANNEL / {pump.status.toUpperCase()}</span><span>UNIVERSE / PUMP.FUN</span><span>{clock.toISOString().slice(11, 19)} UTC</span></div>
        </div>
        <div className="war-toolbar">
          <div className="war-modes">{[['ALL','TOUS'],['PUMP','PUMP'],['NEW','NOUVEAUX'],['BOOSTED','BOOSTÉS'],['RISK','RISQUE']].map(([value, label]) => <button className={mode === value ? 'is-active' : ''} onClick={() => setMode(value)} type="button" key={value}>{label}</button>)}</div>
          <label className="war-search"><Search size={12} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="RECHERCHER TOKEN / MINT / THÈME" /></label>
          <button className="war-sort" type="button" onClick={() => setSort((current) => current === 'FLOW' ? 'FOMO' : current === 'FOMO' ? 'NEWEST' : current === 'NEWEST' ? 'RISK' : 'FLOW')}>TRIER / {sortLabel} <ChevronDown size={10} /></button>
          <button className="war-poll" type="button" onClick={() => setPoll((current) => current === 15000 ? 30000 : current === 30000 ? 0 : 15000)}><CircleDot size={11} /> ACTUALISER / {poll ? `${poll / 1000}S` : 'PAUSE'} <ChevronDown size={10} /></button>
          <button className="war-refresh" type="button" onClick={live.refresh} disabled={live.loading}><Zap size={11} /> ACTUALISER MAINTENANT</button>
        </div>

        {live.error && <div className="war-alert"><ShieldAlert size={12} /> Live API unavailable: {live.error}. Frozen research data remains visible.</div>}

        <div className="war-signal-banner" aria-label="Synthèse instantanée du marché">
          <div className="war-signal-banner__pulse"><Flame size={19} /><span>TOKEN À SURVEILLER</span><strong>${topSignal?.symbol || '—'}</strong><em>POTENTIEL {topSignal?.ml.fomo || 0}%</em></div>
          <div><TrendingUp size={16} /><span>TENDANCE GÉNÉRALE</span><strong>{marketBias}</strong><small>{expanding}/{rows.length} tokens progressent sur 5 min</small></div>
          <div><Gauge size={16} /><span>THÈME DOMINANT</span><strong>{topSignal?.narrative || 'NON CLASSÉ'}</strong><small>{usd(topSignal?.volume1h)} de volume observé sur 1 h</small></div>
          <div className="war-signal-banner__latency"><CircleDot size={15} /><span>MISE À JOUR</span><strong>{poll ? `${poll / 1000} SEC` : 'PAUSE'}</strong><small>{isLive ? 'données publiques actives' : 'données de secours actives'}</small></div>
        </div>

        <div className="war-metrics">
          <Metric label="VOLUME OBSERVÉ / 1H" value={usd(stats.volume1h)} delta={`${rows.length} tokens analysés`} tone="green" />
          <Metric label="VOLUME OBSERVÉ / 24H" value={usd(stats.volume24)} delta="uniquement l’univers Pump.fun" tone="blue" />
          <Metric label="LIQUIDITÉ DISPONIBLE" value={usd(stats.liquidity)} delta="meilleur marché trouvé par token" />
          <Metric label="VISIBILITÉ PAYÉE" value={compact.format(stats.boosts)} delta="indicateur séparé du volume naturel" tone="orange" />
          <Metric label="TOKENS PUMP.FUN" value={`${stats.pumps}/${rows.length}`} delta="du lancement à la migration" tone="violet" />
        </div>

        <div className="war-panel war-launches" id="launch-feed">
          <div className="war-panel__head"><span>P0 / NOUVEAUX TOKENS PUMP.FUN EN DIRECT</span><b>{pump.status === 'live' ? 'SOLANA / CONFIRMÉ' : pump.status.toUpperCase()}</b></div>
          <div className="war-launches__summary">
            <div><Radio size={13} /><span><b>{pump.stats.session}</b> nouveaux tokens reçus pendant cette session</span></div>
            <span>PAR MINUTE / <b>{pump.stats.perMinute}</b></span><span>MAYHEM / <b>{pump.stats.mayhem}</b></span><span>CASHBACK / <b>{pump.stats.cashback}</b></span>
            <button className="war-launch-limit" type="button" onClick={() => setLaunchLimit((current) => current === 6 ? 12 : 6)}>{launchLimit === 6 ? `VOIR 12 / ${Math.max(0, pump.launches.length - 6)} MASQUÉS` : 'VUE COMPACTE / 6'}</button>
            <a href={PUMP_IDL_URL} target="_blank" rel="noreferrer">SOURCE OFFICIELLE <ExternalLink size={9} /></a>
          </div>
          <div className="war-launches__head"><span>HEURE</span><span>TOKEN</span><span>MINT</span><span>CRÉATEUR</span><span>TYPE</span><span>SLOT</span><span>TX</span></div>
          <div className="war-launches__rows">
            {pump.launches.length ? pump.launches.slice(0, launchLimit).map((launch) => <div key={launch.id}>
              <time>{new Date(launch.timestamp * 1000).toISOString().slice(11, 19)}</time>
              <span><strong>${launch.symbol.slice(0, 12)}</strong><small>{launch.name.slice(0, 30)}</small></span>
              <a href={`https://solscan.io/token/${launch.mint}`} target="_blank" rel="noreferrer">{shortAddress(launch.mint)}</a>
              <a href={`https://solscan.io/account/${launch.creator}`} target="_blank" rel="noreferrer">{shortAddress(launch.creator)}</a>
              <span className="war-launches__flags">{launch.isMayhemMode && <i>M</i>}{launch.isCashbackEnabled && <i>C</i>}{!launch.isMayhemMode && !launch.isCashbackEnabled && 'STD'}</span>
              <span>{compact.format(launch.slot || 0)}</span>
              <a href={`https://solscan.io/tx/${launch.signature}`} target="_blank" rel="noreferrer"><ExternalLink size={10} /></a>
            </div>) : <div className="war-launches__empty"><Radio size={14} /><span><strong>EN ATTENTE DU PROCHAIN LANCEMENT</strong><small>{pump.error || `Connexion au programme ${shortAddress(PUMP_PROGRAM_ID)} en mode ${pump.commitment}. Les nouveaux tokens apparaîtront ici.`}</small></span></div>}
          </div>
        </div>

        <div className="war-primary-grid">
          <div className="war-panel war-tape" id="token-watchlist">
            <div className="war-panel__head"><span>A1 / TOKENS À SURVEILLER</span><b>{visible.length} TOKENS</b></div>
            <div className="war-tape__head"><span>TOKEN</span><span>PRIX 5M</span><span>VOLUME 1H</span><span>SCORE</span></div>
            <div className="war-tape__rows">{visible.map((token) => <button className={selected?.address === token.address ? 'is-active' : ''} type="button" onClick={() => setSelectedAddress(token.address)} key={token.address}><span><strong>{token.symbol.slice(0, 9)}</strong><small>{token.dexId} · {shortAddress(token.address)}</small></span><b className={token.change5m >= 0 ? 'up' : 'down'}>{signed(token.change5m)}</b><span>{usd(token.volume1h)}</span><i style={{ '--score': `${token.ml.fomo}%` }}>{token.ml.fomo}</i></button>)}</div>
          </div>

          <div className="war-panel war-focus" id="entity-analysis">
            <div className="war-panel__head"><span>A2 / TOKEN SÉLECTIONNÉ</span><a href={selected?.url} target="_blank" rel="noreferrer">VOIR LE MARCHÉ <ExternalLink size={10} /></a></div>
            <div className="war-focus__identity"><div><span>{selected?.narrative} / RELEVANT</span><h3>{selected?.name} <em>${selected?.symbol}</em></h3><small>{shortAddress(selected?.address)} / {selected?.dexId?.toUpperCase()}</small></div><div><span>CURRENT VALUE</span><strong>{formatPrice(selected?.price)}</strong><small className={selected?.change1h >= 0 ? 'up' : 'down'}>{signed(selected?.change1h)} / 1H</small><i className="machine-target-tag">ENTITY ACQUIRED</i></div></div>
            <div className="war-chart-wrap"><div className="war-chart-label"><span>{isLive ? 'SESSION PRICE TRACE' : 'NORMALIZED SNAPSHOT TRACE'}</span><span>{chartValues.length} OBSERVATIONS</span></div><LinePlot values={chartValues} positive={selected?.change1h >= 0} /></div>
            <div className="war-focus__stats"><div><span>5M FLOW</span><strong>{usd(selected?.volume5m)}</strong></div><div><span>24H FLOW</span><strong>{usd(selected?.volume24)}</strong></div><div><span>LIQUIDITY</span><strong>{usd(selected?.liquidity)}</strong></div><div><span>FDV</span><strong>{usd(selected?.fdv)}</strong></div><div><span>BUY/SELL 5M</span><strong>{selected?.buys5m}/{selected?.sells5m}</strong></div></div>
          </div>

          <div className="war-panel war-ml" id="analysis-scores">
            <div className="war-panel__head"><span>A3 / SCORES D’ANALYSE</span><b>HEURISTIQUES LOCALES</b></div>
            <div className="war-ml__hero"><div><span>POTENTIEL DE PROPAGATION</span><strong>{selected?.ml.fomo}</strong></div><i style={{ '--score': `${selected?.ml.fomo * 3.6}deg` }} /></div>
            {[['VITESSE DU THÈME', selected?.ml.velocity], ['PERSISTANCE', selected?.ml.persistence], ['NIVEAU DE RISQUE', selected?.ml.poison], ['FIABILITÉ DU SCORE', selected?.ml.confidence]].map(([label, value]) => <div className="war-ml__bar" key={label}><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}
            <div className={`war-ml__verdict ${selected?.ml.poison >= 60 ? 'is-risk' : ''}`}><ShieldAlert size={13} /><div><b>{selected?.ml.poison >= 60 ? 'RISQUE ÉLEVÉ' : 'TOKEN À SURVEILLER'}</b><span>{selected?.ml.poison >= 60 ? 'Le volume ou la répartition des échanges paraît anormale.' : 'Plusieurs indicateurs justifient de continuer à observer ce token.'}</span></div></div>
          </div>
        </div>

        <div className="war-secondary-grid">
          <div className="war-panel war-narratives" id="narrative-map">
            <div className="war-panel__head"><span>B1 / THÈMES DU MOMENT</span><b>REGROUPEMENT AUTOMATIQUE</b></div>
            <div className="war-narrative-map"><svg viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path d="M70 140L190 55 302 118 430 45 535 135M70 140L265 190 535 135M190 55L265 190 430 45M302 118L535 135" /></svg>{narratives.slice(0, 6).map((item, index) => { const points = [[12,63],[32,22],[50,51],[72,18],[89,61],[44,85]][index]; return <button type="button" style={{ left: `${points[0]}%`, top: `${points[1]}%`, '--mass': `${Math.min(34, 13 + item.tokens * 4)}px` }} key={item.name}><i /><strong>{item.name}</strong><span>{usd(item.volume1h)} / {signed(item.momentum)}</span></button> })}</div>
          </div>

          <div className="war-panel war-heatmap">
            <div className="war-panel__head"><span>B2 / ÉVOLUTION COMPARÉE</span><b>HAUSSE / BAISSE / RISQUE</b></div>
            <div className="war-heatmap__table"><div className="war-heatmap__head"><span>TOKEN</span><span>5M</span><span>1H</span><span>6H</span><span>24H</span><span>FLOW</span><span>RISK</span></div>{rows.slice(0, 10).map((token) => <div className="war-heatmap__row" key={token.address}><strong>{token.symbol.slice(0, 7)}</strong>{[['5m', token.change5m],['1h', token.change1h],['6h', token.change6h],['24h', token.change24h]].map(([label, value]) => <span title={`${label}: ${signed(value)}`} className={value >= 0 ? 'heat-up' : 'heat-down'} style={{ '--alpha': `${Math.min(.9, .2 + Math.abs(value) / 100)}` }} key={label}>{signed(value)}</span>)}<span className="heat-flow">{compact.format(token.volume1h)}</span><span className={token.ml.poison >= 60 ? 'heat-down' : 'heat-up'} style={{ '--alpha': '.55' }}>{token.ml.poison}</span></div>)}</div>
          </div>
        </div>

        <div className="war-bottom-grid">
          <div className="war-panel war-events"><div className="war-panel__head"><span>C1 / CHANGEMENTS RÉCENTS</span><b>{live.events.length ? 'NOUVEAUX ÉVÉNEMENTS' : 'ÉTAT INITIAL'}</b></div><div className="war-events__list">{events.slice(0, 9).map((event) => <div key={event.id}><time>{new Date(event.at).toISOString().slice(11,19)}</time><i className={event.kind} /><strong>${event.symbol}</strong><span>{event.kind === 'impulse' ? 'ACCÉLÉRATION' : 'BAISSE D’ATTENTION'}</span><b className={event.delta >= 0 ? 'up' : 'down'}>{signed(event.delta)}</b><small>{formatPrice(event.price)}</small></div>)}</div></div>
          <div className="war-panel war-entities"><div className="war-panel__head"><span>C2 / WALLETS ET ENTITÉS LIÉS</span><b>APERÇU PARTIEL</b></div><div className="war-entity-grid">{rows.slice(0, 5).map((token, index) => <div key={token.address}><span className="war-entity-node"><Network size={12} /></span><p><strong>ENTITÉ {String(index + 1).padStart(2,'0')} / ${token.symbol}</strong><small>{shortAddress(token.pairAddress || token.address)} · {token.buys5m + token.sells5m} transactions/5m</small></p><b>{token.ml.confidence}%</b></div>)}</div><div className="war-wallet-adapter"><Database size={13} /><span><b>ANALYSE WALLET EN PRÉPARATION</b>Helius permettra de relier créateur, financeur, KOL et premiers acheteurs.</span></div></div>
          <div className="war-panel war-system"><div className="war-panel__head"><span>C3 / ÉTAT DES SOURCES</span><b>{isLive && pump.status === 'live' ? 'OPÉRATIONNEL' : 'PARTIEL'}</b></div><dl><div><dt>Tokens suivis</dt><dd>Pump.fun uniquement</dd></div><div><dt>Nouveaux launches</dt><dd>logs Pump.fun</dd></div><div><dt>Prix et volumes</dt><dd>données publiques</dd></div><div><dt>Flux Helius</dt><dd>{pump.status}</dd></div><div><dt>Achat automatique</dt><dd>désactivé</dd></div></dl><div className="war-system__footer"><Cpu size={13} /> LECTURE SEULE / AUCUN ORDRE ENVOYÉ</div></div>
        </div>
        <PumpHistoricalLab />
        <div className="war-legal"><Radar size={11} /><span>THE MACHINE OBSERVES · IT DOES NOT EXECUTE · CLASSIFICATIONS ARE PROBABILISTIC RESEARCH OUTPUTS, NOT FORECASTS</span><span>{live.loading ? 'ACQUIRING…' : 'OBSERVATION COMPLETE'}</span></div>
      </div>
    </section>
  )
}
