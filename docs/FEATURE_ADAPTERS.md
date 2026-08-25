# HypeGraph feature adapters

The `/app` frontend contains all twenty feature surfaces. Local modules execute in the browser and persist their research state in `localStorage`. Adapter and hybrid modules deliberately abstain from identity, social or trained-model claims until the production API is enabled.

## Browser configuration

```env
VITE_TERMINAL_URL=https://app.hypergraph.ai
VITE_API_BASE_URL=https://api.hypergraph.ai
VITE_RESEARCH_API_ENABLED=true
VITE_SOLANA_WS_URL=wss://stream.hypergraph.ai/solana
VITE_PUMP_COMMITMENT=confirmed
```

Every `VITE_*` value is public. Never place an unrestricted provider key, database credential, wallet secret or webhook signing secret in the frontend.

## Server-only configuration

```env
HELIUS_API_KEY=
SOLANA_RPC_URL=
SOLANA_WS_URL=
POSTGRES_URL=
REDIS_URL=
CLICKHOUSE_URL=
CLICKHOUSE_USER=
CLICKHOUSE_PASSWORD=
GRAPH_DATABASE_URL=
GRAPH_DATABASE_USER=
GRAPH_DATABASE_PASSWORD=
X_BEARER_TOKEN=
TELEGRAM_BOT_TOKEN=
DISCORD_BOT_TOKEN=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
MODEL_GATEWAY_URL=
MODEL_GATEWAY_KEY=
MODEL_REGISTRY_URL=
WEBHOOK_SIGNING_SECRET=
AUTH_JWT_SECRET=
SENTRY_DSN=
```

## API endpoints consumed by the workbench

```text
GET  /v1/wallets/:address/profile
GET  /v1/creators/:address/lineage
GET  /v1/tokens/:mint/snipers
GET  /v1/embeddings/narratives
GET  /v1/cohorts/convergence
GET  /v1/tokens/:mint/lifecycle
POST /v1/alerts
POST /v1/models/survival
GET  /v1/graph/temporal
GET  /v1/entities/:id/impact
GET  /v1/tokens/:mint/integrity
POST /v1/replay
POST /v1/copilot/query
POST /v1/webhooks
POST /v1/webhooks/test
GET  /v1/cases
POST /v1/cases
```

All market and model responses should include:

```json
{
  "observed_at": "ISO-8601",
  "source": ["canonical source identifiers"],
  "freshness_ms": 0,
  "data_status": "observed|derived|model|abstain",
  "confidence": 0,
  "model_version": "optional",
  "evidence_refs": []
}
```

## Low-latency topology

1. Terminate Solana gRPC/WebSocket streams in the backend.
2. Decode and deduplicate Pump events with signature plus instruction index.
3. Write canonical raw events to object storage and normalized events to ClickHouse.
4. Maintain hot token, wallet and narrative state in Redis.
5. Store identities, alerts, cases and user configuration in Postgres.
6. Materialize wallet/entity relationships in a graph database or adjacency tables.
7. Serve browser updates through a sanitized HypeGraph WebSocket without provider credentials.
8. Batch temporal-graph and multimodal inference on GPU, with an explicit abstention response under missing or out-of-distribution inputs.

## Performance targets

- Pump creation event to browser: p95 below 750 ms.
- Market aggregate freshness: below 5 seconds.
- Cached entity profile: p95 below 150 ms.
- Interactive graph query: p95 below 500 ms.
- Copilot first token: p95 below 1.5 seconds.
- No synchronous social or archive-RPC query on a browser request path.
