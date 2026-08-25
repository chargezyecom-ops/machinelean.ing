export const demoSteps = [
  {
    view: 'market', target: '#launch-feed', duration: '00:35',
    eyebrow: '01 / LIVE INGESTION', title: 'Every Pump.fun creation event enters here.',
    what: 'Each row represents a real launch observed on Solana.',
    how: 'Helius listens to Pump.fun program logs. HypeGraph decodes Create events and resolves the mint, creator, slot and transaction.',
    why: 'The system observes a token at birth, before market aggregators and social channels make it obvious.',
  },
  {
    view: 'market', target: '#entity-analysis', duration: '00:45',
    eyebrow: '02 / MARKET ENTITY', title: 'A mint becomes a resolved market entity.',
    what: 'The workspace combines verified OHLCV, volume, liquidity, transaction pressure and market trajectory.',
    how: 'GeckoTerminal and DEX Screener data are refreshed and normalized around the same Pump.fun mint.',
    why: 'It prevents decisions based on one candle or an isolated volume number.',
  },
  {
    view: 'market', target: '#analysis-scores', duration: '00:45',
    eyebrow: '03 / RESEARCH SCORES', title: 'Four scores make market structure legible.',
    what: 'Propagation, narrative velocity, persistence and structural risk are normalized to 100.',
    how: 'The prototype combines price change, volume, liquidity, buy/sell balance and flow inconsistencies with local heuristics.',
    why: 'The rationale is immediately visible. These are transparent research heuristics, not trained ML forecasts.',
  },
  {
    view: 'market', target: '#narrative-map', duration: '00:40',
    eyebrow: '04 / NARRATIVES', title: 'Tokens cluster into live narrative regimes.',
    what: 'Themes concentrating tokens, volume and acceleration rise automatically.',
    how: 'The current system uses public token metadata, lexical rules and market-flow aggregation.',
    why: 'A single pump is noisy; several markets converging around one semantic theme create a stronger research signal.',
  },
  {
    view: 'history', target: '#history-lab', duration: '00:55',
    eyebrow: '05 / HISTORICAL LAB', title: 'Outcome labels define the future training set.',
    what: 'Launches are compared at 5 minutes, 30 minutes, 2 hours and 24 hours: migration, ATH, drawdown, rug and survival.',
    how: 'This section uses an explicitly labelled simulated cohort. The live Helius collector is building the future observed dataset.',
    why: 'Those outcome labels can later train and evaluate a genuine early-detection model.',
  },
  {
    view: 'modules', target: '#feature-suite', duration: '00:50',
    eyebrow: '06 / RESEARCH MODULES', title: 'Twenty modules extend the investigation.',
    what: 'Wallet profiles, creator lineage, sniper cohorts, alerts, replay, liquidity stress, cases and a research copilot.',
    how: 'Local modules compute immediately. Adapter-backed modules abstain cleanly until their evidence source is connected.',
    why: 'The demo presents the intended product surface without fabricating unavailable data or conclusions.',
  },
]
