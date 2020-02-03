/**
 * Functions for interpreting Reverse Polish Notation code
 * @namespace RPN
 */
export const RPN = {
  validate: function(code) {
    if (/\)[^\s)]/.test(code)) return false
    code = this.desugar(code)
    return /^((SQRT1(_2)?|LOG10E|LN(2|10)|E|PI|random|abs|sqrt|cbrt|round|a?tan(h|2)?|log|exp|a?sinh?|a?cosh?|floor|ceil|int|trunc|min|max|pow|sign|pick|put|dup|drop|swap|tt|t|-?\d+\.\d+|-?\d+|>>|<<|&&|\|\||[-\/+*=&^|~><%])(?: |$))+/.test(
      code
    )
  },
  interpret: function(code, t = 0, tt = 0) {
    if (!this.validate(code)) throw Error('invalid code')
    code = this.desugar(code)
    for (const i of code.split(' ')) {
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
}
RPN.glitchInterpret('1')

export { RPN as default }
