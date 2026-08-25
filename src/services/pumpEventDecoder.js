import bs58 from 'bs58'

export const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
export const PUMP_CREATE_EVENT_DISCRIMINATOR = Uint8Array.from([27, 114, 169, 77, 222, 235, 99, 118])
export const PUMP_IDL_URL = 'https://github.com/pump-fun/pump-public-docs/blob/main/idl/pump.json'

class BorshReader {
  constructor(bytes) {
    this.bytes = bytes
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    this.offset = 0
  }

  ensure(length) {
    if (this.offset + length > this.bytes.length) throw new Error('Truncated Pump event payload')
  }

  u8() { this.ensure(1); return this.bytes[this.offset++] }
  bool() { return this.u8() === 1 }
  u32() { this.ensure(4); const value = this.view.getUint32(this.offset, true); this.offset += 4; return value }
  u64() { this.ensure(8); const value = this.view.getBigUint64(this.offset, true); this.offset += 8; return value.toString() }
  i64() { this.ensure(8); const value = this.view.getBigInt64(this.offset, true); this.offset += 8; return Number(value) }
  string() { const length = this.u32(); this.ensure(length); const value = new TextDecoder().decode(this.bytes.subarray(this.offset, this.offset + length)); this.offset += length; return value }
  publicKey() { this.ensure(32); const value = bs58.encode(this.bytes.subarray(this.offset, this.offset + 32)); this.offset += 32; return value }
  has(length) { return this.offset + length <= this.bytes.length }
}

function matchesDiscriminator(bytes) {
  return PUMP_CREATE_EVENT_DISCRIMINATOR.every((value, index) => bytes[index] === value)
}

export function base64ToBytes(value) {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(value)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  }
  return Uint8Array.from(Buffer.from(value, 'base64'))
}

/** Decode the canonical Anchor CreateEvent emitted by the Pump program. */
export function decodePumpCreateEvent(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 8 || !matchesDiscriminator(bytes)) return null
  const reader = new BorshReader(bytes.subarray(8))
  const event = {
    name: reader.string(),
    symbol: reader.string(),
    uri: reader.string(),
    mint: reader.publicKey(),
    bondingCurve: reader.publicKey(),
    user: reader.publicKey(),
    creator: reader.publicKey(),
    timestamp: reader.i64(),
  }

  // These fields were appended to the public IDL over time. Keeping the tail
  // optional lets the live decoder survive older archived CreateEvent layouts.
  if (reader.has(8)) event.virtualTokenReserves = reader.u64()
  if (reader.has(8)) event.virtualSolReserves = reader.u64()
  if (reader.has(8)) event.realTokenReserves = reader.u64()
  if (reader.has(8)) event.tokenTotalSupply = reader.u64()
  if (reader.has(32)) event.tokenProgram = reader.publicKey()
  if (reader.has(1)) event.isMayhemMode = reader.bool()
  if (reader.has(1)) event.isCashbackEnabled = reader.bool()
  if (reader.has(32)) event.quoteMint = reader.publicKey()
  if (reader.has(8)) event.virtualQuoteReserves = reader.u64()
  return event
}

export function extractPumpCreateEvents(logMessages = []) {
  const events = []
  for (const message of logMessages) {
    const marker = 'Program data: '
    const markerIndex = message.indexOf(marker)
    if (markerIndex === -1) continue
    try {
      const decoded = decodePumpCreateEvent(base64ToBytes(message.slice(markerIndex + marker.length).trim()))
      if (decoded) events.push(decoded)
    } catch {
      // A busy Pump transaction contains several unrelated Anchor event types.
    }
  }
  return events
}
