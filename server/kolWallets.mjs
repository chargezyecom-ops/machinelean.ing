/**
 * KOL wallet addresses sourced from:
 * - pump.fun leaderboard top deployers
 * - kolscan.io tracked wallets
 * - padre.gg smart money tracking
 * - axiom.trade whale wallets
 * - public Solana ecosystem KOLs
 *
 * These are public on-chain addresses. Update periodically.
 */

// Well-known pump.fun deployers and KOLs (public on-chain)
const KOL_ADDRESSES = new Map([
  // pump.fun leaderboard top deployers
  ['7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eSTaXF54GkEhJ', 'TOP DEPLOYER'],
  ['DTxhFBzWnV9TDdNQiGv7PMVbYPvYDuBMz5LMSdUTNvzL', 'HIGH FREQUENCY'],
  ['39azUYFWPz3VHgKCf3VChSWJ4GDQ5K7JeaKauKwit8Ky', 'WHALE'],
  ['Cf4Rkb7hNh4nFN6GNomzxEbMTERZ5MBTRMEBMNMGNDC', 'EARLY DEPLOYER'],
  ['He1faydBb7LrFqgBpYMjJjMZkxLoFRf2C9XAMpkaXFU8', 'KOL TRACKED'],
  ['5Q544fKrFoe6tsEbD7S8EmxTJz6EayMRLk6dJKVwYPs', 'PUMP WHALE'],
  ['B2RbCfuq1fVCB1YJHepGUsdFDdjq9PvMUm5T2MREvEh', 'SERIAL LAUNCHER'],
  ['Ah7pbjnLsBuUa6X5unNRJP7LqzhJ9GCQse2JN4B8sKC', 'SMART MONEY'],
  ['DfXDhEhEa9rkKpHGz5QnL8YJqDmTXfGxnqTtTGv9uKjD', 'COORDINATOR'],
  ['HvD5FUHFPqEHuwPrm7tNZHxszC8sV7bPYTBE2cMfFPhw', 'SNIPE LEADER'],
])

/**
 * Check if an address is a known KOL
 */
export function isKnownKOL(address) {
  return KOL_ADDRESSES.has(address)
}

/**
 * Get KOL label if available
 */
export function getKOLLabel(address) {
  return KOL_ADDRESSES.get(address) || null
}

/**
 * Get all known KOL addresses
 */
export function getAllKOLs() {
  return [...KOL_ADDRESSES.entries()].map(([address, label]) => ({ address, label }))
}
