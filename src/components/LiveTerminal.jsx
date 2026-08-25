import { useEffect, useMemo, useState } from 'react'
import { CircleDot, Database, ExternalLink, Radio, Radar, Search, ShieldAlert, Zap } from 'lucide-react'
import { useLiveMarket } from '../hooks/useLiveMarket.js'
import { usePumpLaunchStream } from '../hooks/usePumpLaunchStream.js'
import { clusterTokensOnChain } from '../lib/narrativeEngine.js'
import { signed, usd, tokenAge } from '../lib/format.js'
import MlEngineLogo from './MlEngineLogo.jsx'
import PulseDeck from './PulseDeck.jsx'
import SignalNexus from './SignalNexus.jsx'
import TokenDetail from './TokenDetail.jsx'

function LaunchRow({ launch }) {
  const market = launch.market
  return (
    <div className="live-launch">
      <div className="live-launch__icon">
        {market?.icon ? <img src={market.icon} alt="" onError={(e) => { e.target.style.display = 'none' }} /> : <span>{launch.symbol?.slice(0, 2)}</span>}
      </div>
      <div className="live-launch__info">
        <strong>${launch.symbol?.slice(0, 10)}</strong>
        <small>{launch.name?.slice(0, 24)}</small>
      </div>
      <div className="live-launch__market">
        {market ? (
          <>
            <span className={market.change1h >= 0 ? 'is-up' : 'is-down'}>{signed(market.change1h)}</span>
            <span>{usd(market.volume1h)}</span>
            <span>{usd(market.marketCap)}</span>
          </>
        ) : (
          <span className="live-launch__pending">LOADING...</span>
        )}
      </div>
      <div className="live-launch__meta">
        <span>{tokenAge(launch.timestamp ? launch.timestamp * 1000 : null)}</span>
        {launch.isMayhemMode && <span className="flag-mayhem">M</span>}
        {launch.isCashbackEnabled && <span className="flag-cashback">C</span>}
        {launch.isKOL && <span className="flag-kol">K</span>}
        <a href={`https://solscan.io/token/${launch.mint}`} target="_blank" rel="noreferrer"><ExternalLink size={10} /></a>
      </div>
    </div>
  )
}

export default function LiveTerminal() {
  const [poll, setPoll] = useState(15000)
  const [clock, setClock] = useState(new Date())
  const [query, setQuery] = useState('')
  const [selectedMint, setSelectedMint] = useState('')
  const [logoPulse, setLogoPulse] = useState(false)

  const { launches, narratives, stats, loading, error, backfill, refresh, triggerBackfill } = useLiveMarket(poll)
  const pump = usePumpLaunchStream()

  useEffect(() => { const t = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(t) }, [])
  useEffect(() => { if (pump.launches.length > 0) { setLogoPulse(true); const t = setTimeout(() => setLogoPulse(false), 1500); return () => clearTimeout(t) } }, [pump.launches.length])
  useEffect(() => { if (!selectedMint && launches.length) setSelectedMint(launches[0].mint) }, [launches, selectedMint])

  const selected = launches.find((l) => l.mint === selectedMint) || launches[0]
  const filteredLaunches = launches.filter((l) => {
    if (!query) return true
    const q = query.toLowerCase()
    return `${l.symbol} ${l.name} ${l.mint}`.toLowerCase().includes(q)
  })

  const { clusters } = useMemo(() => {
    const tokensForClustering = launches.slice(0, 200).map((l) => ({
      address: l.mint, symbol: l.symbol, name: l.name, description: '',
      change1h: l.market?.change1h || 0, change5m: l.market?.change5m || 0,
      volume1h: l.market?.volume1h || 0, liquidity: l.market?.liquidity || 0,
      marketCap: l.market?.marketCap || 0, icon: l.market?.icon || '',
      pairCreatedAt: l.timestamp ? l.timestamp * 1000 : null,
      ml: { fomo: 50, poison: 20, velocity: 50 },
    }))
    return clusterTokensOnChain(tokensForClustering, { maxClusters: 12, minClusterSize: 2 })
  }, [launches])

  const narrativeLabels = clusters.map((c) => ({
    name: c.label, tokens: c.size,
    volume1h: c.tokens.reduce((s, t) => s + (t.volume1h || 0), 0),
    momentum: c.tokens.reduce((s, t) => s + (t.change1h || 0), 0) / Math.max(c.size, 1),
    confidence: c.confidence, category: c.category || 'emerging',
    topTokens: c.tokens.slice(0, 5).map((t) => ({ symbol: t.symbol, change1h: t.change1h, volume1h: t.volume1h })),
  }))

  return (
    <section className="war-room" id="live-terminal">
      <div className="shell war-frame">
        <div className="war-topbar">
          <div className="war-brand"><MlEngineLogo pulse={logoPulse} size={25} /><span>machinelearn.ing / LIVE INTELLIGENCE</span></div>
          <div className="war-status">
            <span className={pump.status === 'live' ? 'is-live' : 'is-degraded'}><i />{pump.status.toUpperCase()}</span>
            <span>{clock.toISOString().slice(11, 19)} UTC</span>
          </div>
        </div>
        <div className="war-toolbar">
          <label className="war-search"><Search size={12} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="SEARCH TOKEN / SYMBOL / MINT" /></label>
          <button className="war-refresh" type="button" onClick={refresh} disabled={loading}><Zap size={11} /> REFRESH</button>
          <button className="war-poll" type="button" onClick={() => triggerBackfill(24)}><Database size={11} /> BACKFILL 24H</button>
          <button className="war-poll" type="button" onClick={() => setPoll((c) => c === 15000 ? 30000 : c === 30000 ? 0 : 15000)}><CircleDot size={11} /> {poll ? `${poll/1000}s` : 'PAUSED'}</button>
        </div>
        {backfill.status === 'running' && backfill.progress && <div className="war-alert"><Radar size={12} /> BACKFILL: {backfill.progress.message}</div>}
        {error && <div className="war-alert"><ShieldAlert size={12} /> {error}</div>}
        <div className="launch-rail" aria-label="Pump.fun live">
          <div className="launch-rail__label"><span><Radio size={12} /> PUMP.FUN LIVE</span><strong>{pump.stats.perMinute}/MIN</strong></div>
          <div className="launch-rail__viewport">
            {pump.launches.length ? (
              <div className={`launch-rail__track ${pump.launches.length > 2 ? 'is-moving' : ''}`}>
                {[...pump.launches, ...(pump.launches.length > 2 ? pump.launches : [])].map((launch, i) => (
                  <a href={`https://solscan.io/token/${launch.mint}`} target="_blank" rel="noreferrer" key={`${launch.id}-${i}`}>
                    <i /><time>{new Date(launch.timestamp * 1000).toISOString().slice(11, 19)}</time>
                    <b>${launch.symbol?.slice(0, 10)}</b><span>{launch.name?.slice(0, 20)}</span>
                    {launch.isMayhemMode && <em>MAYHEM</em>}
                  </a>
                ))}
              </div>
            ) : <div className="launch-rail__waiting"><i /> Listening for Pump.fun launches...</div>}
          </div>
          <div className="launch-rail__counter"><b>{pump.stats.session}</b><span>CAPTURED</span></div>
        </div>
        <div className="war-metrics">
          <div className="war-metric green"><span>LAUNCHES 24H</span><strong>{stats.total}</strong><small>total observed</small></div>
          <div className="war-metric blue"><span>VOLUME 1H</span><strong>{usd(stats.volume1h)}</strong><small>all enriched tokens</small></div>
          <div className="war-metric"><span>CLUSTERS</span><strong>{narrativeLabels.length}</strong><small>active themes</small></div>
          <div className="war-metric orange"><span>LIVE FEED</span><strong>{pump.launches.length}</strong><small>real-time captures</small></div>
        </div>
        <SignalNexus
          tokens={launches.slice(0, 200).map((l) => ({
            address: l.mint, symbol: l.symbol, name: l.name, narrative: '',
            change5m: l.market?.change5m || 0, change1h: l.market?.change1h || 0,
            volume1h: l.market?.volume1h || 0, liquidity: l.market?.liquidity || 0,
            marketCap: l.market?.marketCap || 0,
            ml: { fomo: 50, poison: 20, velocity: 50 },
            pairCreatedAt: l.timestamp ? l.timestamp * 1000 : null,
            icon: l.market?.icon || '', creator: l.creator || '', isKOL: l.isKOL || false,
          }))}
          clusters={clusters} narrativeLabels={narrativeLabels} launches={pump.launches}
          selectedAddress={selectedMint} onSelectToken={setSelectedMint}
        />
        <div className="war-panel war-launches" id="launch-feed">
          <div className="war-panel__head"><span>LIVE PUMP.FUN LAUNCHES</span><b>{filteredLaunches.length} TOKENS</b></div>
          <div className="war-launches__head"><span></span><span>TOKEN</span><span>PRICE / CHG 1H</span><span>VOLUME 1H</span><span>MCAP</span><span>AGE</span><span></span></div>
          <div className="war-launches__rows">
            {filteredLaunches.slice(0, 50).map((launch) => (
              <LaunchRow key={launch.id || launch.mint} launch={launch} />
            ))}
            {!filteredLaunches.length && !loading && (
              <div className="war-launches__empty"><Radio size={14} /><span><strong>NO TOKENS FOUND</strong><small>Run a 24h backfill or wait for new launches</small></span></div>
            )}
          </div>
        </div>
        {selected && <TokenDetail token={selected} />}
        <PulseDeck tokens={launches.filter((l) => l.market).map((l) => ({ address: l.mint, symbol: l.symbol, name: l.name, narrative: '', change5m: l.market.change5m, change1h: l.market.change1h, volume1h: l.market.volume1h, liquidity: l.market.liquidity, fdv: l.market.fdv, marketCap: l.market.marketCap, ml: { fomo: 50, poison: 20, velocity: 50 }, icon: l.market.icon || '', pairCreatedAt: l.timestamp ? l.timestamp * 1000 : null }))} launches={pump.launches} selectedAddress={selectedMint} onSelectToken={setSelectedMint} />

      </div>
    </section>
  )
}
