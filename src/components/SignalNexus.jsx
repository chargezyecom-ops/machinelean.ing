import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Brain, ScanLine, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { signed, usd, tokenAge } from '../lib/format.js'
import { generateMockUniverse, generateMockSignal, createSignalStream, spawnNewToken } from '../lib/mockEngine.js'

const CLUSTER_COLORS = [
  '#00f5d4','#ff6b6b','#ffd93d','#c084fc','#60a5fa','#34d399',
  '#fb923c','#f472b6','#a78bfa','#2dd4bf','#f87171','#a3e635',
  '#38bdf8','#e879f9','#fbbf24','#4ade80','#f43f5e','#818cf8',
]
const cc = (i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length]

function computeML(t) {
  const now = Date.now()
  const age = t.pairCreatedAt ? (now - t.pairCreatedAt) / 60000 : 999
  const vol = t.volume1h || 0
  const ch = t.change1h || 0
  const liq = t.liquidity || 0
  const vel = Math.min(100, Math.abs(ch) * 2.5)
  const volS = Math.min(100, Math.log10(Math.max(vol, 1)) * 12)
  const rec = Math.max(0, 100 - age * 1.5)
  const fomo = Math.round(vel * 0.35 + volS * 0.3 + rec * 0.2 + Math.min(50, 100 - age * 0.8) * 0.15)
  const risk = Math.round(Math.max(0, 100 - Math.log10(Math.max(liq, 1)) * 15) * 0.35 + Math.min(100, Math.abs(ch) * 1.8) * 0.35 + (age < 5 ? 70 : age < 30 ? 40 : 15) * 0.3)
  const pump = Math.min(98, Math.max(5, Math.round(fomo * 0.5 + (100 - risk) * 0.3 + volS * 0.2 + (ch > 50 ? 20 : ch > 20 ? 12 : ch > 10 ? 6 : 0) + (age < 10 ? 8 : age < 60 ? 4 : 0) + (Math.random() - 0.5) * 6)))
  const momentum = ch > 80 ? 'EXPLOSIVE' : ch > 40 ? 'SURGING' : ch > 15 ? 'ACCELERATING' : ch > 5 ? 'RISING' : ch > -5 ? 'STABLE' : ch > -20 ? 'COOLING' : 'DECLINING'
  return { fomo, risk, pump, momentum }
}

// ---------- SIGNAL ARROW ----------
function SignalArrow({ signal, dims }) {
  const [progress, setProgress] = useState(0)
  const [alive, setAlive] = useState(true)
  useEffect(() => {
    let frame
    const start = performance.now()
    const dur = 1400 + Math.random() * 600
    const animate = (now) => {
      const p = Math.min(1, (now - start) / dur)
      setProgress(p)
      if (p < 1) frame = requestAnimationFrame(animate)
      else setAlive(false)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])
  if (!alive) return null
  const isBuy = signal.type === 'buy'
  const color = isBuy ? '#00f5d4' : '#ff5555'
  const label = signal.sol + ' SOL'
  const size = signal.sol >= 20 ? 16 : signal.sol >= 10 ? 12 : 9
  const edgeAngle = (signal._seed || 0) * Math.PI * 2
  const edgeR = Math.max(dims.w, dims.h) * 0.52
  const sx = dims.w / 2 + Math.cos(edgeAngle) * edgeR
  const sy = dims.h / 2 + Math.sin(edgeAngle) * edgeR
  const ex = dims.w / 2 + Math.cos(edgeAngle) * dims.w * 0.12
  const ey = dims.h / 2 + Math.sin(edgeAngle) * dims.h * 0.12
  const x = sx + (ex - sx) * progress
  const y = sy + (ey - sy) * progress
  const opacity = progress < 0.1 ? progress * 10 : progress > 0.65 ? (1 - progress) / 0.35 : 1
  const angle = Math.atan2(ey - sy, ex - sx)
  return (
    <g opacity={opacity * 0.85} style={{ pointerEvents: 'none' }}>
      <line x1={sx + (x - sx) * 0.4} y1={sy + (y - sy) * 0.4} x2={x} y2={y}
        stroke={color} strokeWidth={size * 0.25} opacity={0.5} strokeLinecap="round" />
      <polygon
        points={`${x + Math.cos(angle) * size},${y + Math.sin(angle) * size} ${x + Math.cos(angle + 2.4) * size * 0.55},${y + Math.sin(angle + 2.4) * size * 0.55} ${x + Math.cos(angle - 2.4) * size * 0.55},${y + Math.sin(angle - 2.4) * size * 0.55}`}
        fill={color} opacity={0.9} />
      <rect x={x - 20} y={y - 16} width={40} height={14} rx={3} fill={isBuy ? '#0a1a14' : '#1a0a0a'} stroke={color} strokeWidth={0.8} />
      <text x={x} y={y - 7} fill={color} fontSize={6} fontWeight="800" fontFamily="'JetBrains Mono Variable',monospace" textAnchor="middle" dominantBaseline="central">
        {isBuy ? 'BUY' : 'SELL'} {label}
      </text>
    </g>
  )
}

// ---------- TOKEN BUBBLE ----------
function Bubble({ node, sel, hov, onSelect, onHover }) {
  const ml = node.ml
  const col = node.col
  const isHot = ml.pump > 70
  const isUp = node.change >= 0
  return (
    <g style={{ cursor: 'pointer' }}
      onClick={() => onSelect(node.address)}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}>
      {isHot && <circle cx={node.x} cy={node.y} r={node.r + 10} fill={col} opacity={0.07} filter="url(#glow)" />}
      {sel && <circle cx={node.x} cy={node.y} r={node.r + 5} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.45} strokeDasharray="3 3" />}
      {hov && !sel && <circle cx={node.x} cy={node.y} r={node.r + 3} fill="none" stroke={col} strokeWidth={0.8} opacity={0.4} />}
      {ml.pump > 60 && <circle cx={node.x} cy={node.y} r={node.r + 2} fill="none" stroke={col} strokeWidth={0.5} opacity={0.3} className="signal-nexus__pump-ring" />}
      <circle cx={node.x} cy={node.y} r={node.r} fill={col + '18'} stroke={col} strokeWidth={sel ? 2.2 : hov ? 1.6 : 0.8} className={isHot ? 'signal-nexus__token--hot' : ''} />
      {node.icon ? (
        <>
          <clipPath id={'c' + node.id}><circle cx={node.x} cy={node.y} r={node.r * 0.62} /></clipPath>
          <image href={node.icon} x={node.x - node.r * 0.62} y={node.y - node.r * 0.62} width={node.r * 1.24} height={node.r * 1.24} clipPath={'url(#c' + node.id + ')'} opacity={0.85} />
        </>
      ) : (
        <text x={node.x} y={node.y + 1} fill={col} fontSize={Math.max(4, Math.min(9, node.r * 0.38))} fontWeight="700"
          fontFamily="'JetBrains Mono Variable',monospace" textAnchor="middle" dominantBaseline="central">
          {node.symbol.slice(0, 5)}
        </text>
      )}
      {node.r > 10 && (
        <g>
          <circle cx={node.x + node.r - 1} cy={node.y - node.r + 1} r={5.5} fill="#080b0a" stroke={col} strokeWidth={0.5} />
          <text x={node.x + node.r - 1} y={node.y - node.r + 1.5} fill={col} fontSize={4.5} fontWeight="800"
            fontFamily="'JetBrains Mono Variable',monospace" textAnchor="middle" dominantBaseline="central">{ml.pump}</text>
        </g>
      )}
      {node.r > 8 && (
        <text x={node.x} y={node.y + node.r + 7} fill={isUp ? '#00f5d4' : '#ff5555'}
          fontSize={4.5} fontWeight="600" fontFamily="'JetBrains Mono Variable',monospace"
          textAnchor="middle" opacity={hov || sel ? 1 : 0.45}>{signed(node.change)}</text>
      )}
    </g>
  )
}

// ---------- TOOLTIP ----------
function Tip({ node }) {
  if (!node) return null
  const ml = node.ml
  const pc = ml.pump > 70 ? '#00f5d4' : ml.pump > 40 ? '#ffd93d' : '#ff6b6b'
  return (
    <div className="nexus-tooltip" style={{ borderColor: pc + '44' }}>
      <div className="nexus-tooltip__head">
        {node.icon && <img src={node.icon} alt="" className="nexus-tooltip__icon" onError={e => { e.target.style.display = 'none' }} />}
        <div><strong style={{ color: pc }}>${node.symbol}</strong><span>{node.name}</span></div>
      </div>
      <div className="nexus-tooltip__body">
        <div className="nexus-tooltip__row"><span>Market Cap</span><strong>{usd(node.marketCap)}</strong></div>
        <div className="nexus-tooltip__row"><span>Liquidity</span><strong>{usd(node.liquidity)}</strong></div>
        <div className="nexus-tooltip__row"><span>Volume 1H</span><strong>{usd(node.volume1h)}</strong></div>
        <div className="nexus-tooltip__row"><span>Age</span><strong>{tokenAge(node.pairCreatedAt)}</strong></div>
        <div className="nexus-tooltip__ml">
          <div><span>PUMP</span><strong style={{ color: pc }}>{ml.pump}</strong></div>
          <div><span>FOMO</span><strong>{ml.fomo}</strong></div>
          <div><span>RISK</span><strong style={{ color: ml.risk > 60 ? '#ff5555' : '#c8e6d0' }}>{ml.risk}</strong></div>
        </div>
        <div className="nexus-tooltip__momentum" style={{ background: pc + '22', color: pc }}>{ml.momentum}</div>
        <div className="nexus-tooltip__changes"><span className={node.change >= 0 ? 'is-up' : 'is-down'}>{signed(node.change)}</span></div>
      </div>
    </div>
  )
}

// ---------- ML PREDICTIONS ----------
function MLPreds({ tokens }) {
  const top = useMemo(() => tokens.filter(t => t.ml.pump > 55).sort((a, b) => b._ml.pump - a._ml.pump).slice(0, 6), [tokens])
  if (!top.length) return null
  return (
    <div className="signal-nexus__predictions">
      <div className="signal-nexus__predictions-head">
        <Brain size={14} /><span>ML PUMP PREDICTIONS</span>
        <span className="signal-nexus__predictions-live"><i className="is-live" /> SCANNING</span>
      </div>
      <div className="signal-nexus__predictions-list">
        {top.map((t, i) => {
          const c = t.ml.pump > 70 ? '#00f5d4' : t.ml.pump > 55 ? '#ffd93d' : '#c084fc'
          return (
            <div key={t.address} className="signal-nexus__prediction" style={{ '--delay': i * 50 + 'ms' }}>
              <span className="signal-nexus__prediction-rank" style={{ color: c }}>#{i + 1}</span>
              <div className="signal-nexus__prediction-info">
                {t.icon ? <img src={t.icon} alt="" className="signal-nexus__prediction-icon" onError={e => { e.target.style.display = 'none' }} /> : <span className="signal-nexus__prediction-icon-fallback">{t.symbol?.slice(0, 2)}</span>}
                <div><strong>${t.symbol}</strong><span>{t.name?.slice(0, 16)}</span></div>
              </div>
              <div className="signal-nexus__prediction-scores">
                <div className="signal-nexus__prediction-score" style={{ '--color': c }}><span>PUMP</span><strong>{t.ml.pump}</strong></div>
                <div className="signal-nexus__prediction-score" style={{ '--color': '#c084fc' }}><span>FOMO</span><strong>{t.ml.fomo}</strong></div>
              </div>
              <span className={'signal-nexus__prediction-momentum' + (t.ml.pump > 70 ? ' is-hot' : '')}>{t.ml.momentum}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- MAIN ----------
export default function SignalNexus({ liveTokens = [], clusters = [], narrativeLabels = [], launches = [], selectedAddress, onSelectToken }) {
  const svgRef = useRef(null)
  const [dims, setDims] = useState({ w: 900, h: 500 })
  const [hover, setHover] = useState(null)
  const [filter, setFilter] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const [signals, setSignals] = useState([])
  const [mockData, setMockData] = useState(() => generateMockUniverse())
  const [popping, setPopping] = useState({})
  const [simPositions, setSimPositions] = useState({})
  const simRef = useRef(null)
  const frameRef = useRef(null)

  // Resize
  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const obs = new ResizeObserver(e => { const r = e[0]?.contentRect; if (r) setDims({ w: r.width, h: Math.max(400, Math.min(580, r.width * 0.54)) }) })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Build enriched token list
  const enriched = useMemo(() => {
    const live = liveTokens.slice(0, 20).map(t => ({
      address: t.address, symbol: t.symbol, name: t.name,
      narrative: t.narrative || '', change1h: t.change1h || 0,
      volume1h: t.volume1h || 0, liquidity: t.liquidity || 0, marketCap: t.marketCap || 0,
      pairCreatedAt: t.pairCreatedAt, icon: t.icon || '', isLive: true,
    }))
    return [...live, ...mockData.tokens]
  }, [liveTokens, mockData])

  const narratives = useMemo(() => {
    const live = narrativeLabels.length ? narrativeLabels : []
    return [...live, ...mockData.narratives]
  }, [narrativeLabels, mockData])

  // Cluster center positions
  const clusterPos = useMemo(() => {
    const cx = dims.w / 2, cy = dims.h / 2
    const active = narratives.filter(c => c.topTokens?.length > 0 || c.tokens > 0)
    const map = {}
    active.forEach((cl, i) => {
      const a = (i / Math.max(active.length, 1)) * Math.PI * 2 - Math.PI / 2
      const r = Math.min(dims.w, dims.h) * 0.28
      map[cl.name] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, col: cc(i) }
    })
    return map
  }, [narratives, dims])

  // Initialize physics simulation ONCE
  useEffect(() => {
    const nodes = enriched.map((t, i) => {
      const ml = computeML(t)
      const vol = t.volume1h || 0
      let r = Math.max(7, Math.min(28, 7 + Math.log10(Math.max(vol, 1)) * 3.8))
      if (ml.pump > 70) r += 3
      const cp = clusterPos[t.narrative] || { x: dims.w / 2, y: dims.h / 2, col: '#60766b' }
      const a = (i / Math.max(enriched.length, 1)) * Math.PI * 2
      const cr = 20 + (i % 4) * 14
      return {
        id: t.address, address: t.address, symbol: t.symbol, name: t.name,
        narrative: t.narrative, change: t.change1h, volume1h: t.volume1h,
        liquidity: t.liquidity, marketCap: t.marketCap, pairCreatedAt: t.pairCreatedAt,
        icon: t.icon, _ml: ml, ml, col: cp.col, r,
        x: cp.x + Math.cos(a) * cr, y: cp.y + Math.sin(a) * cr,
        vx: 0, vy: 0,
      }
    })
    simRef.current = nodes
  }, [enriched, clusterPos, dims])

  // Physics tick loop
  useEffect(() => {
    let running = true
    const tick = () => {
      if (!running) return
      const nodes = simRef.current
      if (!nodes || !nodes.length) { frameRef.current = requestAnimationFrame(tick); return }
      const cx = dims.w / 2, cy = dims.h / 2
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const cp = clusterPos[n.narrative]
        // Center gravity
        n.vx += (cx - n.x) * 0.0003
        n.vy += (cy - n.y) * 0.0003
        // Cluster gravity
        if (cp) {
          n.vx += (cp.x - n.x) * 0.006
          n.vy += (cp.y - n.y) * 0.006
        }
        // Repulsion from other nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const o = nodes[j]
          const dx = o.x - n.x, dy = o.y - n.y
          const d2 = dx * dx + dy * dy || 1
          const minD = (n.r + o.r) * 1.6
          if (d2 < minD * minD * 4) {
            const d = Math.sqrt(d2)
            const f = Math.min(3, (minD / d) * 0.4)
            const fx = (dx / d) * f, fy = (dy / d) * f
            n.vx -= fx; n.vy -= fy
            o.vx += fx; o.vy += fy
          }
        }
        // Damping
        n.vx *= 0.94; n.vy *= 0.94
        n.x += n.vx; n.y += n.vy
        // Boundary
        const m = 40
        if (n.x < m) n.vx += 0.8
        if (n.x > dims.w - m) n.vx -= 0.8
        if (n.y < m) n.vy += 0.8
        if (n.y > dims.h - m) n.vy -= 0.8
      }
      // Copy positions to state (throttled to ~30fps)
      const pos = {}
      for (const n of nodes) pos[n.id] = { x: n.x, y: n.y, vx: n.vx, vy: n.vy }
      setSimPositions(pos)
      frameRef.current = setTimeout(() => requestAnimationFrame(tick), 33)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(frameRef.current); clearTimeout(frameRef.current) }
  }, [dims, clusterPos])

  // Merge simulated positions into enriched tokens for rendering
  const nodes = useMemo(() => {
    return enriched.map((t, i) => {
      const ml = computeML(t)
      const vol = t.volume1h || 0
      let r = Math.max(7, Math.min(28, 7 + Math.log10(Math.max(vol, 1)) * 3.8))
      if (ml.pump > 70) r += 3
      const cp = clusterPos[t.narrative] || { x: dims.w / 2, y: dims.h / 2, col: '#60766b' }
      const sp = simPositions[t.address]
      const a = (i / Math.max(enriched.length, 1)) * Math.PI * 2
      const cr = 20 + (i % 4) * 14
      return {
        id: t.address, address: t.address, symbol: t.symbol, name: t.name,
        narrative: t.narrative, change: t.change1h, volume1h: t.volume1h,
        liquidity: t.liquidity, marketCap: t.marketCap, pairCreatedAt: t.pairCreatedAt,
        icon: t.icon, _ml: ml, ml, col: cp.col, r,
        x: sp ? sp.x : cp.x + Math.cos(a) * cr,
        y: sp ? sp.y : cp.y + Math.sin(a) * cr,
      }
    })
  }, [enriched, clusterPos, simPositions, dims])

  // Signals
  useEffect(() => {
    if (!enriched.length) return
    return createSignalStream(enriched, (sig) => {
      sig._seed = Math.random()
      setSignals(prev => [...prev.slice(-12), sig])
    }, 2500)
  }, [enriched.length > 0])

  // Spawn new tokens
  useEffect(() => {
    const iv = setInterval(() => {
      const result = spawnNewToken(narratives)
      if (result) {
        setMockData(prev => ({ tokens: [...prev.tokens, result.token], narratives: result.isNew ? [...prev.narratives, result.narrative] : prev.narratives }))
        setPopping(prev => ({ ...prev, [result.token.address]: true }))
        setTimeout(() => setPopping(prev => { const c = { ...prev }; delete c[result.token.address]; return c }), 1500)
      }
    }, 5000 + Math.random() * 6000)
    return () => clearInterval(iv)
  }, [narratives.length])

  // Filter
  const visible = filter
    ? nodes.filter(n => {
      if (filter === 'HOT') return n.ml.pump > 70
      return n.narrative === filter
    })
    : nodes

  const hovered = hover ? nodes.find(n => n.address === hover) : null

  // Zoom/pan
  const onWheel = useCallback(e => { e.preventDefault(); setZoom(z => Math.max(0.4, Math.min(3, z + (e.deltaY > 0 ? -0.08 : 0.08)))) }, [])
  const onMouseDown = useCallback(e => { dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; setDragging(true) }, [pan])
  const onMouseMove = useCallback(e => { if (!dragging || !dragRef.current) return; setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y }) }, [dragging])
  const onMouseUp = useCallback(() => { setDragging(false); dragRef.current = null }, [])
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  return (
    <section className="signal-nexus" id="signal-nexus">
      <div className="signal-nexus__head">
        <div>
          <span><ScanLine size={13} /> mlearn.ing / NARRATIVE TOPOLOGY</span>
          <h2 id="signal-nexus-title">Real-time pump.fun token clustering with ML predictions</h2>
        </div>
        <div className="signal-nexus__head-stats">
          <span><i className="is-live" /> {nodes.length} TOKENS</span>
          <span>{nodes.filter(n => n.ml.pump > 70).length} HOT</span>
          <span>{signals.length} SIGNALS</span>
        </div>
      </div>
      <div className="signal-nexus__filters">
        <button className={'signal-nexus__filter' + (!filter ? ' is-active' : '')} type="button" onClick={() => setFilter('')}>ALL</button>
        <button className={'signal-nexus__filter' + (filter === 'HOT' ? ' is-active' : '')} type="button" style={{ '--fc': '#00f5d4' }} onClick={() => setFilter(filter === 'HOT' ? '' : 'HOT')}>
          <span className="signal-nexus__filter-dot" style={{ background: '#00f5d4' }} />HOT
        </button>
        {narratives.slice(0, 6).map((n, i) => (
          <button key={n.name} className={'signal-nexus__filter' + (filter === n.name ? ' is-active' : '')} type="button" style={{ '--fc': cc(i) }} onClick={() => setFilter(filter === n.name ? '' : n.name)}>
            <span className="signal-nexus__filter-dot" style={{ background: cc(i) }} />{n.name?.slice(0, 14)}
          </button>
        ))}
      </div>
      <div className="signal-nexus__canvas" onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
        <svg ref={svgRef} viewBox={'0 0 ' + dims.w + ' ' + dims.h} className="signal-nexus__svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="5" /></filter>
            <radialGradient id="cglow"><stop offset="0%" stopColor="#00f5d4" stopOpacity="0.08" /><stop offset="100%" stopColor="#00f5d4" stopOpacity="0" /></radialGradient>
          </defs>
          <g transform={'translate(' + pan.x / zoom + ',' + pan.y / zoom + ') scale(' + zoom + ')'} style={{ transformOrigin: dims.w / 2 + 'px ' + dims.h / 2 + 'px' }}>
            <circle cx={dims.w / 2} cy={dims.h / 2} r={120} fill="url(#cglow)" opacity={0.6} />
            {Object.entries(clusterPos).map(([name, c]) => {
              const cl = narratives.find(n => n.name === name)
              const cnt = cl?.topTokens?.length || cl?.tokens || 1
              const r = Math.max(45, cnt * 12 + 35)
              return (
                <g key={name} opacity={0.12}>
                  <circle cx={c.x} cy={c.y} r={r} fill={c.col} opacity={0.05} />
                  <circle cx={c.x} cy={c.y} r={r} fill="none" stroke={c.col} strokeWidth={0.4} strokeDasharray="4 4" opacity={0.25} />
                  <text x={c.x} y={c.y - r - 6} fill={c.col} fontSize={6} fontWeight="700" fontFamily="'JetBrains Mono Variable',monospace" textAnchor="middle" opacity={0.7}>{name?.slice(0, 18)} ({cnt})</text>
                </g>
              )
            })}
            {Object.entries(clusterPos).map(([name, c]) => {
              const cn = visible.filter(n => n.narrative === name)
              if (cn.length < 2) return null
              const lines = []
              cn.forEach(n => lines.push(<line key={'l' + name + n.id} x1={n.x} y1={n.y} x2={c.x} y2={c.y} stroke={c.col} strokeWidth={0.3} opacity={0.1} />))
              const top = [...cn].sort((a, b) => b.ml.pump - a.ml.pump).slice(0, 2)
              for (let i = 0; i < top.length - 1; i++) lines.push(<line key={'cl' + name + i} x1={top[i].x} y1={top[i].y} x2={top[i + 1].x} y2={top[i + 1].y} stroke={c.col} strokeWidth={0.4} opacity={0.18} />)
              return <g key={'lines' + name}>{lines}</g>
            })}
            {signals.map(sig => <SignalArrow key={sig.id} signal={sig} dims={dims} />)}
            {visible.map(n => <Bubble key={n.id} node={n} sel={n.address === selectedAddress} hov={hover === n.address} onSelect={onSelectToken} onHover={nd => setHover(nd?.address || null)} />)}
          </g>
        </svg>
        <Tip node={hovered} />
        <div className="signal-nexus__zoom">
          <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.2))}><ZoomIn size={12} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}><ZoomOut size={12} /></button>
          <button type="button" onClick={resetView}><Maximize2 size={12} /></button>
        </div>
        <div className="signal-nexus__legend">
          <span><i style={{ background: '#00f5d4' }} /> HOT</span>
          <span><i style={{ background: '#ffd93d' }} /> WARM</span>
          <span><i style={{ background: '#ff6b6b' }} /> COLD</span>
          <span><i style={{ background: '#00f5d4', clipPath: 'polygon(50% 0,0 100%,100% 100%)' }} /> BUY</span>
          <span><i style={{ background: '#ff5555', clipPath: 'polygon(50% 100%,0 0,100% 0)' }} /> SELL</span>
          <span>SCROLL TO ZOOM / DRAG TO PAN</span>
        </div>
      </div>
      <MLPreds tokens={nodes} />
      <div className="signal-nexus__cards">
        {narratives.slice(0, 8).map((n, i) => {
          const color = cc(i)
          return (
            <button key={n.name} className={'signal-nexus__card' + (filter === n.name ? ' is-active' : '')} type="button" style={{ '--card-color': color, '--card-glow': color + '22' }} onClick={() => setFilter(filter === n.name ? '' : n.name)}>
              <div className="signal-nexus__card-head"><span className="signal-nexus__card-dot" style={{ background: color }} /><strong>{n.name?.slice(0, 14)}</strong></div>
              <div className="signal-nexus__card-body"><span>{n.tokens} tokens</span><span className={n.momentum >= 0 ? 'is-up' : 'is-down'}>{signed(n.momentum)}</span></div>
              <div className="signal-nexus__card-vol">{usd(n.volume1h)}</div>
              <i className="signal-nexus__card-bar" style={{ width: Math.min(100, n.confidence * 100) + '%', background: color }} />
            </button>
          )
        })}
      </div>
    </section>
  )
}