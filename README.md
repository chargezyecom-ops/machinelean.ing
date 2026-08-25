# HypeGraph

HypeGraph is a near-live research terminal for mapping attention across Solana, Pump.fun and PumpSwap: narrative propagation, pool microstructure, paid boosts, wallet lineage, KOL impulses and adversarial signal quality.

The primary cockpit polls the public DexScreener API every 15 or 30 seconds, while its launch tape subscribes to the canonical Pump program logs and decodes the official `CreateEvent` IDL. It falls back to the frozen 25 August 2026 snapshot if the market source is unavailable. It is deliberately honest about its epistemic states:

- `OBSERVED` values were collected from external market surfaces and retain direct source links.
- `SIMULATED` scores and graph projections are deterministic frontend heuristics for product demonstration.
- `TARGET STATE` labels describe infrastructure that is designed but not provisioned.

The interface has no trade execution, wallet signing or fabricated “live” feed.

## Run locally

```bash
npm install
npm run dev
```

Run the isolated frontend and local API together:

```bash
npm run dev:full
```

The local landing page is available at `/`; the research workspace is available at `/app`. In production, set `VITE_TERMINAL_URL=https://app.your-domain.tld` and route that hostname to the same frontend bundle. The application automatically renders the terminal on any hostname beginning with `app.`.

Production validation:

```bash
npm run check
```

This runs linting, type checks, the test suite and a production build.

## Product surfaces

- Institutional landing page and GPU-native visual system
- Dedicated `/app` workspace with automatic `app.*` subdomain routing
- Six-layer ML model stack covering multimodal encoding, temporal graphs, regime detection and OOD abstention
- Twenty-module operational workbench with local persistence and production adapter states
- Near-live Solana war room inspired by dense institutional market terminals
- Canonical Pump.fun `CreateEvent` WebSocket stream with mint, creator, transaction and mode flags
- DexScreener boosts, token profiles, community takeovers and best-pair resolution
- Configurable 15s/30s polling, manual sync and session price history
- Live token tape, cross-sectional heatmap, narrative graph and delta event bus
- PumpSwap 24-hour market pulse with source provenance
- Interactive narrative topology and token tensor
- 24h / 48h cohort controls with explicit availability labels
- Per-token inspection, observed pool metrics and source links
- Deterministic Hype, Persistence, Poison and Confidence heuristics
- Adversarial quarantine for suspect volume/depth and participant structures
- Wallet-lineage, KOL-causality and multimodal-encoder product modules
- Signal Laboratory with ten executable, asset-aware research primitives
- Target streaming / feature-store / inference architecture
- SEO, Open Graph, PWA manifest, responsive layout and reduced-motion support

## Data model

The frozen dataset lives in `src/data/marketSnapshot.js`. It includes observed pool-level fields and simulated visual traces. The visible scores are computed by `inferToken()` and are not forecasts.

See [Data methodology](docs/DATA_METHODOLOGY.md) for the exact boundaries and [Integration checklist](docs/INTEGRATION_CHECKLIST.md) for the backend credentials and endpoints still required.
See [Feature adapters](docs/FEATURE_ADAPTERS.md) for the complete twenty-module API, infrastructure and latency contract.
See [Fresh deployment](docs/FRESH_DEPLOYMENT.md) for an account-isolated, container-ready deployment with no reuse of personal sessions.

## Live source policy

The live frontend only calls documented DexScreener endpoints and the standard Solana JSON-RPC/WebSocket interface. Boosts are shown as paid visibility inputs, never as organic sentiment. Axiom Trade and Fomo are not scraped: authenticated/private interfaces require an authorized API or partnership. Pump.fun frontend routes are not a dependency; launches are decoded from the official Pump program and public IDL.

## Pump.fun launch ingestion

The official Pump repository exposes programs, IDLs and SDKs, not a hosted REST endpoint that returns every launch. HypeGraph therefore uses the canonical on-chain source:

- live: `logsSubscribe` on `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`, then Borsh decoding of the official `CreateEvent` discriminator;
- historical: pagination through `getSignaturesForAddress`, transaction retrieval and the same decoder;
- interaction: the official `@pump-fun/pump-sdk` can create or trade, but transaction execution is intentionally not installed in this read-only terminal.

For a small historical sample, configure a Solana RPC and emit newline-delimited JSON:

```bash
SOLANA_RPC_URL=https://your-archive-rpc.example npm run pump:backfill
```

On PowerShell:

```powershell
$env:SOLANA_RPC_URL='https://your-archive-rpc.example'
$env:PUMP_BACKFILL_MAX_PAGES='10'
npm run pump:backfill
```

Set `PUMP_BACKFILL_MAX_PAGES=0` to continue until the provider's retained history is exhausted. A complete backfill requires an archive-capable paid RPC and durable database; the public Solana endpoint rate-limits transaction history and is only a development fallback.

## Signal Laboratory

The ten implemented laboratories are:

1. Narrative arbitrage radar
2. Attention half-life
3. Coordinated sniper-cohort detector
4. KOL causal impulse with mandatory abstention
5. Post-graduation survival proxy
6. Ticker and semantic-collision lens
7. Wash-activity poison firewall
8. Liquidity reflexivity stress test
9. Smart-cohort convergence
10. Counterfactual flow replay

Each laboratory reacts to the selected asset and sensitivity control. Its formula, evidence ledger, provenance status, confidence and limitations stay visible on the same surface.

## Important limitations

- GeckoTerminal and CoinMarketCap are aggregators, not canonical Solana state.
- The Pump.fun frontend endpoint used during research is unofficial and is not a production dependency.
- The 48-hour control is a cohort lens. When a pool does not have 48 hours of observations, the inspector says so instead of extrapolating data.
- KOL identities and wallet clusters are architectural modules only; no real person is ranked in this build.
- Memecoins are highly volatile. This interface is research software, not financial advice.

## Project structure

```text
src/App.jsx                     Main interactive research surface
src/components/LiveTerminal.jsx Near-live market war room
src/index.css                   Responsive HypeGraph design system
src/data/marketSnapshot.js      Frozen observed data + demo inference
src/data/signalLabs.js          Ten deterministic research evaluators
src/hooks/useLiveMarket.js       Polling, price history and delta events
src/hooks/usePumpLaunchStream.js Canonical Pump log subscription
src/services/liveMarketService.js DexScreener join and normalization
src/services/pumpEventDecoder.js Official Pump CreateEvent decoder
scripts/backfill-pump-launches.mjs Historical launch NDJSON export
public/assets/hypegraph-manifold.png
                                Original ImageGen hero artwork
docs/DATA_METHODOLOGY.md        Sources, labels and calculation policy
docs/INTEGRATION_CHECKLIST.md    Production backend handoff
```
