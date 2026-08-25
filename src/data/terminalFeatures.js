import { inferToken } from './marketSnapshot.js'

export const terminalFeatures = [
  { id: 'wallet-profile', index: '01', code: 'WALLET-INTEL', title: 'Wallet Intelligence Profile', priority: 'P0', mode: 'adapter', endpoint: '/v1/wallets/:address/profile', summary: 'PnL, drawdown, holding time, sizing and narrative specialization.' },
  { id: 'creator-lineage', index: '02', code: 'CREATOR-DNA', title: 'Creator Lineage Graph', priority: 'P0', mode: 'adapter', endpoint: '/v1/creators/:address/lineage', summary: 'Creator history, common funders, prior launches and linked entities.' },
  { id: 'sniper-cohorts', index: '03', code: 'SNIPER-RINGS', title: 'Sniper Cohort Detector', priority: 'P0', mode: 'adapter', endpoint: '/v1/tokens/:mint/snipers', summary: 'First-slot entrants, synchronized wallets and funding-cluster overlap.' },
  { id: 'embeddings', index: '04', code: 'MM-EMBED', title: 'Live Narrative Embeddings', priority: 'P0', mode: 'hybrid', endpoint: '/v1/embeddings/narratives', summary: 'Multimodal token clustering across text, imagery, social and flow.' },
  { id: 'momentum', index: '05', code: 'NARRATIVE-λ', title: 'Narrative Momentum Index', priority: 'P0', mode: 'local', summary: 'Velocity and acceleration of attention rather than static volume.' },
  { id: 'smart-money', index: '06', code: 'COHORT-CONV', title: 'Smart-Money Convergence', priority: 'P0', mode: 'adapter', endpoint: '/v1/cohorts/convergence', summary: 'Detects historically strong cohorts converging on one entity.' },
  { id: 'lifecycle', index: '07', code: 'PUMP-LIFE', title: 'Pump Lifecycle Monitor', priority: 'P0', mode: 'hybrid', endpoint: '/v1/tokens/:mint/lifecycle', summary: 'Creation, bonding curve, graduation, migration and decay state.' },
  { id: 'alerts', index: '08', code: 'ALERT-DSL', title: 'Alert Engine', priority: 'P0', mode: 'local', summary: 'Composable rules over flow, FOMO, risk, migration and wallets.' },
  { id: 'survival', index: '09', code: 'SURVIVAL-HEAD', title: 'Graduation Survival Model', priority: 'P1', mode: 'hybrid', endpoint: '/v1/models/survival', summary: 'Calibrated graduation and post-migration survival probability.' },
  { id: 'temporal-gnn', index: '10', code: 'T-GNN', title: 'Temporal GNN Explorer', priority: 'P1', mode: 'adapter', endpoint: '/v1/graph/temporal', summary: 'Causal propagation across creators, wallets, tokens, pools and KOLs.' },
  { id: 'kol-impact', index: '11', code: 'KOL-CAUSAL', title: 'KOL Causal Impact', priority: 'P1', mode: 'adapter', endpoint: '/v1/entities/:id/impact', summary: 'Liquidity-adjusted pre/post-mention event studies with controls.' },
  { id: 'wash-firewall', index: '12', code: 'WASH-OOD', title: 'Wash-Trading Firewall', priority: 'P1', mode: 'hybrid', endpoint: '/v1/tokens/:mint/integrity', summary: 'Circularity, repeated counterparties and synthetic turnover detection.' },
  { id: 'liquidity-stress', index: '13', code: 'LIQ-STRESS', title: 'Liquidity Stress Simulator', priority: 'P1', mode: 'local', summary: 'Order-size impact simulation against the observed depth envelope.' },
  { id: 'regime', index: '14', code: 'REGIME-NET', title: 'Regime Classifier', priority: 'P1', mode: 'local', summary: 'Discovery, expansion, coordinated pump, euphoria or decay.' },
  { id: 'explainability', index: '15', code: 'SIGNAL-XAI', title: 'Explainable Signal Ledger', priority: 'P1', mode: 'local', summary: 'Feature contributions, provenance and confidence for every score.' },
  { id: 'replay', index: '16', code: 'SLOT-REPLAY', title: 'Historical Replay', priority: 'P1', mode: 'local', summary: 'Point-in-time market replay without future-information leakage.' },
  { id: 'watchlists', index: '17', code: 'WORKSPACES', title: 'Watchlists & Workspaces', priority: 'P2', mode: 'local', summary: 'Persistent entities, layouts, narratives and research filters.' },
  { id: 'copilot', index: '18', code: 'GRAPH-COPILOT', title: 'Research Copilot', priority: 'P2', mode: 'hybrid', endpoint: '/v1/copilot/query', summary: 'Natural-language interrogation of the evidence and entity graph.' },
  { id: 'webhooks', index: '19', code: 'EVENT-API', title: 'Webhooks & API', priority: 'P2', mode: 'adapter', endpoint: '/v1/webhooks', summary: 'Programmable signals for bots, notebooks and quant workflows.' },
  { id: 'cases', index: '20', code: 'CASE-FILE', title: 'Investigation Cases', priority: 'P2', mode: 'local', summary: 'Shareable evidence files with entities, notes and timestamps.' },
]

const clamp = (value) => Math.max(0, Math.min(99, Math.round(value)))

export function evaluateTerminalFeature(featureId, token, scenario = 50, replayIndex = 23) {
  const inference = inferToken(token)
  const turnover = token.volume24 / Math.max(token.liquidity, 1)
  const imbalance = Math.abs(token.buyers - token.sellers) / Math.max(token.buyers + token.sellers, 1) * 100
  const replaySeries = token.series24.slice(0, Math.max(2, replayIndex + 1))
  const replayMove = ((replaySeries.at(-1) / replaySeries[0]) - 1) * 100
  const impact = Math.sqrt((scenario * 1000) / Math.max(token.liquidity, 1)) * 100
  const values = {
    'wallet-profile': [inference.confidence, 'PROFILE COVERAGE', 'Awaiting transaction-level wallet adapter'],
    'creator-lineage': [clamp(100 - inference.contamination), 'LINEAGE INTEGRITY', 'Creator ancestry requires indexed funding edges'],
    'sniper-cohorts': [clamp(imbalance * 1.4), 'COHORT ASYMMETRY', 'First-slot wallet identities require raw transactions'],
    embeddings: [clamp(45 + Math.abs(token.change6h) / 8), 'SEMANTIC VELOCITY', 'Local market proxy; multimodal encoder adapter pending'],
    momentum: [clamp(50 + token.change1h * .4 + token.change6h * .08), 'MOMENTUM λ', token.change1h >= 0 ? 'Attention acceleration detected' : 'Narrative attention is decelerating'],
    'smart-money': [inference.confidence, 'COHORT CONFIDENCE', 'Performance-ranked wallet cohorts are not connected'],
    lifecycle: [clamp(35 + Math.log10(Math.max(token.volume24, 1)) * 7), 'LIFECYCLE COMPLETION', token.age.includes('h') ? 'Early market formation' : 'Post-migration persistence regime'],
    alerts: [clamp((inference.hype + inference.contamination) / 2), 'RULE MATCH PRESSURE', 'Local rule engine ready; delivery adapter pending'],
    survival: [clamp(inference.persistence - inference.contamination * .25 + 20), 'SURVIVAL PROXY', 'Deterministic proxy until calibrated model endpoint is connected'],
    'temporal-gnn': [inference.confidence, 'GRAPH RESOLUTION', 'Temporal entity edges require the graph API'],
    'kol-impact': [0, 'ABSTAIN', 'No timestamped social events: causal scoring refused'],
    'wash-firewall': [clamp(turnover * .45 + imbalance), 'CONTAMINATION RISK', turnover > 100 ? 'Extreme turnover requires adversarial review' : 'No severe turnover inconsistency'],
    'liquidity-stress': [clamp(impact), 'EST. PRICE IMPACT', `${scenario}k USD scenario against reported depth`],
    regime: [inference.hype, 'REGIME ENERGY', token.change1h < -20 ? 'TERMINAL DECAY' : token.change6h > 100 ? 'EXPANSION / EUPHORIA' : token.change1h > 5 ? 'DISCOVERY / EXPANSION' : 'RANGE / COOLING'],
    explainability: [inference.confidence, 'EXPLAINED MASS', 'All local heuristic contributions are available below'],
    replay: [clamp(50 + replayMove / 4), 'REPLAY STATE', `${replayIndex + 1}/24 observations · ${replayMove >= 0 ? '+' : ''}${replayMove.toFixed(1)}% path`],
    watchlists: [inference.hype, 'ENTITY PRIORITY', 'Browser-persistent workspace enabled'],
    copilot: [inference.confidence, 'CONTEXT COVERAGE', 'Local evidence synthesis ready; LLM gateway optional'],
    webhooks: [0, 'DELIVERY OFFLINE', 'Server signing secret and public callback URL required'],
    cases: [inference.confidence, 'EVIDENCE COVERAGE', 'Browser-persistent investigation files enabled'],
  }
  const [score, label, verdict] = values[featureId] || [0, 'UNAVAILABLE', 'No evaluator']
  return {
    score,
    label,
    verdict,
    bars: [
      { label: 'FLOW', value: clamp(25 + Math.log10(Math.max(token.volume24, 1)) * 9) },
      { label: 'DEPTH', value: clamp(10 + Math.log10(Math.max(token.liquidity, 1)) * 13) },
      { label: 'PERSISTENCE', value: inference.persistence },
      { label: 'INTEGRITY', value: clamp(100 - inference.contamination) },
    ],
    inference,
  }
}
