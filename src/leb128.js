//@ts-check
export class LEB128 extends Uint8Array {
  /** @param {number|string|bigint} value the number to be converted */
  constructor(value) {
    value = BigInt(value)
    /** @type {number[]} */
    const result = []
    while (true) {
      /** @type {number} */
      const byte = Number(value & 0x7fn)
      value >>= 7n
      if (value === (byte & 0x40 ? -1n : 0n)) {
        result.push(byte)
        super(result)
        return this
      }
      result.push(byte | 0x80)
    }
  }
  toJSON() {
    return [...this]
  }
  toString() {
    return this.valueOf().toString()
  }
  /** @returns {bigint} *///@ts-ignore
  valueOf() {
    let result = 0n
    let shift = 0n
    for (const byte of this) {
      result |= BigInt(byte & 0x7f) << shift
      shift += 7n
      if ((byte & 0xc0) === 0x40) {
        result |= ~0n << shift
      }
    }
    return result
  }
}
