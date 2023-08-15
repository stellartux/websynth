//@ts-check
import { tokenizer } from "./lookahead.js"

export class ComplexNumber {
  /** @type {number} */ re
  /** @type {number} */ im
  /**
   * @param {number|ComplexNumber} re
   * @param {number} [im=0]
   */
  constructor(re, im = 0) {
    if (typeof re === 'string' && !isNaN(re)) re = Number(re)
    if (typeof im === 'string' && !isNaN(im)) im = Number(im)
    if (typeof re === 'number') {
      this.re = re
      this.im = im
    } else if (re instanceof ComplexNumber) {
      this.re = re.re
      this.im = re.im
    } else {
      throw new TypeError('re must be a number.')
    }
    if (typeof im !== 'number') throw new TypeError('im must be a number.')
  }
  /** @param {number|ComplexNumber?} that */
  ['+'](that) {
    if (that instanceof ComplexNumber || typeof that === 'number') {
      return new ComplexNumber(this)['+='](that)
    } else if (that === undefined) {
      return this
    } else {
      throw new TypeError('Unexpected ' + typeof that)
    }
  }
  /** @param {number|ComplexNumber} that */
  ['+='](that) {
    if (that instanceof ComplexNumber) {
      this.re += that.re
      this.im += that.im
    } else if (typeof that === 'number') {
      this.re += that
    } else {
      throw new TypeError('Unexpected ' + typeof that)
    }
    return this
  }
  /** @param {number|ComplexNumber?} that */
  ['-'](that) {
    if (that instanceof ComplexNumber || typeof that === 'number') {
      return new ComplexNumber(this)['-='](that)
    } else if (that === undefined) {
      return new ComplexNumber(-this.re, -this.im)
    } else {
      throw new TypeError('Unexpected ' + typeof that)
    }
  }
  /** @param {number|ComplexNumber} that */
  ['-='](that) {
    if (that instanceof ComplexNumber) {
      const a = this.re, b = this.im, c = that.re, d = that.im
      return new ComplexNumber(a - c, b - d)
    } else if (typeof that === 'number') {
      return new ComplexNumber(this.re - that, this.im)
    } else {
      throw new TypeError('Unexpected ' + typeof that)
    }
  }
  /** @param {number|ComplexNumber} that */
  ['*'](that) {
    return new ComplexNumber(this)['*='](that)
  }
  /** @param {number|ComplexNumber} that */
  ['*='](that) {
    if (that instanceof ComplexNumber) {
      const a = this.re, b = this.im, c = that.re, d = that.im
      this.re = a * c - b * d
      this.im = b * c + a * d
    } else if (typeof that === 'number') {
      this.re *= that
      this.im *= that
    } else {
      throw new TypeError('Unexpected ' + typeof that)
    }
    return this
  }
  /** @param {ComplexNumber} that */
  ['/'](that) {
    const a = this.re, b = this.im, c = that.re, d = that.im
    const q = c ** 2 + d ** 2
    // for pragmatic reasons `x / 0 === 0`
    if (q === 0) return new ComplexNumber(0)
    return new ComplexNumber((a * c + b * d) / q, (b * c - a * d) / q)
  }
  /** @param {ComplexNumber} that */
  ['^'](that) {
    if (this.im === 0) {
      if (that.im === 0) {
        return new ComplexNumber(this.re ** that.re)
      } else {
        return that['*'](new ComplexNumber(Math.log(this.re))).exp()
      }
    } else if (that.im === 0 && that.re > 0 && Number.isSafeInteger(that.re)) {
      let result = new ComplexNumber(1)
      let temp = new ComplexNumber(this)
      for (let power = that.re; power > 0; power >>>= 1) {
        if (power & 1) {
          result['*='](temp)
        }
        temp['+='](temp)
      }
      return result
    } else {
      throw new Error('Unimplemented exponentiation type')
    }
  }
  /** @param {ComplexNumber} that */
  ['=='](that) {
    return this.re === that.re && this.im === that.im
  }
  abs() {
    return new ComplexNumber(Math.hypot(this.re, this.im))
  }
  ["'"]() {
    return new ComplexNumber(this.re, -this.im)
  }
  exp() {
    const a = this.re, b = this.im, e = Math.E
    return new ComplexNumber(Math.cos(b), Math.sin(b))['*'](new ComplexNumber(e ** a))
  }
  /** @returns {ComplexNumber} the square roots are `result` and `result.conj` */
  sqrt() {
    const a = this.re, b = this.im, h = Math.hypot(a, b), sgn = (b >= 0 ? 1 : -1)
    return new ComplexNumber(Math.sqrt((a + h) / 2), sgn * Math.sqrt((-a + h) / 2))
  }
  toString() {
    return `ComplexNumber(${this.re}, ${this.im})`
  }
  get [Symbol.toStringTag]() {
    const im = Math.abs(this.im)
    if (im !== 0) {
      return `${this.re} ${this.im >= 0 ? '+' : '-'} ${im === 1 ? '' : im}i`
    } else {
      return this.re.toString()
    }
  }
  /** @param {string} json */
  static fromJSON(json) {
    const { re, im } = JSON.parse(json)
    return new ComplexNumber(re, im)
  }
  toMathML(brackets = false) {
    if (this.im === 0) {
      return `<mn>${this.re}</mn>`
    } else if (this.re === 0) {
      return `<mn>${this.im === 1 ? '' : this.im}i</mn>`
    } else {
      const im = Math.abs(this.im)
      return `<mrow>${brackets ? '<mo>(</mo>' : ''
        }<mn>${this.re
        }</mn><mo>${this.im > 0 ? '+' : '-'
        }</mo><mn>${im === 1 ? '' : im}</mn><mi>i</mi>${brackets ? '<mo>)</mo>' : ''
        }</mrow>`
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

const tokenize = tokenizer(/\d+(\.\d+)?|\*\*?|[+\-\/()^'πℯ]|im?|[jkN]|abs|e(xp)?|pi|sqrt/g)

/** @param {string} code */
export function validate(code) {
  return /\S/.test(code) && /^(\d+(\.\d+)?|\*\*?|[+\-\/()^'πℯ]|im?|[jkN]|abs|e(xp)?|pi|sqrt|\s)*$/.test(code)
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
    if (tokens[0] && /^[[:alpha:]_]+$/.test(tokens[0])) {
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
export function mathML(expr, parentOperator = '*', lhs = true) {
  /** @param {string[]} result */
  function addBracketsToResult(result) {
    result.splice(1, 0, '<mo>(</mo>')
    result.splice(-1, 0, '<mo>)</mo>')
  }
  if (typeof expr === 'string') {
    if (expr === 'pi') {
      expr = 'π'
    } else if (expr === 'e') {
      expr = '𝑒'
    }
    return `<mi>${expr}</mi>`
  }
  const needsBrackets = () => parentOperator === '*' || parentOperator === "'" || (parentOperator === '^' && lhs)
  if (Array.isArray(expr)) {
    const op = expr[0]
    if (op === '/') {
      return `<mfrac>${mathML(expr[1], op)}${mathML(expr[2], op, false)}</mfrac>`
    } else if (op === '^') {
      return `<msup>${mathML(expr[1], op)}${mathML(expr[2], op, false)}</msup>`
    } else if (op === '+' || op === '-') {
      let result = ['<mrow>', '<mo>', op, '</mo>', '</mrow>']
      if (expr[2] === undefined) {
        result.splice(-1, 0, mathML(expr[1], op))
      } else {
        result.splice(1, 0, mathML(expr[1], op))
        result.splice(-1, 0, mathML(expr[2], op, false))
      }
      if (needsBrackets()) addBracketsToResult(result)
      return result.join('')
    } else if (op === '*') {
      let result = ['<mrow>', mathML(expr[1], op), mathML(expr[2], op, false), '</mrow>']
      if (!(op === '*' && typeof expr[2] === 'string' && expr[1] instanceof ComplexNumber && expr[1].im === 0)) {
        result.splice(2, 0, '<mo>·</mo>')
        if (parentOperator === '*' && !lhs || parentOperator === "'" || (parentOperator === '^' && lhs)) {
          addBracketsToResult(result)
        }
      }
      return result.join('')
    } else if (op === 'sqrt') {
      return `<msqrt>${mathML(expr[1], op)}</msqrt>`
    } else if (op === "'") {
      return `<mrow>${mathML(expr[1], op)}<mo>'</mo></mrow>`
    } else {
      return `<mrow>${mathML(op)}<mo stretchy="false">(</mo>${mathML(expr[1], op)}<mo stretchy="false">)</mo></mrow>`
    }
  } else if (expr instanceof ComplexNumber) {
    return expr.toMathML(needsBrackets())
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

/** @param {string} code */
export function parse(code) {
  const tokens = tokenize(code)
  const expr = binop(tokens)
  if (tokens.next().value) {
    throw new Error('Excess tokens.')
  }
  return evaluate(expr, { im, i: im, j: im })
}

/**
 * @param {Expr} expr
 * @param {Record<string, ComplexNumber>} ctx
 */
export function evaluate(expr, ctx = constants) {
  if (Array.isArray(expr)) {
    const [left, right] = expr.slice(1).map((arg) => evaluate(arg, ctx))
    if (left instanceof ComplexNumber && (right instanceof ComplexNumber || right === undefined)) {
      return left[expr[0]](right)
    } else if (right) {
      return [expr[0], left, right]
    } else {
      return [expr[0], left]
    }
  } else if (typeof expr === 'string') {
    if (expr in ctx) {
      return ctx[expr]
    } else {
      return expr
    }
  } else if (expr instanceof ComplexNumber) {
    return expr
  } else {
    throw new Error(`Unexpected ${typeof expr}: ${expr}`)
  }
}
