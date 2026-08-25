import { useEffect, useRef, useState } from 'react'
import { AreaSeries, ColorType, createChart } from 'lightweight-charts'
import { Activity, ArrowDownRight, ArrowUpRight, ExternalLink, Link2, MessageCircle, Network, Radio, ShieldAlert, Waves } from 'lucide-react'
import { fetchTokenSocials, researchApiEnabled } from '../services/researchApi.js'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const usd = (value) => `$${compact.format(Number(value) || 0)}`
const signed = (value) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`

function LiquidityChart({ points }) {
  const containerRef = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    if (import.meta.env.MODE === 'test' || !containerRef.current) return undefined
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { type: ColorType.Solid, color: '#070a0a' }, textColor: '#687679', fontFamily: 'JetBrains Mono Variable, monospace', fontSize: 9 },
      grid: { vertLines: { color: '#151d1f' }, horzLines: { color: '#151d1f' } },
      rightPriceScale: { borderColor: '#2c3739', scaleMargins: { top: .15, bottom: .12 } },
      timeScale: { borderColor: '#2c3739', timeVisible: true, secondsVisible: true },
      crosshair: { vertLine: { color: '#617376' }, horzLine: { color: '#617376' } },
    })
    seriesRef.current = chart.addSeries(AreaSeries, { lineColor: '#63f6dd', lineWidth: 2, topColor: 'rgba(99,246,221,.27)', bottomColor: 'rgba(99,246,221,.01)', priceLineVisible: true, priceLineColor: '#9effee', lastValueVisible: true })
    const observer = new ResizeObserver((entries) => { const rect = entries[0]?.contentRect; if (rect) chart.resize(rect.width, rect.height) })
    observer.observe(containerRef.current)
    return () => { observer.disconnect(); chart.remove(); seriesRef.current = null }
  }, [])

  useEffect(() => {
    seriesRef.current?.setData(points.filter((point) => point.time && point.liquidity).map((point) => ({ time: point.time, value: point.liquidity })))
  }, [points])

  return <div className="liquidity-chart"><div ref={containerRef} />{points.length < 2 && <span><Radio size={11} /> COLLECTING SESSION SAMPLES</span>}</div>
}

function TransactionRow({ label, buys, sells }) {
  const total = buys + sells
  const buyShare = total ? Math.round(buys / total * 100) : 50
  return <div className="telemetry-tx-row">
    <span>{label}</span><b>{compact.format(total)} TX</b>
    <div><i style={{ width: `${buyShare}%` }} /><em style={{ width: `${100 - buyShare}%` }} /></div>
    <small><span>{compact.format(buys)} BUYS</span><span>{compact.format(sells)} SELLS</span></small>
  </div>
}

export default function MarketTelemetry({ token, narratives, telemetry, liquidityEvents, isLive }) {
  const [social, setSocial] = useState({ status: 'idle', data: null })
  const points = token ? telemetry.get(token.address) || [] : []
  const baseline = points[0]?.liquidity || token?.liquidity || 0
  const currentLiquidity = points[points.length - 1]?.liquidity || token?.liquidity || 0
  const liquidityDelta = currentLiquidity - baseline
  const liquidityDeltaPct = baseline ? liquidityDelta / baseline * 100 : 0
  const selectedEvents = liquidityEvents.filter((event) => event.address === token?.address).slice(0, 3)
  const txWindows = [
    ['5 MIN', token?.buys5m || 0, token?.sells5m || 0],
    ['1 HOUR', token?.buys1h || 0, token?.sells1h || 0],
    ['6 HOURS', token?.buys6h || 0, token?.sells6h || 0],
    ['24 HOURS', token?.buys24 || 0, token?.sells24 || 0],
  ]

  useEffect(() => {
    if (!token?.address || !researchApiEnabled || import.meta.env.MODE === 'test') { setSocial({ status: researchApiEnabled ? 'idle' : 'disabled', data: null }); return undefined }
    const controller = new AbortController()
    setSocial({ status: 'loading', data: null })
    fetchTokenSocials(token.address, token.symbol, controller.signal).then((payload) => setSocial({ status: payload.configured ? 'live' : 'needs-key', data: payload.data })).catch((error) => { if (error.name !== 'AbortError') setSocial({ status: 'error', data: null }) })
    return () => controller.abort()
  }, [token?.address, token?.symbol])

  return <section className="market-telemetry" aria-labelledby="market-telemetry-title">
    <header className="market-telemetry__head">
      <div><span><Waves size={13} /> VERIFIED MARKET TELEMETRY</span><h2 id="market-telemetry-title">Capital, transactions, narrative and social</h2></div>
      <div><span className={isLive ? 'is-live' : ''}><i /> {isLive ? 'MARKET FEED LIVE' : 'FALLBACK MODE'}</span><span>SESSION SAMPLES <b>{points.length}</b></span><span>24H RANK <b>#{token?.trendRank || '—'}</b></span></div>
    </header>
    <div className="market-telemetry__grid">
      <article className="telemetry-panel telemetry-panel--liquidity">
        <header><span><Activity size={12} /> LIQUIDITY ROTATION</span><b>SESSION DELTA</b></header>
        <div className="telemetry-liquidity__quote"><div><span>CURRENT RESERVE</span><strong>{usd(currentLiquidity)}</strong></div><div className={liquidityDelta >= 0 ? 'is-up' : 'is-down'}>{liquidityDelta >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}<strong>{signed(liquidityDeltaPct)}</strong><span>{liquidityDelta >= 0 ? '+' : ''}{usd(liquidityDelta)}</span></div></div>
        <LiquidityChart points={points} />
        <div className="telemetry-liquidity__events">{selectedEvents.length ? selectedEvents.map((event) => <div className={event.kind === 'inflow' ? 'is-up' : 'is-down'} key={event.id}><time>{new Date(event.at).toISOString().slice(11, 19)}</time><span>{event.kind.toUpperCase()}</span><b>{event.deltaUsd >= 0 ? '+' : ''}{usd(event.deltaUsd)}</b></div>) : <p>No material liquidity shift detected since this session started.</p>}</div>
      </article>

      <article className="telemetry-panel telemetry-panel--tx">
        <header><span><ArrowUpRight size={12} /> TRANSACTION PRESSURE</span><b>BUY / SELL</b></header>
        <div className="telemetry-tx-summary"><div><span>24H TRANSACTIONS</span><strong>{compact.format((token?.buys24 || 0) + (token?.sells24 || 0))}</strong></div><div><span>UNIQUE PARTICIPANTS</span><strong>{compact.format((token?.buyers24 || 0) + (token?.sellers24 || 0))}</strong></div></div>
        <div className="telemetry-tx-rows">{txWindows.map(([label, buys, sells]) => <TransactionRow label={label} buys={buys} sells={sells} key={label} />)}</div>
      </article>

      <article className="telemetry-panel telemetry-panel--narrative">
        <header><span><Network size={12} /> NARRATIVE ROTATION</span><b>REAL MARKET AGGREGATE</b></header>
        <div className="telemetry-narratives">{narratives.slice(0, 5).map((item, index) => <div className={item.name === token?.narrative ? 'is-active' : ''} key={item.name}><span>{String(index + 1).padStart(2, '0')}</span><p><strong>{item.name}</strong><small>{item.tokens} TOKENS · {usd(item.volume1h)} / 1H</small></p><b className={item.momentum >= 0 ? 'is-up' : 'is-down'}>{signed(item.momentum)}</b><i style={{ '--share': `${Math.min(100, Math.max(8, item.volume1h / Math.max(narratives[0]?.volume1h || 1, 1) * 100))}%` }} /></div>)}</div>
        <div className="telemetry-narrative__active"><span>SELECTED CLUSTER</span><strong>{token?.narrative || 'UNCLASSIFIED'}</strong><p>Classification is derived from public token metadata. It describes semantic proximity, not ownership or causality.</p></div>
      </article>

      <article className="telemetry-panel telemetry-panel--social">
        <header><span><MessageCircle size={12} /> SOCIAL SURFACE</span><b>{social.status === 'live' ? 'X SEARCH LIVE' : 'DECLARED LINKS'}</b></header>
        <div className="telemetry-sentiment"><div style={{ '--positive': `${token?.sentimentPositive || 0}%` }}><strong>{Math.round(token?.sentimentPositive || 0)}%</strong><span>POSITIVE GT VOTES</span></div><dl><div><dt>SUSPICIOUS REPORTS</dt><dd>{token?.suspiciousReports || 0}</dd></div><div><dt>DECLARED CHANNELS</dt><dd>{token?.socials?.length || 0}</dd></div><div><dt>X MENTIONS</dt><dd>{social.data?.mentions ?? '—'}</dd></div></dl></div>
        <div className="telemetry-social-links">{token?.socials?.length ? token.socials.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.url}><Link2 size={10} /><span>{item.label || item.type}</span><b>{item.type}</b><ExternalLink size={9} /></a>) : <p>No website or social channel is declared in the current market metadata.</p>}</div>
        {social.status === 'needs-key' && <div className="telemetry-social-adapter"><ShieldAlert size={12} /><span><b>X RECENT SEARCH READY</b>Add X_BEARER_TOKEN server-side to activate verified mention and engagement counts.</span></div>}
        {social.status === 'live' && <div className="telemetry-social-live"><span><b>{social.data.mentions}</b> mentions</span><span><b>{compact.format(social.data.engagement)}</b> engagements</span><span><b>{social.data.verifiedAuthors}</b> verified authors</span></div>}
      </article>
    </div>
  </section>
}
