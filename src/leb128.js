export class LEB128 extends Uint8Array {
  /**
   * @param {number|string|bigint} value of the number to be converted
   * @returns value encoded as LEB128 byte array
   **/
  constructor(value) {
    const type = typeof value
    if (type !== 'bigint') {
      if (value < Math.pow(2, 31) && value >= -Math.pow(2, 31)) {
        value |= 0
      } else {
        value = BigInt(
          type === 'string' ? value.match(/^-?\d+/)[0] : Math.floor(value)
        )
      }
    }
    const masks = type === 'bigint' ? [0x7fn, 7n] : [0x7f, 7]
    const result = []
    while (true) {
      const byte = Number(value & masks[0])
      value >>= masks[1]
      if (value == (byte & 0x40 ? -1 : 0)) {
        result.push(byte)
        super(result)
        return this
      }
      result.push(byte | 0x80)
    }
  }
  static toInt32(input) {
    if (input.length > 5) throw Error('In')
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
   * @param {number[]} input in LEB128 format, an array of bytes
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
  static toString(input) {
    return BigInt
      ? LEB128.toBigInt(input).toString()
      : LEB128.toInt32(input).toString()
  }
}
