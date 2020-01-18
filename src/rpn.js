export const RPN = {
  validate: function(code) {
    return /^((SQRT1(_2)?|LOG10E|LN(2|10)|E|PI|random|abs|sqrt|cbrt|round|a?tan(h|2)?|log|exp|a?sinh?|a?cosh?|floor|ceil|int|trunc|min|max|pow|sign|pick|put|dup|drop|swap|tt|t|-?\d+\.\d+|-?\d+|>>|<<|&&|\|\||[-\/+*=&^|~><%])(?: |$))+/.test(
      code
    )
  },
  interpret: function(code) {
    if (!this.validate(code)) throw Error('invalid code')
    for (const i of code.split(' ')) {
      if (/^-?\d+/.test(i)) {
        this.stack.push(Number(i))
      } else {
        let x
        let y
        switch (i) {
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
          case 'floor':
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
    }
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
  isValidGlitchCode: function(code) {
    return /^((pick|put|dup|drop|swap|t|-?\d+|>>|<<|&&|\|\||[-\/+*=&^|~><%])(?: |$))+/.test(
      code
    )
  },
  toGlitchURL: function(code, name = '') {
    if (!this.isValidGlitchCode(code))
      throw Error("Can't be converted to glitch URL")
    return `glitch://${name}!`.concat(
      Array.from(
        code.match(
          /(pick|put|dup|drop|swap|t|-?\d+|>>|<<|&&|\n|\|\||[-\/+*=&^|~><%])( |$)/gi
        )
      )
      .map(v => v.trim())
      .map((v, i, a) => (/\d/.test(v) && /\d/.test(a[i + 1]) ? v + '.' : v))
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
    const [, name, code] = glitch.match(/^glitch:\/\/([^!]*)!(.*)$/)[2]

  }
}
export { RPN as default }
