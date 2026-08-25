export const historicalWindows = {
  '24H': { launches: 18427, creators: 12982, transactions: 6384291, observations: 73708, coverage: '24 HOURS' },
  '7D': { launches: 126384, creators: 71849, transactions: 41829742, observations: 505536, coverage: '7 DAYS' },
  '30D': { launches: 487219, creators: 196428, transactions: 163842901, observations: 1948876, coverage: '30 DAYS' },
  '90D': { launches: 1384726, creators: 438905, transactions: 472619380, observations: 5538904, coverage: '90 DAYS' },
}

export const horizonProfiles = {
  '5M': { eligible: 96.8, expansion: 18.7, x2: 4.9, x5: .8, migration: .3, survival: 72.4, medianAth: 31, drawdown: -19, precision: 67, lead: '03:42' },
  '30M': { eligible: 91.2, expansion: 12.4, x2: 3.8, x5: .9, migration: 1.1, survival: 54.6, medianAth: 68, drawdown: -37, precision: 71, lead: '18:26' },
  '2H': { eligible: 78.6, expansion: 8.9, x2: 3.1, x5: 1.2, migration: 1.7, survival: 36.8, medianAth: 142, drawdown: -58, precision: 74, lead: '01:14:08' },
  '24H': { eligible: 43.5, expansion: 4.2, x2: 2.4, x5: 1.1, migration: 1.9, survival: 16.4, medianAth: 286, drawdown: -79, precision: 78, lead: '06:38:51' },
}

export const outcomeLabels = [
  { id: 'migration', label: 'MIGRATED', rate: 1.9, color: '#72ffa3', detail: 'Bonding curve completed and liquidity migrated.' },
  { id: 'ath', label: 'ATH > 5×', rate: 1.1, color: '#55c7ff', detail: 'Reached five times the five-minute reference market cap.' },
  { id: 'survival', label: 'SURVIVED 24H', rate: 16.4, color: '#d39cff', detail: 'Retained measurable liquidity and two-sided flow after 24 hours.' },
  { id: 'drawdown', label: 'DRAWDOWN > 80%', rate: 38.7, color: '#ffad45', detail: 'Lost over 80% from the observed local maximum.' },
  { id: 'rug', label: 'RUG / ABANDONED', rate: 27.8, color: '#ff6075', detail: 'Liquidity collapse, creator exit or terminal flow state.' },
]

export const historicalNarratives = [
  { id: 'ai-agents', name: 'AUTONOMOUS AI AGENTS', stage: 'ACCELERATING', velocity: 8.7, launches: 2841, wallets: 418, kol: 23, migration: 3.8, survival: 28.4, lead: '41m', series: [12,14,16,15,21,24,31,37,44,58,71,84] },
  { id: 'gpu-cults', name: 'GPU / COMPUTE CULTS', stage: 'EMERGING', velocity: 6.4, launches: 1268, wallets: 206, kol: 11, migration: 4.1, survival: 31.7, lead: '1h 12m', series: [8,9,11,10,13,17,19,26,35,47,59,70] },
  { id: 'animals', name: 'ANIMAL ROTATION', stage: 'SATURATED', velocity: 2.1, launches: 6839, wallets: 792, kol: 37, migration: 1.6, survival: 17.2, lead: '18m', series: [62,67,72,75,74,78,80,79,81,82,80,83] },
  { id: 'political', name: 'POLITICAL REFLEX', stage: 'EVENT-DRIVEN', velocity: 4.9, launches: 1944, wallets: 311, kol: 28, migration: 2.7, survival: 21.1, lead: '27m', series: [18,15,17,22,19,25,31,29,46,61,54,68] },
  { id: 'internet-lore', name: 'INTERNET LORE REVIVAL', stage: 'REACTIVATING', velocity: 5.6, launches: 992, wallets: 184, kol: 16, migration: 3.3, survival: 25.8, lead: '53m', series: [14,12,15,19,18,24,29,36,42,51,57,66] },
  { id: 'celebrity', name: 'CELEBRITY PROXY', stage: 'DECAYING', velocity: -3.8, launches: 2376, wallets: 355, kol: 31, migration: .8, survival: 9.4, lead: '09m', series: [81,79,75,72,66,59,53,47,39,33,28,23] },
]

export const influenceClusters = [
  { id: 'W-017', type: 'WALLET COHORT', signals: 184, hitRate: 38.6, medianLead: '23m', pnl: '+412%', narrative: 'AI AGENTS', confidence: 91 },
  { id: 'K-042', type: 'KOL CLUSTER', signals: 96, hitRate: 34.1, medianLead: '11m', pnl: '+286%', narrative: 'POLITICAL', confidence: 86 },
  { id: 'W-108', type: 'FUNDER GRAPH', signals: 73, hitRate: 31.8, medianLead: '38m', pnl: '+244%', narrative: 'GPU CULTS', confidence: 83 },
  { id: 'K-019', type: 'KOL CLUSTER', signals: 142, hitRate: 29.7, medianLead: '08m', pnl: '+198%', narrative: 'ANIMALS', confidence: 79 },
  { id: 'W-221', type: 'CREATOR LINEAGE', signals: 58, hitRate: 27.4, medianLead: '1h 04m', pnl: '+173%', narrative: 'LORE', confidence: 76 },
]

export const cohortHistory = [
  { cohort: 'AUG 25', launches: 18427, migration: 1.94, x5: 1.13, rug: 27.8, survival: 16.4, signal: 78 },
  { cohort: 'AUG 24', launches: 17682, migration: 1.81, x5: .96, rug: 29.1, survival: 15.7, signal: 71 },
  { cohort: 'AUG 23', launches: 20114, migration: 2.12, x5: 1.28, rug: 25.9, survival: 18.2, signal: 83 },
  { cohort: 'AUG 22', launches: 16938, migration: 1.63, x5: .84, rug: 31.4, survival: 13.8, signal: 64 },
  { cohort: 'AUG 21', launches: 19271, migration: 2.04, x5: 1.17, rug: 26.7, survival: 17.5, signal: 80 },
  { cohort: 'AUG 20', launches: 17409, migration: 1.76, x5: .91, rug: 30.2, survival: 14.6, signal: 69 },
]

export function scaleHistoricalCount(windowKey, rate) {
  return Math.round(historicalWindows[windowKey].launches * rate / 100)
}

