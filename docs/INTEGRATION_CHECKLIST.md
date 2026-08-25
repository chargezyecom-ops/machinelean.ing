# HypeGraph production integration checklist

The frontend is complete as a research snapshot. The items below are the inputs still needed to turn it into a live product.

The public DexScreener cockpit is already near-live and requires no API key. The browser now receives canonical Pump `CreateEvent` records over Solana WebSocket; production retention, complete historical replay, wallet identities and social causality still require the adapters below.

## 1. Solana event ingestion — required

Provide, server-side only:

```env
HELIUS_API_KEY=
SOLANA_RPC_URL=
```

Recommended flow:

- Already implemented for the demo: standard Solana `logsSubscribe` plus the official Pump IDL `CreateEvent` decoder.
- Helius LaserStream/gRPC or enhanced WebSockets for low-latency transactions.
- Solana RPC backfill for missed slots and deterministic replay.
- Pump program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`.
- Pump AMM program: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`.
- Decode creates, buys, sells, migrations, pools, token transfers and fee events.
- Store signature + instruction index as an idempotency key; streaming providers may redeliver events.

Never expose either credential through a `VITE_*` variable.

The public browser variable `VITE_SOLANA_WS_URL` may contain a public, origin-restricted WebSocket URL. For stronger key isolation, terminate the provider stream in the backend and expose a sanitized HypeGraph event channel instead.

## 2. Market reconciliation — required

Choose a licensed provider and provide its server credential if necessary:

```env
COINGECKO_ONCHAIN_API_KEY=
# or
BIRDEYE_API_KEY=
```

Use aggregator data as a reconciliation layer, not the source of truth. Recompute pool reserves, price, transaction count and rolling 5m/1h/6h/24h/48h windows from indexed events. Add anomaly checks for duplicate pools, zero-depth pairs, ticker collisions and wash-like turnover.

Do not scrape authenticated Axiom Trade or Fomo application interfaces. Integrate them only through a documented API, licensed export or explicit partnership agreement.

## 3. Social / narrative stream — required for ML

Provide:

```env
X_BEARER_TOKEN=
TELEGRAM_BOT_TOKEN=
```

The X Filtered Stream can track cashtags, contract addresses, token names, media and curated KOL accounts. Telegram access must only cover channels/bots for which collection is authorized. Store post IDs, timestamps, author IDs and public metrics; do not copy private content.

Production features:

- language identification and spam deduplication;
- token/contract entity resolution;
- image perceptual hashes and multimodal embeddings;
- pre/post-mention event studies;
- bot probability and coordinated-amplification features;
- deletion and retention policy.

## 4. Wallet and KOL graph — required for differentiation

No API key alone solves identity resolution. Build server-side joins for:

- creator and funder ancestry;
- first-funder, co-spend and repeated deployment links;
- token entry/exit timing;
- realized and unrealized PnL with cost-basis rules;
- liquidity-adjusted impact around public mentions;
- confidence-scored identity mappings with an audit trail.

Do not publish defamatory labels or claim that a wallet belongs to a person without strong, reviewable evidence.

## 5. Data platform — required

Provide:

```env
POSTGRES_URL=
REDIS_URL=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
```

Suggested components:

- Postgres/TimescaleDB or ClickHouse for temporal events;
- Redis for hot entity state and stream cursors;
- S3-compatible storage for raw event replay and model artifacts;
- a feature registry with event-time correctness;
- dataset/model lineage and schema versioning.

## 6. ML inference — required before removing `SIMULATED`

Provide a model gateway and GPU environment:

```env
MODEL_GATEWAY_URL=
MODEL_GATEWAY_KEY=
MODEL_REGISTRY_URL=
```

Minimum credible model stack:

- multimodal token/narrative encoder;
- temporal graph neural network over wallet, token, pool, creator and social entities;
- survival/hazard head for graduation and post-graduation persistence;
- out-of-distribution detector and calibrated abstention;
- rolling backtests with time-based splits, leakage checks and regime-specific calibration.

Only replace the demo labels after publishing evaluation windows, baselines, confidence calibration and known failure modes.

## 7. Application API contract

Implement these read-only endpoints behind `VITE_API_BASE_URL`:

```text
GET /v1/snapshot
GET /v1/market/pulse?window=24h
GET /v1/narratives?window=24h|48h
GET /v1/tokens?window=24h|48h&narrative=&cursor=
GET /v1/tokens/:mint
GET /v1/tokens/:mint/series?metric=&window=
GET /v1/wallets/:address/lineage
GET /v1/entities/:id/influence
GET /v1/provenance/:artifactId
POST /v1/labs/:labId/evaluate
```

Every response should include `observed_at`, `source`, `freshness_ms`, `model_version`, `data_status` and `confidence` where relevant.

The laboratory endpoint should accept `mint`, `window`, `sensitivity` and an optional scenario payload. It must return the evaluated feature vector, model or heuristic version, abstention reason, evidence references and calibration metadata. Never collapse missing social or wallet data into zero-valued features.

## 8. Product operations — required before launch

```env
SENTRY_DSN=
ANALYTICS_WRITE_KEY=
STATUSPAGE_ID=
CONTACT_EMAIL=
```

Add rate limiting, auth/RBAC, audit logs, CSP headers, data-retention controls, incident runbooks, backups, uptime alerts and a public status page. Obtain legal review for data licensing, X/Telegram terms, privacy, token communications and financial-risk disclosures.

## Recommended implementation order

1. Onchain ingestion, replay and canonical event schema.
2. Rolling market aggregates and provenance API.
3. Frontend API adapter replacing the frozen snapshot.
4. Social ingestion and entity resolution.
5. Wallet/KOL graph and research labels.
6. Offline ML evaluation and calibrated inference.
7. Production security, observability and legal review.
