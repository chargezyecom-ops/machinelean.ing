/**
 * Shared formatting utilities for machinelearn.ing
 */
const compactIntl = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const compactShort = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const compact = compactIntl
export const compactShortFmt = compactShort

export function signed(value) {
  const num = Number(value || 0)
  const abs = Math.abs(num)
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`
}

export function usd(value) {
  return `$${compactIntl.format(Number(value) || 0)}`
}

export function shortAddress(value) {
  if (!value) return '—'
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

export function formatPrice(value) {
  const price = Number(value || 0)
  if (!price) return '$0.00'
  if (price >= 1) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
  if (price >= 0.001) return `$${price.toFixed(6)}`
  return `$${price.toPrecision(4)}`
}

export function tokenAge(pairCreatedAt) {
  if (!pairCreatedAt) return '—'
  const ms = Date.now() - pairCreatedAt
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return '<1m'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export function tokenState(token) {
  if (!token) return '—'
  if (token.dexId?.includes('pump')) return 'PUMPSWAP'
  const fdv = token.fdv || token.marketCap || 0
  if (fdv > 0 && fdv < 70000) return 'BONDING'
  if (fdv >= 70000 && fdv <= 100000) return 'MIGRATING'
  if (fdv > 100000) return 'ACTIVE'
  return 'UNKNOWN'
}

export function tokenStateColor(state) {
  const map = {
    BONDING: '#d2a45c',
    MIGRATING: '#c981ff',
    PUMPSWAP: '#8fbfc7',
    ACTIVE: '#54f5cf',
    UNKNOWN: '#77827c',
  }
  return map[state] || '#77827c'
}
