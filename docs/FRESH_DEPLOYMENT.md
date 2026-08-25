# Fresh, isolated HypeGraph deployment

This deployment must not reuse personal sessions, browser profiles, credentials or cloud projects.

## Already prepared locally

- Project-local Git identity: `HypeGraph Build Bot <build@hypegraph.local>`.
- Frontend and API development processes through `npm run dev:full`.
- Container definitions for separate web and API services.
- Server-only environment template in `.env.server.example`.
- Browser environment template in `.env.example`.
- Persistent local state for alerts, cases and retained Pump launches.
- Sanitized backend WebSocket so the browser never needs the Solana provider key.

## Human account creation required

Create these accounts specifically for HypeGraph, using a fresh HypeGraph-controlled email address and strong unique credentials:

1. Git repository organization or account.
2. Domain registrar account and the chosen domain.
3. Container-capable web/API hosting account.
4. Archive-capable Solana RPC/gRPC account.
5. Managed Postgres, Redis and ClickHouse projects.
6. Object-storage project.
7. Social developer applications only when KOL ingestion is authorized.
8. GPU/model provider project when trained inference is ready.

Account creation, CAPTCHA, email validation, payment authorization and acceptance of third-party terms must be completed by the human owner. No personal pre-existing session is required or permitted by this deployment plan.

## Local full stack

```bash
npm install
npm run dev:full
```

- Landing: `http://localhost:5175/` when 5173 and 5174 are already occupied; otherwise Vite prints the selected port.
- Terminal: `/app` on the same origin.
- API: `http://localhost:8787/api/health`.

Copy `.env.server.example` to `.env.server` and add the dedicated HypeGraph Solana URLs:

```env
SOLANA_RPC_URL=https://fresh-hypegraph-rpc.example
SOLANA_WS_URL=wss://fresh-hypegraph-stream.example
```

## Container deployment

```bash
docker compose up --build
```

For production, build the web container with:

```text
VITE_TERMINAL_URL=https://app.<domain>
VITE_API_BASE_URL=https://api.<domain>/api
VITE_RESEARCH_API_ENABLED=true
```

Set API secrets only in the API service secret store. Configure `CORS_ORIGINS` with the exact landing and app origins. Mount durable storage at `/app/server/data` until Postgres-backed persistence replaces the file store.

## DNS target layout

```text
<domain>          web container
app.<domain>      web container
api.<domain>      API container
stream.<domain>   API WebSocket/reverse proxy
```

Enable TLS everywhere. The reverse proxy must support WebSocket upgrades for `/api/v1/stream`.
