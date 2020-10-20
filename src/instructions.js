import { LEB128 } from './leb128.js'

/**
* Instr
**/
export const instructions = [
  {
    name: '+',
    longName: 'add',
    glitchURL: 'f',
    wasm: [0x6a],
    wat: 'i32.add',
    fn: stack => stack.push(stack.pop() + stack.pop()),
    params: 2,
    results: 1,
    description: 'Pops two numbers from the stack and adds them together.',
  },
  {
    name: '-',
    longName: 'subtract',
    glitchURL: 'g',
    wasm: [0x6b],
    wat: 'i32.sub',
    fn: stack => stack.push(-stack.pop() + stack.pop()),
    params: 2,
    results: 1,
    description:
      'Pops two numbers from the stack and subtracts the first from the second.',
  },
  {
    name: '*',
    longName: 'multiply',
    glitchURL: 'd',
    wasm: [0x6c],
    wat: 'i32.mul',
    fn: stack => stack.push(stack.pop() * stack.pop()),
    params: 2,
    results: 1,
    description: 'Pops two numbers from the stack and multiplies them.',
  },
  {
    name: '/',
    longName: 'divide',
    glitchURL: 'e',
    wasm: [0x6e],
    wat: 'i32.div_u',
    fn: stack => stack.push((1 / stack.pop()) * stack.pop()),
    params: 2,
    results: 1,
    description:
      'Pops two numbers from the stack and divides the second by the first.',
  },
  {
    name: '%',
    longName: 'modulo',
    glitchURL: 'h',
    wasm: [0x70],
    wat: 'i32.rem_u',
    fn: stack => {
      const x = stack.pop()
      return stack.push(stack.pop() % x)
    },
    params: 2,
    results: 1,
    description:
      'Pops two numbers from the stack and return the remainder of dividing the second by the first.',
  },
  {
    name: '~',
    longName: 'bitwiseInvert',
    glitchURL: 'o',
    wasm: [0x41, 0x7f, 0x73],
    wat: 'i32.const -1\ni32.xor',
    fn: stack => stack.push(~stack.pop()),
    params: 1,
    results: 1,
    description:
      'Pops a number from the stack and returns its bitwise inversion.',
  },
  {
    name: '<<',
    longName: 'shiftLeft',
    glitchURL: 'j',
    wasm: [0x74],
    wat: 'i32.shl',
    fn: stack => {
      const x = stack.pop()
      return stack.push(stack.pop() << x)
    },
    params: 2,
    results: 1,
    description:
      'Pops a number and shifts the next number left by that number of bits.',
  },
  {
    name: '>>',
    longName: 'shiftRight',
    glitchURL: 'k',
    wasm: [0x75],
    wat: 'i32.shr_s',
    fn: stack => {
      const x = stack.pop()
      return stack.push(stack.pop() >> x)
    },
    params: 2,
    results: 1,
    description:
      'Pops a number and shifts the next number right by that amount, maintaining sign.',
  },
  {
    name: '>>>',
    wasm: [0x76],
    wat: 'i32.shr_u',
    fn: stack => {
      const x = stack.pop()
      return stack.push(stack.pop() >>> x)
    },
    params: 2,
    results: 1,
    description:
      'Pops a number and shifts the next number right by that amount, left-padding with zeroes.',
  },
  {
    name: '&',
    longName: 'bitwiseAnd',
    glitchURL: 'l',
    wasm: [0x71],
    wat: 'i32.and',
    fn: stack => stack.push(stack.pop() & stack.pop()),
    params: 2,
    results: 1,
    description: 'Pops two numbers and returns their bitwise AND.',
  },
  {
    name: '|',
    longName: 'bitwiseOr',
    glitchURL: 'm',
    wasm: [0x72],
    wat: 'i32.or',
    fn: stack => stack.push(stack.pop() | stack.pop()),
    params: 2,
    results: 1,
    description: 'Pops two numbers and returns their bitwise OR.',
  },
  {
    name: '^',
    longName: 'bitwiseXor',
    glitchURL: 'n',
    wasm: [0x73],
    wat: 'i32.xor',
    fn: stack => stack.push(stack.pop() ^ stack.pop()),
    params: 2,
    results: 1,
    description: 'Pops two numbers and returns their bitwise XOR.',
  },
  {
    name: '=',
    longName: 'equal',
    glitchURL: 'u',
    wasm: [0x46],
    wat: 'i32.eq',
    fn: stack => stack.push(stack.pop() === stack.pop() ? 0xffffffff : 0),
    params: 2,
    results: 1,
    description:
      "Pops two numbers and returns 0xffffffff if they're equal, otherwise returns 0.",
  },
  {
    name: '<',
    longName: 'lessThan',
    glitchURL: 's',
    wasm: [0x49],
    wat: 'i32.lt_u',
    fn: stack => stack.push(stack.pop() < stack.pop() ? 0xffffffff : 0),
    params: 2,
    results: 1,
    description:
      'Pops two numbers and returns 0xffffffff if the first is less than the second, otherwise returns 0.',
  },
  {
    name: '>',
    longName: 'greaterThan',
    glitchURL: 't',
    wasm: [0x4b],
    wat: 'i32.gt_u',
    fn: stack => stack.push(stack.pop() > stack.pop() ? 0xffffffff : 0),
    params: 2,
    results: 1,
    description:
      'Pops two numbers and returns 0xffffffff if the first is greater than the second, otherwise returns 0.',
  },
  {
    name: 'drop',
    longName: 'drop',
    glitchURL: 'c',
    wasm: [0x1a],
    wat: 'drop',
    fn: stack => stack.pop(),
    params: 0,
    results: 1,
    description:
      'Pops two numbers and returns 0xffffffff if the first is less than the second, otherwise returns 0.',
  },
  {
    name: '\n',
    glitchURL: '!',
  },
  {
    name: 'dup',
    longName: 'dup',
    fn: stack => {
      const x = stack.pop()
      stack.push(x)
      return stack.push(x)
    },
    params: 1,
    results: 2,
    description: 'Pops a number from the stack and pushes it back twice.',
  },
  {
    name: 'swap',
    longName: 'swap',
  },
  {
    name: 'pick',
    longName: 'pick',
  },
  {
    name: 'put',
    longName: 'put',
  },
  {
    name: /\bt\b/,
    longName: 't',
    glitchURL: 'a',
    wasm: [0x20, 0],
    wat: 'local.get 0',
    fn: (stack, t) => stack.push(t),
    params: 1,
    results: 0,
    description: 'Pushes the first parameter (t) onto the stack.',
  },
  {
    name: /\btt\b/,
    longName: 'tt',
    wasm: [0x20, 1],
    wat: 'local.get 1',
    fn: (stack, t, tt) => stack.push(tt),
    params: 1,
    results: 0,
    description:
      'Pushes the second parameter (tempo-synced t) onto the stack.',
  },
  {
    name: /^-?\d+/,
    wasm: d => [0x41].concat(...new LEB128(d)),
    wat: d => `i32.const ${d}`,
    fn: (stack, t, tt, d) => stack.push(d),
    params: 1,
    results: 0,
    description: 'Pushes the given number to the stack.',
  },
]

function convert(data, from, to) {

}
