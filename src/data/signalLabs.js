import { inferToken } from './marketSnapshot.js'

export const signalLabs = [
  {
    id: 'narrative-gap',
    index: 'L.01',
    code: 'NARRATIVE-GAP',
    name: 'Narrative arbitrage radar',
    short: 'Détecte le décalage entre accélération sémantique et arrivée du capital.',
    formula: 'Δ_semantic_velocity − Δ_capital_velocity',
    provenance: 'Market observed / semantics simulated',
  },
  {
    id: 'half-life',
    index: 'L.02',
    code: 'ATTN-HALFLIFE',
    name: 'Attention half-life',
    short: 'Estime le temps nécessaire à une impulsion narrative pour perdre 50 % de son intensité.',
    formula: 'τ½ = ln(2) / λ_attention',
    provenance: 'Price path observed / decay simulated',
  },
  {
    id: 'sniper-cohort',
    index: 'L.03',
    code: 'SNIPER-COHORT',
    name: 'Coordinated cohort detector',
    short: 'Recherche les signatures compatibles avec des grappes d’acheteurs précoces coordonnés.',
    formula: 'ring_μ = f(flow asymmetry, turnover, event density)',
    provenance: 'Market aggregate proxy / wallet adapter pending',
  },
  {
    id: 'kol-impulse',
    index: 'L.04',
    code: 'KOL-IMPULSE',
    name: 'KOL causal impulse',
    short: 'Mesure l’impact pré/post-mention en refusant d’inférer sans événement social horodaté.',
    formula: 'CATE = E[r|mention] − E[r|synthetic control]',
    provenance: 'X event stream required',
  },
  {
    id: 'survival',
    index: 'L.05',
    code: 'SURVIVAL-HEAD',
    name: 'Post-graduation survival',
    short: 'Projette la persistance après migration à partir de la profondeur et de la participation.',
    formula: 'S(t) = exp(−∫h(u|x)du)',
    provenance: 'Pool observed / hazard simulated',
  },
  {
    id: 'collision',
    index: 'L.06',
    code: 'CLONE-LENS',
    name: 'Ticker collision lens',
    short: 'Repère les collisions de symboles, l’equity mimicry et les clones sémantiques.',
    formula: 'collision = cos(e_token,e_registry) × namespace_risk',
    provenance: 'Metadata observed / registry simulated',
  },
  {
    id: 'poison',
    index: 'L.07',
    code: 'POISON-FIREWALL',
    name: 'Wash-activity firewall',
    short: 'Quarantaine les pools dont le volume, la profondeur et la structure d’acteurs divergent.',
    formula: 'OOD = turnover + asymmetry + displacement',
    provenance: 'Observed inputs / deterministic heuristic',
  },
  {
    id: 'reflexivity',
    index: 'L.08',
    code: 'LIQ-STRESS',
    name: 'Liquidity reflexivity test',
    short: 'Simule l’impact d’une liquidation notionnelle contre la profondeur observée.',
    formula: 'impact_proxy = shock_notional / (2 × depth)',
    provenance: 'Pool depth observed / constant-product proxy',
  },
  {
    id: 'convergence',
    index: 'L.09',
    code: 'COHORT-CONVERGE',
    name: 'Smart cohort convergence',
    short: 'Quantifie si plusieurs cohortes semblent converger ou si l’activité reste mono-source.',
    formula: 'convergence = balance × breadth × persistence',
    provenance: 'Participation observed / cohorts simulated',
  },
  {
    id: 'counterfactual',
    index: 'L.10',
    code: 'REPLAY-ENGINE',
    name: 'Counterfactual replay',
    short: 'Rejoue un choc de flux pour estimer la fragilité relative du régime courant.',
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
      return { ...common, value: gap, unit: '/100', label: 'Divergence index', verdict: gap > 72 ? 'SEMANTIC LEAD' : gap < 38 ? 'CAPITAL LEAD' : 'SYNCHRONOUS', insight: `La vélocité narrative simulée ${gap > 72 ? 'précède' : 'reste alignée avec'} la microstructure observée de ${token.symbol}.` }
    }
    case 'half-life': {
      const hours = clamp(6 + inference.persistence * .31 - Math.abs(token.change1h) * .09 + sensitivity, 1.5, 48)
      return { ...common, value: hours.toFixed(1), unit: 'H', label: 'Attention half-life', verdict: hours > 24 ? 'STICKY REGIME' : hours < 8 ? 'FLASH REGIME' : 'DECAYING', insight: `Sous les hypothèses courantes, la masse d’attention de ${token.symbol} perdrait la moitié de son intensité en ${hours.toFixed(1)} heures.` }
    }
    case 'sniper-cohort': {
      const ring = rounded(clamp(inference.imbalance * .72 + turnover * .12 + sensitivity * 2.4))
      return { ...common, confidence: rounded(confidence * .58), value: ring, unit: '/100', label: 'Coordination proxy', verdict: ring > 68 ? 'REVIEW RINGS' : 'NO STRONG PROXY', insight: 'Ce résultat n’attribue aucun wallet : il priorise les actifs à enrichir avec les transactions slot-level.' }
    }
    case 'kol-impulse':
      return { ...common, confidence: 0, abstain: true, value: '—', unit: '', label: 'Causal impulse', verdict: 'ABSTAIN / NO SOCIAL EVENTS', insight: 'Le moteur refuse un score KOL tant que les mentions X/Telegram horodatées et un contrôle synthétique ne sont pas disponibles.', bars: [{ label: 'PRE-EVENT', value: 0 }, { label: 'POST-EVENT', value: 0 }, { label: 'CONTROL', value: 0 }] }
    case 'survival': {
      const survival = rounded(clamp(depthQuality * .42 + balance * 28 + inference.persistence * .3 - sensitivity))
      return { ...common, value: survival, unit: '%', label: '72h survival proxy', verdict: survival > 66 ? 'RESILIENT COHORT' : survival < 35 ? 'HIGH ATTRITION' : 'UNCERTAIN', insight: `${token.symbol} présente une enveloppe de persistance ${survival > 66 ? 'supérieure' : 'fragile'} après migration, sous hypothèse de profondeur stationnaire.` }
    }
    case 'collision': {
      const knownTicker = ['INTC', 'NVDA', 'HOOD', 'MRNA', 'SPCX'].includes(token.symbol.toUpperCase())
      const collision = rounded(clamp((knownTicker ? 72 : 18) + (token.narrative === 'celebrity' ? 23 : 0) + sensitivity * 2))
      return { ...common, value: collision, unit: '/100', label: 'Namespace collision', verdict: collision > 70 ? 'IDENTITY COLLISION' : 'LOW COLLISION', insight: knownTicker ? `${token.symbol} collisionne avec un namespace financier connu ; toute résolution doit utiliser le mint, jamais le ticker.` : `Aucune collision forte n’est trouvée dans le registre local pour ${token.symbol}.` }
    }
    case 'poison': {
      const poison = rounded(clamp(inference.contamination + (sensitivity - 5) * 3))
      return { ...common, confidence: inference.confidence, value: poison, unit: '/100', label: 'Contamination score', verdict: poison >= 70 ? 'QUARANTINE' : poison >= 48 ? 'MANUAL REVIEW' : 'PASS', insight: `Le turnover observé atteint ${turnover.toFixed(1)}× la profondeur déclarée ; le seuil est ajusté par la sensibilité du laboratoire.` }
    }
    case 'reflexivity': {
      const notional = sensitivity * 10000
      const impact = clamp((notional / (2 * token.liquidity)) * 100, 0, 99)
      return { ...common, value: impact.toFixed(1), unit: '%', label: `Impact proxy / $${notional / 1000}K`, verdict: impact > 25 ? 'REFLEXIVE DEPTH' : impact > 8 ? 'THIN DEPTH' : 'ABSORBABLE', insight: `Un choc notionnel de $${notional.toLocaleString('en-US')} représente ${impact.toFixed(1)} % de la demi-profondeur observée. Ce n’est pas une cotation d’exécution.` }
    }
    case 'convergence': {
      const convergence = rounded(clamp(balance * 48 + Math.log10(token.tx24) * 8 + inference.persistence * .2 - sensitivity))
      return { ...common, confidence: rounded(confidence * .7), value: convergence, unit: '/100', label: 'Cohort convergence', verdict: convergence > 70 ? 'MULTI-COHORT' : 'CONCENTRATED FLOW', insight: `La symétrie acheteurs/vendeurs et la densité transactionnelle suggèrent une participation ${convergence > 70 ? 'plus distribuée' : 'potentiellement concentrée'}.` }
    }
    case 'counterfactual': {
      const shock = sensitivity * 12
      const fragility = clamp(inference.contamination * .42 + shock * .38 + (100 - depthQuality) * .2)
      return { ...common, value: rounded(fragility), unit: '/100', label: `Fragility / +${shock}% flow`, verdict: fragility > 70 ? 'REGIME BREAK' : fragility > 45 ? 'NON-LINEAR' : 'STABLE PROXY', insight: `Le scénario injecte +${shock} % de flux sans supposer une liquidité infinie et mesure la déformation relative du régime.` }
    }
    default:
      return { ...common, value: '—', unit: '', label: 'Unknown laboratory', verdict: 'ABSTAIN', insight: 'No evaluator is registered.', abstain: true }
  }
}
