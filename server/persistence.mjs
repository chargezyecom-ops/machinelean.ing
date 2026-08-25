/**
 * JSON file persistence with atomic writes.
 * Saves state to disk and loads on startup.
 * Uses write-to-temp + rename for crash safety.
 */
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const STATE_FILE = join(DATA_DIR, 'state.json')
const TEMP_FILE = join(DATA_DIR, 'state.tmp.json')

let persistTimer = null
let lastSave = 0
const SAVE_DEBOUNCE = 2000 // 2 seconds
const SAVE_MIN_INTERVAL = 5000 // 5 seconds minimum between saves

export async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

/**
 * Load state from disk. Returns default state if file doesn't exist or is corrupt.
 */
export async function loadFromDisk() {
  await ensureDataDir()
  try {
    if (!existsSync(STATE_FILE)) {
      return { launches: [], walletFlows: {}, kolLabels: {}, tokenCache: {}, lastBackfill: 0 }
    }
    const raw = await readFile(STATE_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    // Ensure all required fields exist
    return {
      launches: Array.isArray(parsed.launches) ? parsed.launches : [],
      walletFlows: parsed.walletFlows || {},
      kolLabels: parsed.kolLabels || {},
      tokenCache: parsed.tokenCache || {},
      lastBackfill: parsed.lastBackfill || 0,
      alerts: parsed.alerts || [],
      cases: parsed.cases || [],
    }
  } catch (err) {
    console.error('[persistence] Failed to load state:', err.message)
    return { launches: [], walletFlows: {}, kolLabels: {}, tokenCache: {}, lastBackfill: 0 }
  }
}

/**
 * Save state to disk (debounced, atomic write).
 */
export function scheduleSave(state) {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => saveToDisk(state), SAVE_DEBOUNCE)
}

/**
 * Immediate save to disk (for shutdown).
 */
export async function saveToDisk(state) {
  await ensureDataDir()
  const now = Date.now()
  if (now - lastSave < SAVE_MIN_INTERVAL) return
  lastSave = now

  try {
    // Build a clean serializable snapshot (no Maps)
    const snapshot = {
      launches: state.launches || [],
      walletFlows: state.walletFlows || {},
      kolLabels: state.kolLabels || {},
      tokenCache: state.tokenCache || {},
      lastBackfill: state.lastBackfill || 0,
      alerts: state.alerts || [],
      cases: state.cases || [],
      savedAt: new Date().toISOString(),
    }
    await writeFile(TEMP_FILE, JSON.stringify(snapshot))
    await rename(TEMP_FILE, STATE_FILE)
  } catch (err) {
    console.error('[persistence] Failed to save state:', err.message)
  }
}
