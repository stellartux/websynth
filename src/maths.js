//@ts-check
import { tokenizer } from "./lookahead.js"

export class ComplexNumber {
  #re
  #im
  /**
   * @param {number} re
   * @param {number} [im=0]
   */
  constructor(re, im = 0) {
    this.#re = re
    this.#im = im
  }
  get re() {
    return this.#re
  }
  get im() {
    return this.#im
  }
  /** @param {ComplexNumber?} that */
  ['+'](that) {
    if (that instanceof ComplexNumber) {
      const a = this.#re, b = this.#im, c = that.#re, d = that.#im
      return new ComplexNumber(a + c, b + d)
    } else {
      return this
    }
  }
  /** @param {ComplexNumber?} that */
  ['-'](that) {
    if (that instanceof ComplexNumber) {
      const a = this.#re, b = this.#im, c = that.#re, d = that.#im
      return new ComplexNumber(a - c, b - d)
    } else {
      return new ComplexNumber(-this.#re, -this.#im)
    }
  }
  /** @param {ComplexNumber} that */
  ['*'](that) {
    const a = this.#re, b = this.#im, c = that.#re, d = that.#im
    return new ComplexNumber(a * c - b * d, b * c + a * d)
  }
  /** @param {ComplexNumber} that */
  ['/'](that) {
    const a = this.#re, b = this.#im, c = that.#re, d = that.#im
    const q = c ** 2 + d ** 2
    return new ComplexNumber((a * c + b * d) / q, (b * c - a * d) / q)
  }
  /** @param {ComplexNumber} that */
  ['^'](that) {
    if (this.#im === 0) {
      if (that.im === 0) {
        return new ComplexNumber(this.#re ** that.re)
      } else {
        return that['*'](new ComplexNumber(Math.log(this.#re))).exp()
      }
    } else {
      throw new Error('Unimplemented: exponentiation with complex exponent')
    }
  }
  /** @param {ComplexNumber} that */
  ['=='](that) {
    return this.#re === that.#re && this.#im === that.#im
  }
  abs() {
    return new ComplexNumber(Math.hypot(this.#re, this.#im))
  }
  ["'"]() {
    return new ComplexNumber(this.#re, -this.#im)
  }
  exp() {
    const a = this.#re, b = this.#im, e = Math.E
    return new ComplexNumber(Math.cos(b), Math.sin(b))['*'](new ComplexNumber(e ** a))
  }
  /** @returns {ComplexNumber} the square roots are `result` and `result.conj` */
  sqrt() {
    const a = this.#re, b = this.#im, h = Math.hypot(a, b), sgn = (b >= 0 ? 1 : -1)
    return new ComplexNumber(Math.sqrt((a + h) / 2), sgn * Math.sqrt((-a + h) / 2))
  }
  toString() {
    return `ComplexNumber(${this.#re}, ${this.#im})`
  }
  get [Symbol.toStringTag]() {
    const im = Math.abs(this.#im)
    if (im !== 0) {
      return `${this.#re} ${this.#im >= 0 ? '+' : '-'} ${im === 1 ? '' : im}i`
    } else {
      return this.#re.toString()
    }
  }
  valueOf() {
    return this.#re
  }
  toJSON() {
    return `{"re":${this.#re},"im":${this.#im}}`
  }
  /** @param {string} json */
  static fromJSON(json) {
    const { re, im } = JSON.parse(json)
    return new ComplexNumber(re, im)
  }
  toMathML() {
    if (this.#im === 0) {
      return `<mn>${this.#re}</mn>`
    } else if (this.#re === 0) {
      return `<mn>${this.#im === 1 ? '' : this.#im}i</mn>`
    } else {
      return `<mrow><mn>${this.#re}</mn><mo>${this.#im > 0 ? '+' : '-'}</mo><mn>${Math.abs(this.#im)}</mn><mi>i</mi></mrow>`
    }
  }
}

/** @typedef {string[] | import("./lookahead.js").Lookahead} Tokens */
/** @typedef {Array|ComplexNumber|string} Expr */

/**
 * @param {string} expected 
 * @param {Tokens} tokens
 */
function expect(expected, tokens) {
  const actual = tokens.shift()
  if (expected !== actual) {
    throw new Error(`Expected "${expected}" but got "${actual}"`)
  }
  return tokens
}

const tokenize = tokenizer(/\d+(\.\d+)?|\*\*?|[+\-\/()^']|im?|[jkN]|sqrt|abs|e(xp)?|pi/g)

/** @param {string} code */
export function validate(code) {
  return !/^\s*$/.test(code) && /^(\d+(\.\d+)?|\*\*?|[+\-\/()^']|im?|[jkN]|sqrt|abs|e(xp)?|pi)*$/.test(code)
}

function isImaginaryUnit(token = '') {
  return /^(im?|j)$/.test(token)
}

const operators = {
  '+': { precedence: 1, leftAssociative: true, },
  '-': { precedence: 1, leftAssociative: true, },
  '*': { precedence: 2, leftAssociative: true, },
  '/': { precedence: 2, leftAssociative: true, },
  '^': { precedence: 3, leftAssociative: false, },
  '**': { precedence: 3, leftAssociative: false, alternative: '^', },
  maxPrecedence: 3,
}

function precedenceOf(expr) {
  if (expr instanceof ComplexNumber && expr.im !== 0) {
    return operators['+'].precedence
  } else if (typeof expr === 'string' && expr in operators) {
    return operators[expr].precedence
  } else if (Array.isArray(expr)) {
    return precedenceOf(expr[0])
  } else {
    return operators.maxPrecedence + 1
  }
}

/** @param {Tokens} tokens */
function binop(tokens, precedence = 0) {
  if (precedence > operators.maxPrecedence) {
    return unop(tokens)
  }
  let expr = binop(tokens, precedence + 1)
  for (let operator = operators[tokens[0]];
    operator && operator.precedence === precedence;
    operator = operators[tokens[0]]
  ) {
    let op = tokens.shift()
    if (operator.alternative) op = operator.alternative
    expr = [op, expr, binop(tokens, precedence + operator.leftAssociative)]
  }
  return expr
}

const pi = new ComplexNumber(Math.PI)
const e = new ComplexNumber(Math.E)
const im = new ComplexNumber(0, 1)
const constants = { e, 𝑒: e, pi, π: pi, im, i: im, j: im }

/** @param {Tokens} tokens */
function unop(tokens) {
  let token = tokens.shift()
  if ('+-'.includes(token)) {
    return [token, unop(tokens)]
  } else if (token === '(') {
    const term = binop(tokens)
    tokens.shift()
    return postfix(term, tokens)
  } else if (!isNaN(Number(token))) {
    if (isImaginaryUnit(tokens[0])) {
      tokens.shift()
      return postfix(new ComplexNumber(0, Number(token)), tokens)
    }
    const value = new ComplexNumber(Number(token))
    if (tokens[0] && /^[a-zA-Z_]+$/.test(tokens[0])) {
      return postfix(['*', value, tokens.shift()], tokens)
    } else {
      return postfix(value, tokens)
    }
  } else if (isImaginaryUnit(token)) {
    return postfix(new ComplexNumber(0, 1), tokens)
  } else {
    return postfix(token, tokens)
  }
}

/**
 * @param {Expr} expr 
 * @param {Tokens} tokens
 */
function postfix(expr, tokens) {
  if (tokens[0] === "'") {
    return postfix([tokens.shift(), expr], tokens)
  } else if (typeof expr === 'string' && tokens[0] === '(') {
    tokens.shift()
    return postfix([expr, binop(tokens)], expect(')', tokens))
  } else {
    return expr
  }
}

/**
 * @param {Expr} expr
 * @return {Expr}
 */
export function invert(expr) {
  if (Array.isArray(expr) && expr[0] === '/') {
    if (expr[1] instanceof ComplexNumber && expr[1]['=='](new ComplexNumber(1))) {
      return expr[2]
    }
    return ['/', expr[2], expr[1]]
  } else {
    return ['/', new ComplexNumber(1), expr]
  }
}

/**
 * @param {Expr} expr
 * @return {string}
 */
export function mathML(expr) {
  if (typeof expr === 'string') {
    if (expr === 'pi') {
      expr = 'π'
    } else if (expr === 'e') {
      expr = '𝑒'
    }
    return `<mi>${expr}</mi>`
  }
  if (Array.isArray(expr)) {
    const op = expr[0]
    switch (op) {
      case '/':
        return `<mfrac>${mathML(expr[1])}${mathML(expr[2])}</mfrac>`
      case '^':
        return `<msup>${mathML(expr[1])}${mathML(expr[2])}</msup>`
      case '+': case '-':
        if (expr.length === 2) {
          return `<mrow><mo>${op}</mo>${mathML(expr[1])}</mrow>`
        }
        return `<mrow>${mathML(expr[1])}<mo>${op}</mo>${mathML(expr[2])}</mrow>`
      case '*':
        if (op === '*' && typeof expr[2] === 'string' && expr[1] instanceof ComplexNumber && expr[1].im === 0) {
          return `<mrow>${mathML(expr[1])}${mathML(expr[2])}</mrow>`
        }
        return `<mrow>${mathML(expr[1])}<mo>·</mo>${mathML(expr[2])}</mrow>`
      case 'sqrt':
        return `<msqrt>${mathML(expr[1])}</msqrt>`
      default:
        return `<mrow>${mathML(op)}<mo stretchy="false">(</mo>${mathML(expr[1])}<mo stretchy="false">)</mo></mrow>`
    }
  } else if (expr instanceof ComplexNumber) {
    return expr.toMathML()
  } else {
    throw new Error(`Unexpected: ${expr}`)
  }
}

/** @param {Expr} expr */
export function sexpr(expr) {
  if (Array.isArray(expr)) {
    return '(' + expr.map(sexpr).join(' ') + ')'
  } else if (expr instanceof ComplexNumber) {
    return `#C(${expr.re} ${expr.im})`
  } else {
    return expr
  }
}

/** @param {Expr} expr */
export function normalize(expr) {
  if (Array.isArray(expr)) {
    const args = expr.slice(1).map(normalize)
    const result = [expr[0], ...args]
    if (args.every((/** @type {any} */ arg) => arg instanceof ComplexNumber)) {
      return evaluate(result)
    } else {
      return result
    }
  } else if (typeof expr === 'string' && expr in constants) {
    return constants[expr]
  } else {
    return expr
  }
}

/** @param {string} code */ 
export function parse(code) {
  const tokens = tokenize(code)
  const expr = binop(tokens)
  if (tokens.next().value) {
    throw new Error('Excess tokens.')
  }
  return expr
}

/**
 * @param {Expr} expr
 * @param {Record<string, ComplexNumber>} ctx
 */
export function evaluate(expr, ctx = constants) {
  if (Array.isArray(expr)) {
    const [left, right] = expr.slice(1).map((arg) => evaluate(arg, ctx))
    if (left instanceof ComplexNumber && right instanceof ComplexNumber) {
      return left[expr[0]](right)
    } else {
      return [expr[0], left, right]
    }
  } else if (typeof expr === 'string') {
    if (expr in ctx) {
      return ctx[expr]
    } else {
      throw new Error(`${expr} is not defined.`)
    }
  } else if (expr instanceof ComplexNumber) {
    return expr
  } else {
    throw new Error(`Unexpected ${typeof expr}: ${expr}`)
  }
}
