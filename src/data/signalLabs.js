import { inferToken } from './marketSnapshot.js'

export const signalLabs = [
  {
    id: 'narrative-gap',
    index: 'L.01',
    code: 'NARRATIVE-GAP',
    name: 'Narrative arbitrage radar',
    short: 'Detect the gap between semantic acceleration and incoming capital.',
    formula: 'Δ_semantic_velocity − Δ_capital_velocity',
    provenance: 'Market observed / semantics simulated',
  },
  {
    id: 'half-life',
    index: 'L.02',
    code: 'ATTN-HALFLIFE',
    name: 'Attention half-life',
    short: 'Estimate how long a narrative impulse takes to lose half its intensity.',
    formula: 'τ½ = ln(2) / λ_attention',
    provenance: 'Price path observed / decay simulated',
  },
  {
    id: 'sniper-cohort',
    index: 'L.03',
    code: 'SNIPER-COHORT',
    name: 'Coordinated cohort detector',
    short: 'Search for signatures consistent with coordinated early-buyer cohorts.',
    formula: 'ring_μ = f(flow asymmetry, turnover, event density)',
    provenance: 'Market aggregate proxy / wallet adapter pending',
  },
  {
    id: 'kol-impulse',
    index: 'L.04',
    code: 'KOL-IMPULSE',
    name: 'KOL causal impulse',
    short: 'Measure pre/post-mention impact while abstaining without timestamped social events.',
    formula: 'CATE = E[r|mention] − E[r|synthetic control]',
    provenance: 'X event stream required',
  },
  {
    id: 'survival',
    index: 'L.05',
    code: 'SURVIVAL-HEAD',
    name: 'Post-graduation survival',
    short: 'Project post-migration persistence from observed depth and participation.',
    formula: 'S(t) = exp(−∫h(u|x)du)',
    provenance: 'Pool observed / hazard simulated',
  },
  {
    id: 'collision',
    index: 'L.06',
    code: 'CLONE-LENS',
    name: 'Ticker collision lens',
    short: 'Detect ticker collisions, equity mimicry and semantic clones.',
    formula: 'collision = cos(e_token,e_registry) × namespace_risk',
    provenance: 'Metadata observed / registry simulated',
  },
  {
    id: 'poison',
    index: 'L.07',
    code: 'POISON-FIREWALL',
    name: 'Wash-activity firewall',
    short: 'Quarantine pools where volume, depth and participant structure diverge.',
    formula: 'OOD = turnover + asymmetry + displacement',
    provenance: 'Observed inputs / deterministic heuristic',
  },
  {
    id: 'reflexivity',
    index: 'L.08',
    code: 'LIQ-STRESS',
    name: 'Liquidity reflexivity test',
    short: 'Simulate notional liquidation impact against observed market depth.',
    formula: 'impact_proxy = shock_notional / (2 × depth)',
    provenance: 'Pool depth observed / constant-product proxy',
  },
  {
    id: 'convergence',
    index: 'L.09',
    code: 'COHORT-CONVERGE',
    name: 'Smart cohort convergence',
    short: 'Measure whether several cohorts converge or activity remains single-source.',
    formula: 'convergence = balance × breadth × persistence',
    provenance: 'Participation observed / cohorts simulated',
  },
  {
    id: 'counterfactual',
    index: 'L.10',
    code: 'REPLAY-ENGINE',
    name: 'Counterfactual replay',
    short: 'Replay a flow shock to estimate the current regime’s relative fragility.',
    formula: 'xₜ₊₁ = F(xₜ, Δflow, depth, persistence)',
    provenance: 'Observed state / scenario simulated',
  },
]

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const rounded = (value) => Math.round(value)

export function evaluateLab(labId, token, sensitivity = 5) {
  const inference = inferToken(token)
  const balance = 1 - inference.imbalance / 100
  const turnover = token.volume24 / Math.max(token.liquidity, 1)
  const depthQuality = clamp(18 * Math.log10(Math.max(token.liquidity, 1)) - 10)
  const confidence = rounded(clamp(depthQuality * .54 + (100 - inference.contamination) * .34 + 8))
  const common = {
    confidence,
    abstain: false,
    bars: [
      { label: 'DEPTH', value: rounded(depthQuality) },
      { label: 'BREADTH', value: rounded(balance * 100) },
      { label: 'PERSIST', value: inference.persistence },
    ],
  }

  switch (labId) {
    case 'narrative-gap': {
      const gap = rounded(clamp(48 + Math.abs(token.change6h) * .08 - Math.abs(token.change1h) * .13 + sensitivity * 2))
      return { ...common, value: gap, unit: '/100', label: 'Divergence index', verdict: gap > 72 ? 'SEMANTIC LEAD' : gap < 38 ? 'CAPITAL LEAD' : 'SYNCHRONOUS', insight: `Simulated narrative velocity ${gap > 72 ? 'leads' : 'remains aligned with'} the observed ${token.symbol} microstructure.` }
    }
    case 'half-life': {
      const hours = clamp(6 + inference.persistence * .31 - Math.abs(token.change1h) * .09 + sensitivity, 1.5, 48)
      return { ...common, value: hours.toFixed(1), unit: 'H', label: 'Attention half-life', verdict: hours > 24 ? 'STICKY REGIME' : hours < 8 ? 'FLASH REGIME' : 'DECAYING', insight: `Under current assumptions, ${token.symbol} attention mass would lose half its intensity in ${hours.toFixed(1)} hours.` }
    }
    case 'sniper-cohort': {
      const ring = rounded(clamp(inference.imbalance * .72 + turnover * .12 + sensitivity * 2.4))
      return { ...common, confidence: rounded(confidence * .58), value: ring, unit: '/100', label: 'Coordination proxy', verdict: ring > 68 ? 'REVIEW RINGS' : 'NO STRONG PROXY', insight: 'This result attributes no wallet. It prioritizes assets for slot-level transaction enrichment.' }
    }
    case 'kol-impulse':
      return { ...common, confidence: 0, abstain: true, value: '—', unit: '', label: 'Causal impulse', verdict: 'ABSTAIN / NO SOCIAL EVENTS', insight: 'The engine refuses a KOL score until timestamped X or Telegram events and a synthetic control are available.', bars: [{ label: 'PRE-EVENT', value: 0 }, { label: 'POST-EVENT', value: 0 }, { label: 'CONTROL', value: 0 }] }
    case 'survival': {
      const survival = rounded(clamp(depthQuality * .42 + balance * 28 + inference.persistence * .3 - sensitivity))
      return { ...common, value: survival, unit: '%', label: '72h survival proxy', verdict: survival > 66 ? 'RESILIENT COHORT' : survival < 35 ? 'HIGH ATTRITION' : 'UNCERTAIN', insight: `${token.symbol} shows a ${survival > 66 ? 'stronger' : 'fragile'} post-migration persistence envelope under stationary-depth assumptions.` }
    }
    case 'collision': {
      const knownTicker = ['INTC', 'NVDA', 'HOOD', 'MRNA', 'SPCX'].includes(token.symbol.toUpperCase())
      const collision = rounded(clamp((knownTicker ? 72 : 18) + (token.narrative === 'celebrity' ? 23 : 0) + sensitivity * 2))
      return { ...common, value: collision, unit: '/100', label: 'Namespace collision', verdict: collision > 70 ? 'IDENTITY COLLISION' : 'LOW COLLISION', insight: knownTicker ? `${token.symbol} collides with a known financial namespace; identity resolution must use the mint, never the ticker.` : `No strong collision is present in the local registry for ${token.symbol}.` }
    }
    case 'poison': {
      const poison = rounded(clamp(inference.contamination + (sensitivity - 5) * 3))
      return { ...common, confidence: inference.confidence, value: poison, unit: '/100', label: 'Contamination score', verdict: poison >= 70 ? 'QUARANTINE' : poison >= 48 ? 'MANUAL REVIEW' : 'PASS', insight: `Observed turnover is ${turnover.toFixed(1)}× reported depth; the threshold is adjusted by laboratory sensitivity.` }
    }
    case 'reflexivity': {
      const notional = sensitivity * 10000
      const impact = clamp((notional / (2 * token.liquidity)) * 100, 0, 99)
      return { ...common, value: impact.toFixed(1), unit: '%', label: `Impact proxy / $${notional / 1000}K`, verdict: impact > 25 ? 'REFLEXIVE DEPTH' : impact > 8 ? 'THIN DEPTH' : 'ABSORBABLE', insight: `A $${notional.toLocaleString('en-US')} notional shock represents ${impact.toFixed(1)}% of observed half-depth. This is not an execution quote.` }
    }
    case 'convergence': {
      const convergence = rounded(clamp(balance * 48 + Math.log10(token.tx24) * 8 + inference.persistence * .2 - sensitivity))
      return { ...common, confidence: rounded(confidence * .7), value: convergence, unit: '/100', label: 'Cohort convergence', verdict: convergence > 70 ? 'MULTI-COHORT' : 'CONCENTRATED FLOW', insight: `Buy/sell symmetry and transaction density suggest ${convergence > 70 ? 'more distributed' : 'potentially concentrated'} participation.` }
    }
    case 'counterfactual': {
      const shock = sensitivity * 12
      const fragility = clamp(inference.contamination * .42 + shock * .38 + (100 - depthQuality) * .2)
      return { ...common, value: rounded(fragility), unit: '/100', label: `Fragility / +${shock}% flow`, verdict: fragility > 70 ? 'REGIME BREAK' : fragility > 45 ? 'NON-LINEAR' : 'STABLE PROXY', insight: `The scenario injects +${shock}% flow without assuming infinite liquidity and measures relative regime deformation.` }
    }
    default:
      return { ...common, value: '—', unit: '', label: 'Unknown laboratory', verdict: 'ABSTAIN', insight: 'No evaluator is registered.', abstain: true }
  }
}
