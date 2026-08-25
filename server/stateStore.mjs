import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dataDirectory = path.resolve('server/data')
const statePath = path.join(dataDirectory, 'state.json')
const temporaryPath = path.join(dataDirectory, 'state.tmp.json')

const emptyState = () => ({ launches: [], alerts: [], cases: [], webhooks: [] })

export async function loadState() {
  await mkdir(dataDirectory, { recursive: true })
  try {
    const parsed = JSON.parse(await readFile(statePath, 'utf8'))
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

export async function saveState(state) {
  await mkdir(dataDirectory, { recursive: true })
  await writeFile(temporaryPath, JSON.stringify(state, null, 2), 'utf8')
  await rename(temporaryPath, statePath)
}
