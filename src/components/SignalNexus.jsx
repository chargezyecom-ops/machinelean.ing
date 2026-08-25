import { useMemo, useState } from 'react'
import { Activity, Crosshair, ExternalLink, Flame, Network, Radio, ScanLine, ShieldAlert, Wallet, Zap } from 'lucide-react'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const signed = (value) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(Math.abs(Number(value || 0)) >= 100 ? 0 : 1)}%`
const usd = (value) => `$${compact.format(Number(value) || 0)}`
const shortAddress = (value) => value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '—'

const horizons = [
  { id: '5M', key: 'change5m' },
  { id: '1H', key: 'change1h' },
  { id: '6H', key: 'change6h' },
  { id: '24H', key: 'change24h' },
]

const tokenPositions = [
  [21, 24], [42, 17], [70, 22], [84, 46],
  [72, 72], [47, 80], [20, 70], [10, 47],
]
const narrativePositions = [[30, 44], [58, 38], [59, 62], [35, 65]]
const launchPositions = [[83, 82], [91, 70], [92, 91]]
const creatorPositions = [[73, 93], [82, 59], [96, 57]]
const palette = ['cyan', 'pink', 'lime', 'amber']

function narrativeIndexFor(token, narrativeNodes) {
  const index = narrativeNodes.findIndex((item) => item.name === token.narrative)
  return index >= 0 ? index : Math.abs((token.symbol || '').length) % Math.max(narrativeNodes.length, 1)
}

function MarketNode({ node, selected, dimmed, horizonKey, onSelect }) {
  const score = Number(node.token.ml?.fomo || 0)
  const change = Number(node.token[horizonKey] || 0)
  return <button
    className={`nexus-node nexus-node--token ${selected ? 'is-selected' : ''} ${dimmed ? 'is-dimmed' : ''} ${change >= 0 ? 'is-up' : 'is-down'}`}
    style={{ '--x': `${node.x}%`, '--y': `${node.y}%`, '--node-size': `${36 + score * .28}px`, '--delay': `${node.index * -.43}s` }}
    type="button"
    onClick={() => onSelect(node.token.address)}
    aria-label={`Sélectionner ${node.token.symbol}, score ${score}, évolution ${signed(change)}`}
  >
    <span className="nexus-node__orb"><i /><em>{score}</em></span>
    <strong>${node.token.symbol.slice(0, 8)}</strong>
    <small>{signed(change)}</small>
  </button>
}

function NarrativeNode({ node, active, dimmed, onSelect }) {
  return <button
    className={`nexus-node nexus-node--narrative is-${node.tone} ${active ? 'is-selected' : ''} ${dimmed ? 'is-dimmed' : ''}`}
    style={{ '--x': `${node.x}%`, '--y': `${node.y}%`, '--node-size': `${58 + Math.min(34, node.item.tokens * 2)}px` }}
    type="button"
    onClick={() => onSelect(node.item.name)}
    aria-label={`Filtrer le thème ${node.item.name}`}
  >
    <span className="nexus-node__orb"><Network size={14} /></span>
    <strong>{node.item.name}</strong>
    <small>{node.item.tokens} TOKENS · {signed(node.item.momentum)}</small>
  </button>
}

export default function SignalNexus({ tokens, narratives, launches, selectedAddress, onSelectToken }) {
  const [horizon, setHorizon] = useState('5M')
  const [narrativeFocus, setNarrativeFocus] = useState('')
  const [inspectedLaunchId, setInspectedLaunchId] = useState('')
  const horizonKey = horizons.find((item) => item.id === horizon)?.key || 'change5m'

  const selected = tokens.find((token) => token.address === selectedAddress) || tokens[0]
  const narrativeNodes = useMemo(() => narratives.slice(0, 4).map((item, index) => ({ item, index, x: narrativePositions[index][0], y: narrativePositions[index][1], tone: palette[index] })), [narratives])
  const marketNodes = useMemo(() => {
    const ranked = [...tokens].sort((a, b) => (b.ml?.fomo || 0) - (a.ml?.fomo || 0)).slice(0, 8)
    if (selected && !ranked.some((token) => token.address === selected.address)) ranked[ranked.length - 1] = selected
    return ranked.map((token, index) => ({ token, index, x: tokenPositions[index][0], y: tokenPositions[index][1], narrativeIndex: narrativeIndexFor(token, narrativeNodes) }))
  }, [tokens, selected, narrativeNodes])
  const launchNodes = launches.slice(0, 3).map((launch, index) => ({ launch, index, x: launchPositions[index][0], y: launchPositions[index][1], creatorX: creatorPositions[index][0], creatorY: creatorPositions[index][1] }))
  const inspectedLaunch = launches.find((launch) => launch.id === inspectedLaunchId)
  const selectedChange = Number(selected?.[horizonKey] || 0)
  const relatedTokens = tokens.filter((token) => token.address !== selected?.address && token.narrative === selected?.narrative).length
  const pressure = selected ? Math.max(0, Math.min(100, Math.round((selected.ml?.velocity || 0) * .55 + (selected.ml?.fomo || 0) * .45))) : 0

  const selectMarketToken = (address) => {
    setInspectedLaunchId('')
    onSelectToken(address)
  }

  const toggleNarrative = (name) => setNarrativeFocus((current) => current === name ? '' : name)

  return <section className="signal-nexus" id="signal-nexus" aria-labelledby="signal-nexus-title">
    <div className="signal-nexus__head">
      <div>
        <span><ScanLine size={13} /> HYPEGRAPH / RELATION ENGINE</span>
        <h2 id="signal-nexus-title">Live memetic topology</h2>
      </div>
      <div className="signal-nexus__head-stats">
        <span><i /> {marketNodes.length} SIGNALS</span>
        <span>{narrativeNodes.length} CLUSTERS</span>
        <span>{launchNodes.length} NEW MINTS</span>
      </div>
      <div className="signal-nexus__horizons" aria-label="Horizon d’analyse">
        {horizons.map((item) => <button className={horizon === item.id ? 'is-active' : ''} type="button" onClick={() => setHorizon(item.id)} key={item.id}>{item.id}</button>)}
      </div>
    </div>

    <div className="signal-nexus__body">
      <div className="nexus-canvas" aria-label="Graphe interactif des relations entre tokens, thèmes et créateurs">
        <div className="nexus-canvas__scan" aria-hidden="true" />
        <div className="nexus-canvas__reticle" aria-hidden="true"><Crosshair size={38} /></div>
        <svg className="nexus-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {marketNodes.map((node) => {
            const target = narrativeNodes[node.narrativeIndex]
            const active = !narrativeFocus || node.token.narrative === narrativeFocus
            return target && <line className={`nexus-link nexus-link--signal ${active ? 'is-active' : 'is-muted'}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} key={`signal-${node.token.address}`} />
          })}
          {marketNodes.filter((node) => node.token.narrative === selected?.narrative && node.token.address !== selected?.address).map((node) => {
            const source = marketNodes.find((item) => item.token.address === selected?.address)
            return source && <line className="nexus-link nexus-link--correlation" x1={source.x} y1={source.y} x2={node.x} y2={node.y} key={`correlation-${node.token.address}`} />
          })}
          {launchNodes.map((node) => <g key={`launch-edge-${node.launch.id}`}><line className="nexus-link nexus-link--creation" x1={node.creatorX} y1={node.creatorY} x2={node.x} y2={node.y} /><circle className="nexus-packet" r=".7"><animateMotion dur={`${2.1 + node.index * .35}s`} repeatCount="indefinite" path={`M ${node.creatorX} ${node.creatorY} L ${node.x} ${node.y}`} /></circle></g>)}
        </svg>

        {narrativeNodes.map((node) => <NarrativeNode node={node} active={narrativeFocus === node.item.name} dimmed={Boolean(narrativeFocus && narrativeFocus !== node.item.name)} onSelect={toggleNarrative} key={node.item.name} />)}
        {marketNodes.map((node) => <MarketNode node={node} selected={!inspectedLaunch && selected?.address === node.token.address} dimmed={Boolean(narrativeFocus && narrativeFocus !== node.token.narrative)} horizonKey={horizonKey} onSelect={selectMarketToken} key={node.token.address} />)}
        {launchNodes.map((node) => <div className="nexus-launch-pair" key={node.launch.id}>
          <button className={`nexus-node nexus-node--launch ${inspectedLaunchId === node.launch.id ? 'is-selected' : ''}`} style={{ '--x': `${node.x}%`, '--y': `${node.y}%`, '--delay': `${node.index * -.5}s` }} type="button" onClick={() => setInspectedLaunchId(node.launch.id)} aria-label={`Inspecter le nouveau token ${node.launch.symbol}`}><span className="nexus-node__orb"><Radio size={11} /></span><strong>${node.launch.symbol.slice(0, 7)}</strong><small>NEW MINT</small></button>
          <button className="nexus-node nexus-node--wallet" style={{ '--x': `${node.creatorX}%`, '--y': `${node.creatorY}%` }} type="button" onClick={() => setInspectedLaunchId(node.launch.id)} aria-label={`Inspecter le créateur ${shortAddress(node.launch.creator)}`}><span className="nexus-node__orb"><Wallet size={10} /></span><strong>{shortAddress(node.launch.creator)}</strong><small>CREATOR</small></button>
        </div>)}

        <div className="nexus-canvas__legend">
          <span><i className="is-token" /> TOKEN</span><span><i className="is-narrative" /> NARRATIVE</span><span><i className="is-launch" /> NEW MINT</span><span><i className="is-wallet" /> CREATOR</span>
        </div>
        <div className="nexus-canvas__hint"><Activity size={11} /> CLIQUEZ UN NŒUD POUR RECOMPOSER LE SIGNAL</div>
      </div>

      <aside className="nexus-inspector" aria-live="polite">
        {inspectedLaunch ? <>
          <div className="nexus-inspector__status is-new"><Radio size={12} /><span>NEW MINT OBSERVED</span><b>LIVE</b></div>
          <div className="nexus-inspector__identity"><span>PUMP.FUN CREATE EVENT</span><h3>${inspectedLaunch.symbol.slice(0, 12)}</h3><p>{inspectedLaunch.name.slice(0, 48)}</p></div>
          <dl className="nexus-inspector__facts">
            <div><dt>MINT</dt><dd>{shortAddress(inspectedLaunch.mint)}</dd></div>
            <div><dt>CREATOR</dt><dd>{shortAddress(inspectedLaunch.creator)}</dd></div>
            <div><dt>SLOT</dt><dd>{compact.format(inspectedLaunch.slot || 0)}</dd></div>
            <div><dt>MODE</dt><dd>{inspectedLaunch.isMayhemMode ? 'MAYHEM' : inspectedLaunch.isCashbackEnabled ? 'CASHBACK' : 'STANDARD'}</dd></div>
          </dl>
          <div className="nexus-inspector__callout"><Zap size={14} /><span><b>CRÉATION DÉTECTÉE</b>Le lien mint ↔ créateur vient directement des logs du programme Pump.fun. Prix, liquidité et score apparaîtront après indexation du marché.</span></div>
          <a className="nexus-inspector__action" href={`https://solscan.io/token/${inspectedLaunch.mint}`} target="_blank" rel="noreferrer">OUVRIR SUR SOLSCAN <ExternalLink size={11} /></a>
        </> : <>
          <div className={`nexus-inspector__status ${selected?.ml.poison >= 60 ? 'is-risk' : 'is-hot'}`}><Flame size={12} /><span>{selected?.ml.poison >= 60 ? 'RISK ANOMALY' : 'PROPAGATION SIGNAL'}</span><b>{selected?.ml.confidence || 0}% CONF.</b></div>
          <div className="nexus-inspector__identity"><span>{selected?.narrative || 'UNCLASSIFIED'} / {horizon}</span><h3>${selected?.symbol || '—'}</h3><p>{selected?.name || 'Signal non résolu'}</p></div>
          <div className="nexus-inspector__score"><div style={{ '--score': `${selected?.ml.fomo || 0}%` }}><span>HYPE POTENTIAL</span><strong>{selected?.ml.fomo || 0}</strong><em>/100</em></div><p className={selectedChange >= 0 ? 'is-up' : 'is-down'}>{signed(selectedChange)}<span>sur {horizon}</span></p></div>
          <dl className="nexus-inspector__facts">
            <div><dt>FLOW 1H</dt><dd>{usd(selected?.volume1h)}</dd></div>
            <div><dt>LIQUIDITY</dt><dd>{usd(selected?.liquidity)}</dd></div>
            <div><dt>PRESSURE</dt><dd>{pressure}/100</dd></div>
            <div><dt>RELATED</dt><dd>{relatedTokens} TOKENS</dd></div>
          </dl>
          <div className={`nexus-inspector__callout ${selected?.ml.poison >= 60 ? 'is-risk' : ''}`}>{selected?.ml.poison >= 60 ? <ShieldAlert size={14} /> : <Network size={14} />}<span><b>{selected?.ml.poison >= 60 ? 'SIGNAL CONTAMINÉ' : 'NARRATIVE CONVERGENCE'}</b>{relatedTokens ? `${relatedTokens} autre${relatedTokens > 1 ? 's' : ''} token${relatedTokens > 1 ? 's' : ''} partage${relatedTokens > 1 ? 'nt' : ''} ce thème.` : 'Ce thème ne possède pas encore de pair comparable dans la fenêtre.'} Score heuristique, pas une prédiction.</span></div>
          <a className="nexus-inspector__action" href={selected?.url} target="_blank" rel="noreferrer">OUVRIR LE MARCHÉ <ExternalLink size={11} /></a>
        </>}
        <div className="nexus-inspector__evidence"><span><i /> RELATION THÈME = CLASSIFICATION LEXICALE</span><span><i /> MINT ↔ CREATOR = LOG ONCHAIN OBSERVÉ</span></div>
      </aside>
    </div>
  </section>
}
