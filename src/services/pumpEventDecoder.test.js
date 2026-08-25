import bs58 from 'bs58'
import { describe, expect, it } from 'vitest'
import { decodePumpCreateEvent, extractPumpCreateEvents, PUMP_CREATE_EVENT_DISCRIMINATOR } from './pumpEventDecoder.js'

const concat = (...arrays) => Uint8Array.from(arrays.flatMap((array) => [...array]))
const u32 = (value) => { const bytes = new Uint8Array(4); new DataView(bytes.buffer).setUint32(0, value, true); return bytes }
const u64 = (value) => { const bytes = new Uint8Array(8); new DataView(bytes.buffer).setBigUint64(0, BigInt(value), true); return bytes }
const i64 = (value) => { const bytes = new Uint8Array(8); new DataView(bytes.buffer).setBigInt64(0, BigInt(value), true); return bytes }
const string = (value) => { const bytes = new TextEncoder().encode(value); return concat(u32(bytes.length), bytes) }
const key = (seed) => Uint8Array.from({ length: 32 }, (_, index) => (seed + index) % 256)

function fixture() {
  return concat(
    PUMP_CREATE_EVENT_DISCRIMINATOR,
    string('Neural Frog'), string('NFROG'), string('https://example.com/meta.json'),
    key(1), key(2), key(3), key(4), i64(1_777_777_777),
    u64(1), u64(2), u64(3), u64(1_000_000_000), key(5),
    Uint8Array.of(1, 0), key(6), u64(7),
  )
}

describe('Pump official CreateEvent decoder', () => {
  it('decodes the current public IDL schema', () => {
    const decoded = decodePumpCreateEvent(fixture())
    expect(decoded).toMatchObject({
      name: 'Neural Frog', symbol: 'NFROG', uri: 'https://example.com/meta.json',
      mint: bs58.encode(key(1)), creator: bs58.encode(key(4)), timestamp: 1_777_777_777,
      tokenTotalSupply: '1000000000', isMayhemMode: true, isCashbackEnabled: false,
      quoteMint: bs58.encode(key(6)), virtualQuoteReserves: '7',
    })
  })

  it('ignores unrelated Anchor events and extracts only CreateEvent logs', () => {
    const encoded = Buffer.from(fixture()).toString('base64')
    const events = extractPumpCreateEvents(['Program log: Instruction: Buy', 'Program data: AAAAAAAAAAAAAA==', `Program data: ${encoded}`])
    expect(events).toHaveLength(1)
    expect(events[0].symbol).toBe('NFROG')
  })
})
