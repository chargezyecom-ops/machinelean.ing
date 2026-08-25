import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowUpRight, Clock, ExternalLink, Flame, Layers, TrendingUp, Users, Wallet, Zap } from 'lucide-react'
import { signed, usd, shortAddress, formatPrice, tokenAge, tokenState } from '../lib/format.js'

function generateMockTxs(symbol, count = 12) {
  const txs = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.45
    const amount = isBuy ? (Math.random() * 50 + 0.5) : (Math.random() * 30 + 0.3)
    txs.push({
      id: `tx-${i}`, type: isBuy ? 'buy' : 'sell', amount,
      wallet: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
      time: new Date(now - i * (Math.random() * 60000 + 5000)).toISOString().slice(11, 19),
    })
  }
  return txs
}

function generateMockHolders() {
  const total = Math.floor(200 + Math.random() * 800)
  const top1 = 5 + Math.random() * 25
  const top5 = top1 + 10 + Math.random() * 20
  const top10 = top5 + 5 + Math.random() * 15
  return {
    total, top1Pct: Math.round(top1 * 10) / 10, top5Pct: Math.round(top5 * 10) / 10, top10Pct: Math.round(top10 * 10) / 10,
    slices: [
      { label: 'Top 1', pct: top1, color: '#ff6b6b' },
      { label: 'Top 5', pct: top5 - top1, color: '#fb923c' },
      { label: 'Top 10', pct: top10 - top5, color: '#ffd93d' },
      { label: 'Rest', pct: 100 - top10, color: '#00f5d4' },
    ],
  }
}

function Sparkline({ data, color = '#00f5d4', height = 32, width = 120 }) {
  if (!data?.length) return null
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ')
  return (
    <svg width={width} height={height} className="token-detail__spark">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${points} ${width},${height}`} fill={`${color}11`} stroke="none" />
    </svg>
  )
}

function TxPressure({ buys, sells }) {
  const total = buys + sells || 1
  const buyPct = (buys / total) * 100
  return (
    <div className="token-detail__pressure">
      <div className="token-detail__pressure-bar">
        <div style={{ width: `${buyPct}%`, background: '#00f5d4' }} />
        <div style={{ width: `${100 - buyPct}%`, background: '#ff5555' }} />
      </div>
      <div className="token-detail__pressure-labels">
        <span style={{ color: '#00f5d4' }}>{buys} BUYS</span>
        <span style={{ color: '#ff5555' }}>{sells} SELLS</span>
      </div>
    </div>
  )
}

export default function TokenDetail({ token }) {
  const [livePrice, setLivePrice] = useState(token?.market?.price || 0)
  const [liveMcap, setLiveMcap] = useState(token?.market?.marketCap || 0)
  const market = token?.market
  const mockTxs = useMemo(() => generateMockTxs(market?.symbol), [market?.symbol])
  const mockHolders = useMemo(() => generateMockHolders(), [])
  const sparkData = useMemo(() => {
    const base = market?.price || 1
    return Array.from({ length: 24 }, (_, i) => base * (1 + (Math.sin(i * 0.5) * 0.1 + (Math.random() - 0.5) * 0.05)))
  }, [market?.price])

  useEffect(() => {
    if (!token?.market?.price) return
    const base = token.market.price
    const iv = setInterval(() => {
      const drift = (Math.random() - 0.48) * base * 0.003
      setLivePrice((p) => Math.max(0, p + drift))
      setLiveMcap((m) => Math.max(0, m + drift * 1000000))
    }, 2000)
    return () => clearInterval(iv)
  }, [token?.market?.price])

  if (!token) return null
  const change1h = market?.change1h || 0
  const state = tokenState(market)

  return (
    <div className="token-detail">
      <div className="token-detail__header">
        <div className="token-detail__identity">
          {market?.icon && <img src={market.icon} alt="" className="token-detail__icon" onError={(e) => { e.target.style.display = 'none' }} />}
          <div>
            <div className="token-detail__symbol">${market?.symbol || token.symbol}</div>
            <div className="token-detail__name">{market?.name || token.name}</div>
          </div>
        </div>
        <div className="token-detail__state" style={{ '--state-color': state === 'BONDING' ? '#ffd93d' : state === 'PUMPSWAP' ? '#00f5d4' : '#c084fc' }}>{state}</div>
      </div>
      <div className="token-detail__price-section">
        <div className="token-detail__price">
          <span className={change1h >= 0 ? 'is-up' : 'is-down'}>{formatPrice(livePrice)}</span>
          <small className={change1h >= 0 ? 'is-up' : 'is-down'}>{signed(change1h)} / 1H</small>
        </div>
        <Sparkline data={sparkData} color={change1h >= 0 ? '#00f5d4' : '#ff5555'} />
      </div>
      <div className="token-detail__metrics">
        <div className="token-detail__metric"><Layers size={12} /><span>MARKET CAP</span><strong>{usd(liveMcap)}</strong></div>
        <div className="token-detail__metric"><Activity size={12} /><span>LIQUIDITY</span><strong>{usd(market?.liquidity)}</strong></div>
        <div className="token-detail__metric"><Zap size={12} /><span>VOLUME 1H</span><strong>{usd(market?.volume1h)}</strong></div>
        <div className="token-detail__metric"><Flame size={12} /><span>VOLUME 24H</span><strong>{usd(market?.volume24h)}</strong></div>
      </div>
      <div className="token-detail__changes">
        {['5M','1H','6H','24H'].map((label) => {
          const val = market?.[`change${label.toLowerCase()}`] || 0
          return <div key={label} className={val >= 0 ? 'is-up' : 'is-down'}><span>{label}</span><strong>{signed(val)}</strong></div>
        })}
      </div>
      <div className="token-detail__section">
        <div className="token-detail__section-head"><Activity size={12} /> TX PRESSURE</div>
        <TxPressure buys={market?.buys1h || 150} sells={market?.sells1h || 120} />
      </div>
      <div className="token-detail__section">
        <div className="token-detail__section-head"><ArrowUpRight size={12} /> RECENT TRANSACTIONS</div>
        <div className="token-detail__txs">
          {mockTxs.slice(0, 8).map((tx) => (
            <div key={tx.id} className="token-detail__tx">
              <span className={`token-detail__tx-type ${tx.type}`}>{tx.type === 'buy' ? '+' : '-'}</span>
              <span className="token-detail__tx-amount">{tx.amount.toFixed(1)}K</span>
              <span className="token-detail__tx-wallet">{tx.wallet}</span>
              <span className="token-detail__tx-time">{tx.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="token-detail__section">
        <div className="token-detail__section-head"><Users size={12} /> HOLDER DISTRIBUTION</div>
        <div className="token-detail__holders">
          <div className="token-detail__holders-chart">
            {mockHolders.slices.map((h, i) => (
              <div key={i} className="token-detail__holders-slice" style={{ '--size': `${h.pct}%`, '--color': h.color }}>
                <span style={{ color: h.color }}>{h.label}</span>
                <strong style={{ color: h.color }}>{h.pct.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
          <div className="token-detail__holders-stats">
            <span>Total holders: <strong>{mockHolders.total}</strong></span>
            <span>Top 1: <strong>{mockHolders.top1Pct}%</strong></span>
            <span>Top 5: <strong>{mockHolders.top5Pct}%</strong></span>
          </div>
        </div>
      </div>
      <div className="token-detail__footer">
        <span><Clock size={11} /> {tokenAge(market?.pairCreatedAt || (token.timestamp ? token.timestamp * 1000 : null))}</span>
        <span><Wallet size={11} /> {shortAddress(token.mint)}</span>
        {market?.url && <a href={market.url} target="_blank" rel="noreferrer"><ExternalLink size={11} /> DEXSCREENER</a>}
      </div>
    </div>
  )
}
