import { useMemo, useState, useEffect, useCallback } from 'react'
import { Activity, ArrowUpRight, ArrowDownRight, Database, Flame, Gauge, Globe, Layers, Radio, Shield, Target, TrendingUp, Users, Zap } from 'lucide-react'
import { compact, usd, signed, tokenAge, shortAddress, formatPrice } from '../lib/format.js'
import { generateMockUniverse, spawnNewToken } from '../lib/mockEngine.js'

const API = import.meta.env.VITE_API_BASE_URL || 'https://steadfast-cat-production-cc3a.up.railway.app/api'

function HistoricalMetric({ icon: Icon, label, value, detail, tone = '', delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`history-metric ${tone} ${visible ? 'history-metric--visible' : ''}`} style={{ '--delay': delay + 'ms' }}>
      <Icon size={17} /><span>{label}</span><strong>{value}</strong><small>{detail}</small>
    </div>
  )
}

export default function PumpHistoricalLab() {
  const [tick, setTick] = useState(0)
  const [mockData, setMockData] = useState(() => generateMockUniverse())
  const [liveLaunches, setLiveLaunches] = useState([])
  const [liveNarratives, setLiveNarratives] = useState([])
  const [liveWalletReport, setLiveWalletReport] = useState(null)
  const [liveStats, setLiveStats] = useState(null)
  const [events, setEvents] = useState([])
  const [flows, setFlows] = useState([])

  // Tick for animation
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 5000); return () => clearInterval(iv) }, [])

  // Fetch live data from backend
  const fetchData = useCallback(async () => {
    try {
      const [launchRes, narrRes, statsRes, walletRes] = await Promise.allSettled([
        fetch(API + '/v1/launches?enrich=true&limit=50', { signal: AbortSignal.timeout(8000) }),
        fetch(API + '/v1/narratives', { signal: AbortSignal.timeout(8000) }),
        fetch(API + '/v1/stats', { signal: AbortSignal.timeout(5000) }),
        fetch(API + '/v1/wallets/report', { signal: AbortSignal.timeout(5000) }),
      ])

      if (launchRes.status === 'fulfilled' && launchRes.value.ok) {
        const json = await launchRes.value.json()
        setLiveLaunches(json.data || [])
      }
      if (narrRes.status === 'fulfilled' && narrRes.value.ok) {
        const json = await narrRes.value.json()
        setLiveNarratives(json.narratives || [])
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const json = await statsRes.value.json()
        setLiveStats(json.data || null)
      }
      if (walletRes.status === 'fulfilled' && walletRes.value.ok) {
        const json = await walletRes.value.json()
        setLiveWalletReport(json.data || null)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 12000); return () => clearInterval(iv) }, [fetchData])

  // Spawn new mock events periodically
  useEffect(() => {
    const iv = setInterval(() => {
      const isUp = Math.random() > 0.35
      const tokens = mockData.tokens
      const t = tokens[Math.floor(Math.random() * tokens.length)]
      if (!t) return
      const evt = {
        id: Date.now() + Math.random(),
        time: new Date().toISOString().slice(11, 16),
        type: isUp ? 'launch' : 'migration',
        symbol: t.symbol,
        name: t.name,
        narrative: t.narrative,
        value: isUp ? `+$${(Math.random() * 500 + 20).toFixed(0)}K` : `$${(Math.random() * 100 + 5).toFixed(0)}K`,
        direction: isUp ? 'up' : 'down',
        change1h: t.change1h,
        volume1h: t.volume1h,
      }
      setEvents(prev => [evt, ...prev].slice(0, 30))
    }, 3000 + Math.random() * 4000)
    return () => clearInterval(iv)
  }, [mockData])

  // Spawn mock liquidity flows
  useEffect(() => {
    const iv = setInterval(() => {
      const t = mockData.tokens[Math.floor(Math.random() * mockData.tokens.length)]
      if (!t) return
      const isInflow = Math.random() > 0.4
      const wallet = `${['7x','9k','Dz','Fm','Hn','Jp','Lq','Ms','Nw','Py'][Math.floor(Math.random()*10)]}${Math.floor(Math.random()*90+10)}...${Math.floor(Math.random()*900+100)}`
      const flow = {
        id: Date.now() + Math.random(),
        from: isInflow ? wallet : t.symbol,
        to: isInflow ? t.symbol : wallet,
        amount: `$${(Math.random() * 200 + 5).toFixed(1)}K`,
        type: isInflow ? 'inflow' : 'outflow',
        time: `${Math.floor(Math.random() * 15 + 1)}m ago`,
      }
      setFlows(prev => [flow, ...prev].slice(0, 12))
    }, 2500 + Math.random() * 3500)
    return () => clearInterval(iv)
  }, [mockData])

  // Spawn new mock tokens into the universe
  useEffect(() => {
    const iv = setInterval(() => {
      const result = spawnNewToken(mockData.narratives)
      if (result) {
        setMockData(prev => ({
          tokens: [...prev.tokens, result.token],
          narratives: result.isNew ? [...prev.narratives, result.narrative] : prev.narratives,
        }))
      }
    }, 8000 + Math.random() * 7000)
    return () => clearInterval(iv)
  }, [])

  // Merge live + mock for display
  const allTokens = useMemo(() => {
    const live = liveLaunches.map(l => ({
      address: l.mint, symbol: l.symbol, name: l.name,
      narrative: '', change1h: l.market?.change1h || 0,
      volume1h: l.market?.volume1h || 0, liquidity: l.market?.liquidity || 0,
      marketCap: l.market?.marketCap || 0,
      pairCreatedAt: l.timestamp ? l.timestamp * 1000 : null,
      icon: l.market?.icon || '', isLive: true,
    }))
    const mock = mockData.tokens.map(t => ({
      address: t.address, symbol: t.symbol, name: t.name,
      narrative: t.narrative, change1h: t.change1h,
      volume1h: t.volume1h, liquidity: t.liquidity,
      marketCap: t.marketCap,
      pairCreatedAt: t.pairCreatedAt,
      icon: t.icon, isLive: false,
    }))
    return [...live, ...mock]
  }, [liveLaunches, mockData])

  // Stats
  const stats = useMemo(() => {
    const now = Date.now()
    const totalLaunches = liveStats?.totalLaunches || liveLaunches.length || 0
    const last1h = liveStats?.last1h || liveLaunches.filter(l => now - (l.timestamp * 1000) < 3600000).length
    const last24h = liveStats?.last24h || totalLaunches
    const uniqueCreators = liveStats?.uniqueCreators || new Set(liveLaunches.map(l => l.creator)).size
    const mayhemCount = liveStats?.mayhemCount || liveLaunches.filter(l => l.isMayhemMode).length
    const kolLaunches = liveStats?.kolLaunches || liveLaunches.filter(l => l.isKOL).length
    const perMinute = last1h > 0 ? (last1h / 60).toFixed(1) : '0'
    return { totalLaunches, last1h, last24h, uniqueCreators, mayhemCount, kolLaunches, perMinute }
  }, [liveStats, liveLaunches])

  // Narrative leaderboard from live + mock
  const narrativeStats = useMemo(() => {
    const map = new Map()
    // Live narratives
    for (const n of liveNarratives) {
      map.set(n.label || n.name, {
        name: n.label || n.name,
        tokens: n.size || n.tokens || 0,
        volume: n.totalVolume || n.volume1h || 0,
        heat: Math.min(99, Math.round((n.confidence || 0.5) * 100)),
        velocity: n.avgChange ? signed(n.avgChange) : '+0%',
        isLive: true,
      })
    }
    // Mock narratives
    for (const n of mockData.narratives) {
      if (map.has(n.name)) {
        const existing = map.get(n.name)
        existing.tokens += n.tokens || 0
        existing.volume += n.volume1h || 0
      } else {
        map.set(n.name, {
          name: n.name,
          tokens: n.tokens || 0,
          volume: n.volume1h || 0,
          heat: Math.min(99, Math.round((n.confidence || 0.5) * 100)),
          velocity: n.momentum ? signed(n.momentum) : '+0%',
          isLive: false,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.volume - a.volume).slice(0, 8)
  }, [liveNarratives, mockData])

  // Recent token observations (live first, then mock)
  const recentTokens = useMemo(() => {
    return allTokens
      .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))
      .slice(0, 16)
  }, [allTokens])

  // Token state distribution
  const outcomes = useMemo(() => {
    const bonding = allTokens.filter(t => (t.marketCap || 0) < 70000).length
    const migrating = allTokens.filter(t => (t.marketCap || 0) >= 70000 && (t.marketCap || 0) < 100000).length
    const active = allTokens.filter(t => (t.marketCap || 0) >= 100000).length
    const total = bonding + migrating + active || 1
    return { bonding, migrating, active, total }
  }, [allTokens])

  // Wallet flows from live report + mock flows
  const walletFlows = useMemo(() => {
    const result = []
    // Live wallet flows
    if (liveWalletReport?.flows) {
      for (const f of liveWalletReport.flows.slice(0, 6)) {
        result.push({
          id: f.id || Math.random(),
          from: f.fromWallet ? shortAddress(f.fromWallet) : f.fromToken || '?',
          to: f.toToken || f.toWallet ? shortAddress(f.toWallet) : '?',
          amount: usd(f.amount || 0),
          type: f.direction === 'in' ? 'inflow' : 'outflow',
          time: f.timeAgo || 'just now',
          isLive: true,
        })
      }
    }
    // Mock flows
    for (const f of flows) {
      result.push({ ...f, isLive: false })
    }
    return result.slice(0, 12)
  }, [liveWalletReport, flows])

  return (
    <section className="history-lab" id="history-lab" aria-labelledby="history-lab-title">
      <div className="history-lab__head">
        <div>
          <span><Database size={14} /> mlearn.ing / SESSION MEMORY</span>
          <h2 id="history-lab-title">Everything the engine has <em>observed this session.</em></h2>
          <p>Live capture from Pump.fun creation events, market observations and on-chain activity.</p>
        </div>
        <div className="history-lab__badge history-lab__badge--live"><Radio size={15} /><span><b>LIVE SESSION DATA</b>OBSERVED IN REAL-TIME</span></div>
      </div>

      <div className="history-metrics">
        <HistoricalMetric icon={Activity} label="TOKENS OBSERVED" value={compact.format(allTokens.length)} detail={`${stats.last24h} in last 24h`} tone="green" delay={0} />
        <HistoricalMetric icon={Users} label="UNIQUE CREATORS" value={compact.format(stats.uniqueCreators)} detail="distinct deployers observed" delay={100} />
        <HistoricalMetric icon={TrendingUp} label="CREATIONS / MIN" value={stats.perMinute} detail={`${stats.last1h} in last 1h`} tone="blue" delay={200} />
        <HistoricalMetric icon={Target} label="BONDING CURVE" value={outcomes.bonding} detail={`${outcomes.total} tokens total`} tone="violet" delay={300} />
        <HistoricalMetric icon={Gauge} label="MAYHEM MODE" value={stats.mayhemCount} detail={`${stats.kolLaunches} KOL launches`} tone="orange" delay={400} />
      </div>

      <div className="history-core-grid">
        {/* Recent Token Observations */}
        <div className="history-panel history-session-timeline">
          <div className="history-panel__head"><span>D1 / RECENT TOKEN OBSERVATIONS</span><b>{recentTokens.length} TOKENS</b></div>
          <div className="history-session-timeline__list">
            {recentTokens.map((token, i) => (
              <div key={token.address || token.symbol + i} className="history-session-timeline__item" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="history-session-timeline__rank">#{i + 1}</div>
                <div>
                  <strong>
                    {token.icon && <img src={token.icon} alt="" style={{ width: 14, height: 14, borderRadius: '50%', marginRight: 4, verticalAlign: 'middle' }} onError={e => { e.target.style.display = 'none' }} />}
                    ${token.symbol} / {token.name}
                  </strong>
                  <small>{token.narrative || 'UNCLASSIFIED'} / {tokenAge(token.pairCreatedAt)} old {token.isLive ? '(LIVE)' : ''}</small>
                </div>
                <div className="history-session-timeline__metrics">
                  <span className={token.change1h >= 0 ? 'is-up' : 'is-down'}>{signed(token.change1h)}</span>
                  <span>{usd(token.volume1h)}</span>
                  <span>{usd(token.liquidity)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token State Distribution */}
        <div className="history-panel history-outcomes">
          <div className="history-panel__head"><span>D2 / TOKEN STATE DISTRIBUTION</span><b>OBSERVED STATES</b></div>
          <div className="history-outcomes__summary">
            <div style={{ '--bonding': `${outcomes.bonding / outcomes.total * 100}%`, '--migrating': `${outcomes.migrating / outcomes.total * 100}%`, '--active': `${outcomes.active / outcomes.total * 100}%` }}>
              <strong>{outcomes.total}</strong>
              <span>TOKENS OBSERVED</span>
            </div>
          </div>
          <div className="history-outcomes__list">
            <div><i style={{ background: '#f5be62' }} /><span><b>BONDING</b><small>Still on bonding curve ({'< $70K FDV'})</small></span><strong style={{ color: '#f5be62' }}>{outcomes.bonding}</strong></div>
            <div><i style={{ background: '#c981ff' }} /><span><b>MIGRATING</b><small>Near migration threshold ($70K-$100K)</small></span><strong style={{ color: '#c981ff' }}>{outcomes.migrating}</strong></div>
            <div><i style={{ background: '#54f5cf' }} /><span><b>ACTIVE</b><small>Migrated to PumpSwap ({'> $100K'})</small></span><strong style={{ color: '#54f5cf' }}>{outcomes.active}</strong></div>
          </div>
        </div>
      </div>

      <div className="history-core-grid">
        {/* Narrative Leaderboard */}
        <div className="history-panel history-narratives">
          <div className="history-panel__head"><span>D3 / NARRATIVE LEADERBOARD</span><b>TOP THEMES</b></div>
          <div className="history-narratives__list">
            {narrativeStats.map((n, i) => (
              <div key={n.name} className="history-narratives__item" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="history-narratives__rank">#{i + 1}</span>
                <div className="history-narratives__info">
                  <strong>{n.name} {n.isLive ? <span style={{ fontSize: 6, color: '#00f5d4', marginLeft: 4 }}>LIVE</span> : ''}</strong>
                  <small>{n.tokens} tokens / {usd(n.volume)} vol</small>
                </div>
                <div className="history-narratives__heat">
                  <span className="history-narratives__heat-bar" style={{ width: `${n.heat}%` }} />
                  <span className="history-narratives__heat-label">{n.heat}</span>
                </div>
                <span className={n.velocity?.includes('-') ? 'is-down' : 'is-up'}>{n.velocity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liquidity Flow */}
        <div className="history-panel history-flow">
          <div className="history-panel__head"><span>D4 / LIQUIDITY FLOW TRACKER</span><b>{walletFlows.length} MOVES</b></div>
          <div className="history-flow__list">
            {walletFlows.map((flow, i) => (
              <div key={flow.id || i} className={`history-flow__item ${flow.type}`} style={{ animationDelay: `${i * 80}ms` }}>
                <span className={`history-flow__arrow ${flow.type}`}>{flow.type === 'inflow' ? '->' : '<-'}</span>
                <span className="history-flow__wallet">{flow.from} {flow.isLive ? <span style={{ fontSize: 5, color: '#00f5d4' }}>LIVE</span> : ''}</span>
                <span className="history-flow__token">{flow.to}</span>
                <span className="history-flow__amount">{flow.amount}</span>
                <span className="history-flow__time">{flow.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Timeline */}
      <div className="history-panel history-timeline">
        <div className="history-panel__head"><span>D5 / LIVE EVENT TIMELINE</span><b>{events.length} EVENTS / {stats.perMinute}/MIN</b></div>
        <div className="history-timeline__grid">
          {events.slice(0, 15).map((event) => (
            <div key={event.id} className={`history-timeline__item ${event.direction}`} style={{ animationDelay: '0ms' }}>
              <div className="history-timeline__time">
                <Radio size={11} />
                <time>{event.time}</time>
              </div>
              <div>
                <strong>${event.symbol}</strong>
                <small>{event.narrative} / {event.type === 'launch' ? 'CREATED' : 'MIGRATED'}</small>
              </div>
              <span className={event.direction === 'up' ? 'is-up' : 'is-down'}>{event.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}