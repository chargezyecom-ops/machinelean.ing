# HypeGraph data methodology

## Snapshot boundary

The resilience snapshot is frozen at `2026-08-25T08:30:00Z`. Market-level values and pool observations were collected during the same research session and committed as static data so the UI remains useful and reproducible when the live source is unavailable.

This snapshot is now the resilience layer for the live terminal. When DexScreener responds successfully, the war room displays a new `fetchedAt` timestamp and accumulates actual price observations during the browser session. When it fails, the UI visibly returns to `SNAPSHOT FALLBACK` rather than pretending to remain live.

## Near-live universe

Every polling cycle requests the documented DexScreener top boosts, latest boosts, latest profiles and community takeovers, filters them to Solana, deduplicates the mints and resolves the deepest returned pair for up to 28 entities. Polling defaults to 15 seconds and can be changed to 30 seconds or paused. This stays below the documented 60-request-per-minute limit for profile and boost endpoints.

Boost counts represent purchased visibility. They are treated as a feature describing attention-market intervention, not as evidence of organic demand.

## Status vocabulary

### Observed

Values returned by an external source without model transformation: pool volume, liquidity, transaction count, buyer/seller count, FDV, price change, creation time and market-level venue totals.

Observed does not mean canonical. Aggregator values can be stale, duplicated, spoofed or internally inconsistent. The interface therefore keeps the provider name and source link next to the data.

### Simulated

Frontend-only deterministic output used to demonstrate a future ML product:

- Hype μ
- narrative heat and velocity
- persistence
- contamination / poison score
- model confidence
- latent graph edges and normalized chart traces

These values are not trained predictions and must not be used for trading.

### Target state

Infrastructure or model topology intended for a production implementation, including H100 compute, FP8 inference, temporal graph networks and an event feature store. None is claimed as currently provisioned.

## Adversarial filter

The current heuristic combines:

1. volume-to-liquidity turnover;
2. buyer/seller-count asymmetry;
3. extreme one-hour price displacement;
4. available depth as a confidence modifier.

High contamination triggers abstention rather than a positive/negative recommendation. This is an interface policy, not a validated fraud classifier.

## 24h and 48h semantics

The 24h view displays the observed 24-hour pool fields. For CATE, 48 hourly GeckoTerminal candles cover 23–25 August 2026 and yield $46.57M cumulative volume and +46.664% first-close-to-last-close change. If another selected asset has fewer than 48 hours of reliable observations, the UI explicitly says `24H AVAILABLE / 48H COHORT` and does not manufacture a second day of market data.

## Sources

- Pump.fun Explore: https://pump.fun/explore
- Pump.fun official public protocol docs: https://github.com/pump-fun/pump-public-docs
- GeckoTerminal PumpSwap pools: https://www.geckoterminal.com/solana/pumpswap/pools
- DexScreener API reference: https://docs.dexscreener.com/api/reference
- CoinMarketCap PumpSwap market page: https://coinmarketcap.com/exchanges/pumpswap/
- Solana WebSocket PubSub: https://solana.com/docs/rpc/websocket
- Helius streaming quickstart: https://www.helius.dev/docs/data-streaming/quickstart
- X filtered stream: https://docs.x.com/x-api/posts/filtered-stream/introduction
- Galaxy research on Pump.fun, memecoins and KOLs: https://www.galaxy.com/insights/research/memecoins-pump-fun-solana-kols
- Recent multimodal Solana rug-detection paper: https://arxiv.org/abs/2608.20271
- Coordinated sniper-cohort study: https://arxiv.org/abs/2607.02795
- Recent Pump.fun graduation-survival study: https://arxiv.org/abs/2607.02823

## Signal-laboratory policy

All ten laboratories consume the frozen market snapshot and recompute when the user changes the entity or sensitivity. They are deterministic research demonstrators. In particular, the KOL laboratory intentionally returns `ABSTAIN` until an authenticated social-event stream is connected, and the sniper laboratory refuses to attribute wallet identities from aggregate buyer counts.

## Production rule

Do not scrape or depend on undocumented Pump.fun frontend routes in production. Index the Pump and Pump AMM programs from Solana, reconcile them against independent market sources and preserve raw events for replay.
