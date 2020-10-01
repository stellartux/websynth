export class LEB128 extends Uint8Array {
  /**
   * Encodes the given value as a LEB128 byte array
   * @param {number|string|bigint} value of the number to be converted
   **/
  constructor(value) {
    const type = typeof value
    if (type !== 'bigint') {
      if (value < Math.pow(2, 31) && value >= -Math.pow(2, 31)) {
        // @ts-ignore
        value |= 0
      } else {
        value = BigInt(
          // @ts-ignore
          type === 'string' ? value.match(/^-?\d+/)[0] : Math.floor(value)
        )
      }
    }
    const masks = typeof value === 'bigint' ? [0x7fn, 7n] : [0x7f, 7]
    const result = []
    while (true) {
      // @ts-ignore
      const byte = Number(value & masks[0])
      // @ts-ignore
      value >>= masks[1]
      if (value == (byte & 0x40 ? -1 : 0)) {
        result.push(byte)
        super(result)
        return this
      }
      result.push(byte | 0x80)
    }
  }

  /**
   * @param {LEB128} input
   * @returns {number}
   */
  static toInt32(input) {
    if (input.length > 5) throw Error('Input too large')
    let result = 0
    let shift = 0
    for (let i = 0; i < input.length; i++) {
      const byte = input[i]
      result |= (byte & 0x7f) << shift
      shift += 7
      if (shift < 32 && (byte & 0xc0) === 0x40) {
        result |= ~0 << shift
      }
    }
    return result
  }

  /**
   * @param {LEB128} input in LEB128 format, an array of bytes
   * @returns {bigint}
   **/
  static toBigInt(input) {
    let result = 0n
    let shift = 0n
    for (let i = 0; i < input.length; i++) {
      const byte = input[i]
      result |= BigInt(byte & 0x7f) << shift
      shift += 7n
      if ((byte & 0xc0) === 0x40) {
        result |= ~0n << shift
      }
    }
    return result
  }

  /**
   * @param {LEB128} input 
   */
  static toString(input) {
    return (window.BigInt !== undefined
      ? LEB128.toBigInt(input).toString()
      : LEB128.toInt32(input).toString())
  }
}
