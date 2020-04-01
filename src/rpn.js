import { LEB128 } from './leb128.js'

/**
 * Functions for interpreting Reverse Polish Notation code
 * @namespace RPN
 */
export const RPN = {
  validate: function(code) {
    if (/\)[^\s)]/.test(code)) return false
    code = this.desugar(code)
    return /^((SQRT(1_)?2|LOG10E|LN(2|10)|E|PI|random|abs|sqrt|cbrt|round|a?tan(h|2)?|log|exp|a?sinh?|a?cosh?|floor|ceil|int|trunc|min|max|pow|sign|pick|put|dup|drop|swap|tt|t|-?\d+\.\d+|-?\d+|>>>?|<<|&&|\|\||[-\/+*=&^|~><%])(?: |$))+/.test(
      code
    )
  },
  interpret: function(code, t = 0, tt = 0) {
    if (!this.validate(code)) throw Error('invalid code')
    code = this.desugar(code)
    for (const i of code.split(/\s+/g)) {
      if (/^-?\d+/.test(i)) {
        this.stack.push(Number(i))
      } else {
        let x
        let y
        switch (i) {
          case 't':
            this.stack.push(t)
            break
          case 'tt':
            this.stack.push(tt)
            break
          case '+':
            this.stack.push(this.stack.pop() + this.stack.pop())
            break
          case '-':
            this.stack.push(-this.stack.pop() + this.stack.pop())
            break
          case '*':
            this.stack.push(this.stack.pop() * this.stack.pop())
            break
          case '/':
            this.stack.push((1 / this.stack.pop()) * this.stack.pop())
            break
          case '%':
            x = this.stack.pop()
            this.stack.push(this.stack.pop() % x)
            break
          case '~':
            this.stack.push(~this.stack.pop())
            break
          case '>>':
            x = this.stack.pop()
            this.stack.push(this.stack.pop() >> x)
            break
          case '>>>':
            x = this.stack.pop()
            this.stack.push(this.stack.pop() >>> x)
            break
          case '<<':
            x = this.stack.pop()
            this.stack.push(this.stack.pop() << x)
            break
          case '&&':
            x = this.stack.pop()
            this.stack.push(this.stack.pop() && x)
            break
          case '||':
            x = this.stack.pop()
            this.stack.push(this.stack.pop() || x)
            break
          case '&':
            this.stack.push(this.stack.pop() & this.stack.pop())
            break
          case '|':
            this.stack.push(this.stack.pop() | this.stack.pop())
            break
          case '^':
            this.stack.push(this.stack.pop() ^ this.stack.pop())
            break
          case '>':
            this.stack.push(
              this.stack.pop() > this.stack.pop() ? 0xffffffff : 0
            )
            break
          case '<':
            this.stack.push(
              this.stack.pop() < this.stack.pop() ? 0xffffffff : 0
            )
            break
          case '=':
            this.stack.push(
              this.stack.pop() === this.stack.pop() ? 0xffffffff : 0
            )
            break
          case 'int':
            this.stack.push(parseInt(this.stack.pop()))
            break
          case 'abs':
          case 'floor':
          case 'round':
          case 'sqrt':
          case 'ceil':
          case 'sin':
          case 'cos':
          case 'tan':
          case 'sinh':
          case 'cosh':
          case 'tanh':
          case 'asin':
          case 'acos':
          case 'asinh':
          case 'acosh':
          case 'atan':
          case 'atanh':
          case 'atan2':
          case 'cbrt':
          case 'sign':
          case 'trunc':
            this.stack.push(Math[i](this.stack.pop()))
            break
          case 'log':
          case 'exp':
          case 'min':
          case 'max':
          case 'pow':
            x = this.stack.pop()
            this.stack.push(Math[i](this.stack.pop(), x))
            break
          case 'dup':
            x = this.stack.pop()
            this.stack.push(x)
            this.stack.push(x)
            break
          case 'swap':
            x = this.stack.pop()
            y = this.stack.pop()
            this.stack.push(x)
            this.stack.push(y)
            break
          case 'drop':
            this.stack.pop()
            break
          case 'pick':
            y = this.stack.pop()
            this.stack.push(
              this.stack.data[(this.stack.pointer - y - 1) & 0xff]
            )
            break
          case 'put':
            x = this.stack.pop()
            y = this.stack.pop()
            this.stack.data[(this.stack.pointer - y) & 0xff] = x
            this.stack.push(y)
            break
          case 'E':
          case 'LN2':
          case 'LN10':
          case 'LOG10E':
          case 'PI':
          case 'SQRT1_2':
          case 'SQRT2':
          case 'random':
            this.stack.push(Math[i])
            break
        }
      }
    }
    return this.stack.pop()
  },
  stack: {
    data: Array(256).fill(0),
    pointer: 0,
    pop: function() {
      this.pointer = (this.pointer - 1) & 0xff
      return this.data[this.pointer]
    },
    push: function(val) {
      this.data[this.pointer] = val
      this.pointer = (this.pointer + 1) & 0xff
    },
    reset: function() {
      this.data.fill(0)
      this.pointer = 0
    },
  },
  glitchOpcodes: {
    a: 't',
    b: 'put',
    c: 'drop',
    d: '*',
    e: '/',
    f: '+',
    g: '-',
    h: '%',
    j: '<<',
    k: '>>',
    l: '&',
    m: '|',
    n: '^',
    o: '~',
    p: 'dup',
    q: 'pick',
    r: 'swap',
    s: '<',
    t: '>',
    u: '=',
    '!': '\n',
  },
  /** Tests to make sure the RPN code only contains Glitch compatible keywords */
  isValidGlitchCode: function(code) {
    return /^((pick|put|dup|drop|swap|t|-?\d+|>>|<<||[-\/+*=&^|~><%])(?:\s+|$))+/.test(
      this.desugar(code)
    )
  },
  toGlitchURL: function(code, name = '') {
    code = this.desugar(code)
    if (!this.isValidGlitchCode(code))
      throw Error("Can't be converted to glitch URL")
    return `glitch://${name}!`.concat(
      Array.from(
        code.match(
          /(pick|put|dup|drop|swap|t|-?\d+|>>|<<|\n||[-\/+*=&^|~><%])(\s+|$)/gi
        )
      )
        .map(v => v.trim())
        .map((v, i, a) => {
          if (/\d/.test(v)) {
            const x = v.toString(16).toUpperCase()
            return /\d/.test(a[i + 1]) ? x + '.' : x
          } else {
            return v
          }
        })
        .map(v =>
          Object.values(this.glitchOpcodes).includes(v)
            ? Object.keys(this.glitchOpcodes)[
                Object.values(this.glitchOpcodes).indexOf(v)
              ]
            : v
        )
        .join('')
    )
  },
  fromGlitchURL: function(glitch) {
    const [, name, code] = glitch.match(/^(?:glitch:\/\/)?([^!]*)!(.*)$/)
    return [
      name,
      code
        .match(/[\dA-F]+|[a-hj-u!]/g)
        .map(c =>
          /[\dA-F]+/.test(c) ? parseInt(c, 16) : this.glitchOpcodes[c]
        )
        .join(' ')
        .replace(/\n /g, '\n'),
    ]
  },
  glitchOpnames: {
    '+': 'add',
    '-': 'subtract',
    '*': 'multiply',
    '/': 'divide',
    '%': 'modulo',
    '~': 'bitwiseInvert',
    '>>': 'shiftRight',
    '<<': 'shiftLeft',
    '&': 'bitwiseAnd',
    '|': 'bitwiseOr',
    '^': 'bitwiseXor',
    '=': 'equal',
    '>': 'greaterThan',
    '<': 'lessThan',
    drop: 'drop',
    dup: 'dup',
    swap: 'swap',
    pick: 'pick',
    put: 'put',
  },
  /**
   * Converts s-expressions to RPN stack ordered instructions
   *
   * @param {string} code
   * @returns {string} the desugared code string
   * @example
   * RPN.desugar('(+ 1 1)') // returns '1 1 +'
   * RPN.desugar('(* (+ 2 3) (- 5 1))') // return '3 2 + 5 1 - *'
   **/
  desugar: function(code) {
    while (/\(.*\)/.test(code)) {
      code = code.replace(/\(([^(]+?) ([^()]+)\)/g, '$2 $1')
    }
    return code
  },
  get glitchMachine() {
    delete this.glitchMachine
    fetch('./src/rpn.wasm')
      .then(response => response.arrayBuffer())
      .then(bytes => WebAssembly.instantiate(bytes))
      .then(results => (this.glitchMachine = results.instance.exports))
  },
  set glitchMachine(x) {
    delete this.glitchMachine
    this.glitchMachine = x
  },
  /**
   * Interpret Glitch semantics code with wasm interpreter.
   * If wasm is not supported, falls back to the JS interpreter.
   *
   * @param {string} code the code
   * @param {number} [t = 0] value of t to be used by the passed code
   * @param {string} [outputType = 'byte']
   **/
  glitchInterpret: function(code, t = 0, outputType = 'byte') {
    code = this.desugar(code)
    if (this.isValidGlitchCode(code) && this.glitchMachine) {
      for (const inst of code.split(/\s+/)) {
        if (inst === 't') {
          this.glitchMachine.push(Number(t))
        } else if (inst in this.glitchOpnames) {
          this.glitchMachine[this.glitchOpnames[inst]]()
        } else {
          this.glitchMachine.push(Number(inst))
        }
      }
      switch (outputType) {
        case 'float32':
          return this.glitchMachine.popFloat32()
        case 'float32byte':
          return this.glitchMachine.popFloat32Byte()
        case 'uint32':
          return this.glitchMachine.popUint32()
        case 'byte:':
        default:
          return this.glitchMachine.popByte()
      }
    }
  },
  isValidGlitchURL: function(url) {
    return /^(glitch:\/\/)?[^!]*![a-hj-u!A-F\d.]+$/.test(url)
  },
  glitchToWat: {
    '+': { text: 'i32.add', opcode: [0x6a] },
    '-': { text: 'i32.sub', opcode: [0x6b] },
    '*': { text: 'i32.mul', opcode: [0x6c] },
    '/': { text: 'i32.div_u', opcode: [0x6e] },
    '%': { text: 'i32.rem_u', opcode: [0x70] },
    '~': { text: 'i32.const -1\ni32.xor', opcode: [0x41, 0x7f, 0x73] },
    '>>': { text: 'i32.shr_s', opcode: [0x75] },
    '>>>': { text: 'i32.shr_u', opcode: [0x76] },
    '<<': { text: 'i32.shl', opcode: [0x74] },
    '&': { text: 'i32.and', opcode: [0x71] },
    '|': { text: 'i32.or', opcode: [0x72] },
    '^': { text: 'i32.xor', opcode: [0x73] },
    '=': { text: 'i32.eq', opcode: [0x46] },
    '>': { text: 'i32.gt_u', opcode: [0x4b] },
    '<': { text: 'i32.lt_u', opcode: [0x49] },
    drop: { text: 'drop', opcode: [0x1a] },
    // TODO: swap, dup, pick, put
    t: { text: 'local.get $t', opcode: [0x20, 0x0] },
    tt: { text: 'local.get $tt', opcode: [0x20, 0x1] },
  },
  toWat: function(code) {
    return this.wrapWat(this.tokensToWat(code))
  },
  tokensToWat: function(code) {
    return this.desugar(code)
      .split(/\s+/)
      .map(token => {
        if (token in this.glitchToWat) {
          return this.glitchToWat[token].text
        } else if (/^\d+$/.test(token)) {
          return `i32.const ${token}`
        } else {
          throw Error(`Could not parse ${token}`)
        }
      })
      .join('\n')
  },
  wrapWat: function(code) {
    return `(module (type $t0 (func (param i32 i32) (result i32))) (func $bytebeat
      (export "bytebeat") (type $t0) (param $t i32) (param $tt i32) (result i32)
      ${code}))`
  },
  wasmHeader: [
    0,
    0x61,
    0x73,
    0x6d, // WASM_BINARY_MAGIC
    1,
    0,
    0,
    0, // WASM_BINARY_VERSION
    // section "Type" (1)
    1, // section code
    7, // section size
    1, // num types
    0x60, // func
    2, // num params
    0x7f, // i32
    0x7f, // i32
    1, // num results
    0x7f, // i32
    // section "Function" (3)
    3, // section code
    2, // section size
    1, // num functions
    0, // function 0 signature index
    // section "Export" (7)
    7, // section code
    0xc, // section size
    1, // num exports
    8, // string length
    0x62,
    0x79,
    0x74,
    0x65,
    0x62,
    0x65,
    0x61,
    0x74, // 'bytebeat'
    0, // export kind
    0, // export func index
    0xa, // section code
  ],
  wasmFooter: [
    0, // section code
    0x1e, // section size
    4, // string length
    0x6e,
    0x61,
    0x6d,
    0x65, // custom section name
    1, // function name type
    0xb, // subsection size (guess)
    1, // num functions
    0, // function index
    8, // string length
    0x62,
    0x79,
    0x74,
    0x65,
    0x62,
    0x65,
    0x61,
    0x74, // "bytebeat" func name 0
    2, // local name type
    0xa, // subsection size
    1, // num functions
    0, // function index
    2, // num locals
    0, // local index
    1, // string length
    0x74, // t : local name 0
    1, // local index
    2, // string length
    0x74,
    0x74, // tt : local name 1
  ],
  toWasmBinary: function(code) {
    let func = [0] // local decl count = 0
    for (const token of this.desugar(code).split(/\s+/g)) {
      if (/\d+/.test(token)) {
        func = func.concat(0x41, ...new LEB128(token))
      } else if (token in this.glitchToWat) {
        func = func.concat(...this.glitchToWat[token].opcode)
      } else {
        throw Error(`Could not understand ${token}`)
      }
    }
    func.push(0xb)
    const funcLen = new LEB128(func.length)

    return new Uint8Array([
      ...this.wasmHeader,
      ...new LEB128(func.length + funcLen.length + 1),
      1,
      ...funcLen,
      ...func,
      ...this.wasmFooter
    ])
  },
}

export { RPN as default }
