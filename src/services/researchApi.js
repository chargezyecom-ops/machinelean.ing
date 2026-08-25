const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
export const researchApiEnabled = import.meta.env.VITE_RESEARCH_API_ENABLED === 'true' && Boolean(API_BASE)

async function request(path, options = {}) {
  if (!researchApiEnabled) throw new Error('Research API adapter is disabled')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) throw new Error(`Research API responded ${response.status}`)
  return response.json()
}

export function queryCopilot(payload, signal) {
  return request('/v1/copilot/query', { method: 'POST', body: JSON.stringify(payload), signal })
}

export function testWebhook(payload, signal) {
  return request('/v1/webhooks/test', { method: 'POST', body: JSON.stringify(payload), signal })
}

export function createAlert(payload, signal) {
  return request('/v1/alerts', { method: 'POST', body: JSON.stringify(payload), signal })
}

export function createCase(payload, signal) {
  return request('/v1/cases', { method: 'POST', body: JSON.stringify(payload), signal })
}

export function fetchApiHealth(signal) {
  return request('/health', { signal })
}

export function fetchTokenSocials(mint, symbol, signal) {
  return request(`/v1/tokens/${encodeURIComponent(mint)}/socials?symbol=${encodeURIComponent(symbol || '')}`, { signal })
}
