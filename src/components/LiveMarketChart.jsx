import { useEffect, useRef, useState } from 'react'
import { CandlestickSeries, ColorType, CrosshairMode, createChart, HistogramSeries } from 'lightweight-charts'
import { Activity, ExternalLink, Radio } from 'lucide-react'
import { fetchPoolOhlcv } from '../services/marketHistoryService.js'

const horizons = ['1H', '6H', '24H']
import { compact, signed } from '../lib/format.js'

function formatPrice(value) {
  const price = Number(value || 0)
  if (!price) return '$0.00'
  if (price >= 1) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
  if (price >= .001) return `$${price.toFixed(6)}`
  return `$${price.toPrecision(5)}`
}

export default function LiveMarketChart({ token }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const lastCandleRef = useRef(null)
  const aggregateSecondsRef = useRef(300)
  const [horizon, setHorizon] = useState('24H')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [legend, setLegend] = useState(null)

  useEffect(() => {
    if (import.meta.env.MODE === 'test' || !containerRef.current) return undefined
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { type: ColorType.Solid, color: '#060909' }, textColor: '#718083', fontFamily: 'JetBrains Mono Variable, monospace', fontSize: 10 },
      grid: { vertLines: { color: '#172022' }, horzLines: { color: '#172022' } },
      crosshair: { mode: CrosshairMode.Magnet, vertLine: { color: '#73898d', labelBackgroundColor: '#263235' }, horzLine: { color: '#73898d', labelBackgroundColor: '#263235' } },
      rightPriceScale: { borderColor: '#2d393b', scaleMargins: { top: .08, bottom: .24 } },
      timeScale: { borderColor: '#2d393b', timeVisible: true, secondsVisible: false, rightOffset: 2, barSpacing: 6, minBarSpacing: 2, fixLeftEdge: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    })
    const candleSeries = chart.addSeries(CandlestickSeries, { upColor: '#54f5cf', downColor: '#ff557c', borderVisible: false, wickUpColor: '#54f5cf', wickDownColor: '#ff557c', priceLineColor: '#b5fff0', lastValueVisible: true, priceLineVisible: true })
    const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '', lastValueVisible: false, priceLineVisible: false })
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: .82, bottom: 0 } })
    chart.subscribeCrosshairMove((param) => {
      const candle = param.seriesData.get(candleSeries)
      setLegend(candle && 'open' in candle ? candle : null)
    })
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) chart.resize(rect.width, rect.height)
    })
    observer.observe(containerRef.current)
    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    return () => { observer.disconnect(); chart.remove(); chartRef.current = null; candleSeriesRef.current = null; volumeSeriesRef.current = null }
  }, [])

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return undefined
    const controller = new AbortController()
    setStatus('loading')
    setError('')
    candleSeriesRef.current?.setData([])
    volumeSeriesRef.current?.setData([])
    fetchPoolOhlcv(token?.pairAddress, horizon, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      candleSeriesRef.current?.setData(result.candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })))
      volumeSeriesRef.current?.setData(result.candles.map(({ time, volume, open, close }) => ({ time, value: volume, color: close >= open ? 'rgba(84,245,207,.28)' : 'rgba(255,85,124,.28)' })))
      lastCandleRef.current = result.candles[result.candles.length - 1]
      aggregateSecondsRef.current = result.aggregateSeconds
      chartRef.current?.timeScale().fitContent()
      setStatus('live')
    }).catch((cause) => {
      if (cause.name !== 'AbortError') { setStatus('error'); setError(cause.message || 'OHLCV feed unavailable') }
    })
    return () => controller.abort()
  }, [horizon, token?.pairAddress])

  useEffect(() => {
    if (status !== 'live' || !token?.price || !lastCandleRef.current) return
    const bucket = Math.floor(Date.now() / 1000 / aggregateSecondsRef.current) * aggregateSecondsRef.current
    const previous = lastCandleRef.current
    const next = bucket === previous.time
      ? { ...previous, high: Math.max(previous.high, token.price), low: Math.min(previous.low, token.price), close: token.price, volume: token.volume5m || previous.volume }
      : { time: bucket, open: previous.close, high: Math.max(previous.close, token.price), low: Math.min(previous.close, token.price), close: token.price, volume: token.volume5m || 0 }
    candleSeriesRef.current?.update({ time: next.time, open: next.open, high: next.high, low: next.low, close: next.close })
    volumeSeriesRef.current?.update({ time: next.time, value: next.volume, color: next.close >= next.open ? 'rgba(84,245,207,.28)' : 'rgba(255,85,124,.28)' })
    lastCandleRef.current = next
  }, [status, token?.price, token?.volume5m])

  const display = legend || lastCandleRef.current

  return <section className="live-market-chart" aria-labelledby="live-market-chart-title">
    <header className="live-market-chart__head">
      <div className="live-market-chart__identity"><span><Activity size={13} /> LIVE MARKET / #{token?.trendRank || 'â€”'}</span><h2 id="live-market-chart-title">{token?.name || 'Unresolved market'} <em>${token?.symbol || 'â€”'}</em></h2></div>
      <div className="live-market-chart__quote"><strong>{formatPrice(token?.price)}</strong><span className={token?.change24h >= 0 ? 'is-up' : 'is-down'}>{signed(token?.change24h)} / 24H</span></div>
      <div className="live-market-chart__ohlc"><span>O <b>{formatPrice(display?.open)}</b></span><span>H <b>{formatPrice(display?.high)}</b></span><span>L <b>{formatPrice(display?.low)}</b></span><span>C <b>{formatPrice(display?.close)}</b></span></div>
      <div className="live-market-chart__controls">{horizons.map((item) => <button className={horizon === item ? 'is-active' : ''} type="button" onClick={() => setHorizon(item)} key={item}>{item}</button>)}</div>
    </header>
    <div className="live-market-chart__stage">
      <div ref={containerRef} className="live-market-chart__canvas" />
      {status === 'loading' && <div className="live-market-chart__state"><Radio size={14} /> LOADING VERIFIED OHLCVâ€¦</div>}
      {status === 'error' && <div className="live-market-chart__state is-error">{error}</div>}
      {import.meta.env.MODE === 'test' && <div className="live-market-chart__state">VERIFIED OHLCV CHART</div>}
    </div>
    <footer><span><i className={status === 'live' ? 'is-live' : ''} /> {status === 'live' ? 'REAL-TIME UPDATES ACTIVE' : status.toUpperCase()}</span><span>24H VOLUME <b>${compact.format(token?.volume24 || 0)}</b></span><span>POOL <b>{token?.pairAddress ? `${token.pairAddress.slice(0, 5)}â€¦${token.pairAddress.slice(-5)}` : 'â€”'}</b></span><a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">CHARTS BY TRADINGVIEW <ExternalLink size={9} /></a></footer>
  </section>
}

