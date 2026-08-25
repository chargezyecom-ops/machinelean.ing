import { Activity, ExternalLink, Radio, ShieldAlert, TrendingUp } from 'lucide-react'
import { signed, usd, shortAddress, tokenAge } from '../lib/format.js'



function MarketCard({ token, kind, active, onSelect }) {
  const score = kind === 'risk' ? token.ml.poison : token.ml.fomo
  return (
    <button className={`pulse-card pulse-card--${kind} ${active ? 'is-active' : ''}`} type="button" onClick={() => onSelect(token.address)}>
      <div className="pulse-card__header">
        {token.icon ? (
          <img src={token.icon} alt="" className="pulse-card__icon" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'grid' }} />
        ) : null}
        <span className="pulse-card__icon-fallback" style={{ display: token.icon ? 'none' : 'grid' }}>{token.symbol?.slice(0, 2)}</span>
        <div>
          <span>${token.symbol?.slice(0, 9) || '??'}</span>
          <em>{token.narrative}</em>
        </div>
      </div>
      <strong className={token.change5m >= 0 ? 'is-up' : 'is-down'}>{signed(token.change5m)}</strong>
      <dl>
        <div><dt>FLOW</dt><dd>{usd(token.volume1h)}</dd></div>
        <div><dt>{kind === 'risk' ? 'RISK' : 'HYPE'}</dt><dd>{score}</dd></div>
        <div><dt>LIQ.</dt><dd>{usd(token.liquidity)}</dd></div>
        <div><dt>MCAP</dt><dd>{usd(token.marketCap || token.fdv)}</dd></div>
        <div><dt>AGE</dt><dd>{tokenAge(token.pairCreatedAt)}</dd></div>
      </dl>
      <i className="pulse-card__meter" style={{ '--value': `${score}%` }} />
    </button>
  )
}

export default function PulseDeck({ tokens, launches, selectedAddress, onSelectToken }) {
  const accelerating = [...tokens].sort((a, b) => (b.change5m * .4 + b.ml.velocity * .6) - (a.change5m * .4 + a.ml.velocity * .6)).slice(0, 4)
  const risky = [...tokens].sort((a, b) => b.ml.poison - a.ml.poison).slice(0, 4)

  const selectToken = (address) => {
    onSelectToken(address)
    if (import.meta.env.MODE !== 'test') document.getElementById('signal-nexus')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <section className="pulse-deck" aria-labelledby="pulse-deck-title">
      <div className="pulse-deck__title">
        <div><Activity size={13} /><span>REAL-TIME TRIAGE</span><h2 id="pulse-deck-title">Three live pressure lanes</h2></div>
        <p>One continuous workflow from raw mint to actionable research: new births, accelerating markets and structural anomalies.</p>
      </div>
      <div className="pulse-deck__lanes">
        <article className="pulse-lane pulse-lane--birth">
          <header><span><Radio size={12} /> NEW BIRTHS</span><b>{launches.length} CAPTURED</b></header>
          <div>{launches.slice(0, 4).map((launch, index) => <a className="pulse-birth-card" href={`https://solscan.io/token/${launch.mint}`} target="_blank" rel="noreferrer" key={launch.id || index}>
            <span><i /> {index === 0 ? 'JUST IN' : new Date(launch.timestamp * 1000).toISOString().slice(11, 19)}</span>
            <strong>${launch.symbol?.slice(0, 10) || '??'}</strong>
            <small>{launch.name?.slice(0, 28) || 'UNKNOWN'}</small>
            <em>CREATOR {shortAddress(launch.creator)}</em>
            <ExternalLink size={10} />
          </a>)}</div>
        </article>
        <article className="pulse-lane pulse-lane--momentum">
          <header><span><TrendingUp size={12} /> ACCELERATING</span><b>VELOCITY x FLOW</b></header>
          <div>{accelerating.map((token) => <MarketCard token={token} kind="momentum" active={selectedAddress === token.address} onSelect={selectToken} key={token.address} />)}</div>
        </article>
        <article className="pulse-lane pulse-lane--risk">
          <header><span><ShieldAlert size={12} /> ANOMALIES</span><b>HEURISTIC FLAGS</b></header>
          <div>{risky.map((token) => <MarketCard token={token} kind="risk" active={selectedAddress === token.address} onSelect={selectToken} key={token.address} />)}</div>
        </article>
      </div>
    </section>
  )
}
