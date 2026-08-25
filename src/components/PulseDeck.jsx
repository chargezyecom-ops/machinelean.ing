import { Activity, ExternalLink, Radio, ShieldAlert, TrendingUp } from 'lucide-react'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const signed = (value) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(Math.abs(Number(value || 0)) >= 100 ? 0 : 1)}%`
const usd = (value) => `$${compact.format(Number(value) || 0)}`
const shortAddress = (value) => value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '—'

function MarketCard({ token, kind, active, onSelect }) {
  const score = kind === 'risk' ? token.ml.poison : token.ml.fomo
  return <button className={`pulse-card pulse-card--${kind} ${active ? 'is-active' : ''}`} type="button" onClick={() => onSelect(token.address)}>
    <div><span>${token.symbol.slice(0, 9)}</span><em>{token.narrative}</em></div>
    <strong className={token.change5m >= 0 ? 'is-up' : 'is-down'}>{signed(token.change5m)}</strong>
    <dl><div><dt>FLOW</dt><dd>{usd(token.volume1h)}</dd></div><div><dt>{kind === 'risk' ? 'RISK' : 'HYPE'}</dt><dd>{score}</dd></div><div><dt>LIQ.</dt><dd>{usd(token.liquidity)}</dd></div></dl>
    <i className="pulse-card__meter" style={{ '--value': `${score}%` }} />
  </button>
}

export default function PulseDeck({ tokens, launches, selectedAddress, onSelectToken }) {
  const accelerating = [...tokens].sort((a, b) => (b.change5m * .4 + b.ml.velocity * .6) - (a.change5m * .4 + a.ml.velocity * .6)).slice(0, 4)
  const risky = [...tokens].sort((a, b) => b.ml.poison - a.ml.poison).slice(0, 4)

  const selectToken = (address) => {
    onSelectToken(address)
    if (import.meta.env.MODE !== 'test') document.getElementById('signal-nexus')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return <section className="pulse-deck" aria-labelledby="pulse-deck-title">
    <div className="pulse-deck__title">
      <div><Activity size={13} /><span>REAL-TIME TRIAGE</span><h2 id="pulse-deck-title">Three live pressure lanes</h2></div>
      <p>Du mint brut au signal exploitable : la même fenêtre trie ce qui vient de naître, ce qui accélère et ce qui présente une anomalie.</p>
    </div>
    <div className="pulse-deck__lanes">
      <article className="pulse-lane pulse-lane--birth">
        <header><span><Radio size={12} /> NEW BIRTHS</span><b>{launches.length} CAPTURED</b></header>
        <div>{launches.slice(0, 4).map((launch, index) => <a className="pulse-birth-card" href={`https://solscan.io/token/${launch.mint}`} target="_blank" rel="noreferrer" key={launch.id}>
          <span><i /> {index === 0 ? 'JUST IN' : new Date(launch.timestamp * 1000).toISOString().slice(11, 19)}</span>
          <strong>${launch.symbol.slice(0, 10)}</strong>
          <small>{launch.name.slice(0, 28)}</small>
          <em>CREATOR {shortAddress(launch.creator)}</em>
          <ExternalLink size={10} />
        </a>)}</div>
      </article>
      <article className="pulse-lane pulse-lane--momentum">
        <header><span><TrendingUp size={12} /> ACCELERATING</span><b>VELOCITY × FLOW</b></header>
        <div>{accelerating.map((token) => <MarketCard token={token} kind="momentum" active={selectedAddress === token.address} onSelect={selectToken} key={token.address} />)}</div>
      </article>
      <article className="pulse-lane pulse-lane--risk">
        <header><span><ShieldAlert size={12} /> ANOMALIES</span><b>HEURISTIC FLAGS</b></header>
        <div>{risky.map((token) => <MarketCard token={token} kind="risk" active={selectedAddress === token.address} onSelect={selectToken} key={token.address} />)}</div>
      </article>
    </div>
  </section>
}
